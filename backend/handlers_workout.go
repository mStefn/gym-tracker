package main

import (
	"database/sql"
	"errors"
	"log"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type workoutExerciseInput struct {
	ExerciseID   FlexibleInt `json:"exercise_id"`
	ExerciseName string      `json:"exercise_name"`
	Category     string      `json:"category"`
	TargetSets   int         `json:"target_sets"`
}

func StartWorkout(c *gin.Context) {
	var input struct {
		PlanID *int   `json:"plan_id"`
		Name   string `json:"name"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": "Invalid input"})
		return
	}

	userID := c.GetInt("userID")

	name := strings.TrimSpace(input.Name)

	var planName string
	if input.PlanID != nil {
		if !planBelongsToUserID(*input.PlanID, userID) {
			c.JSON(404, gin.H{"error": "Plan not found"})
			return
		}

		if err := db.QueryRow(
			"SELECT name FROM workout_plans WHERE id = $1 AND user_id = $2",
			*input.PlanID,
			userID,
		).Scan(&planName); err != nil {
			c.JSON(404, gin.H{"error": "Plan not found"})
			return
		}

		if name == "" {
			name = planName
		}
	}

	if name == "" {
		name = "Empty Workout"
	}

	// The partial unique index guarantees one active workout per user.
	// We intentionally do not rely on a separate SELECT here because
	// multiple fast requests could otherwise race each other.
	tx, err := db.Begin()
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to start workout"})
		return
	}
	defer tx.Rollback()

	var sessionID int
	var startedAt time.Time

	var planValue any
	if input.PlanID != nil {
		planValue = *input.PlanID
	} else {
		planValue = nil
	}

	err = tx.QueryRow(`
		INSERT INTO workout_sessions (user_id, plan_id, name)
		VALUES ($1, $2, $3)
		RETURNING id, started_at
	`,
		userID,
		planValue,
		name,
	).Scan(&sessionID, &startedAt)

	if err != nil {
		// Another request already created an active workout.
		if strings.Contains(err.Error(), "idx_one_active_workout_per_user") {
			var existingID int

			lookupErr := db.QueryRow(`
				SELECT id
				FROM workout_sessions
				WHERE user_id = $1
				  AND status = 'active'
				ORDER BY started_at DESC
				LIMIT 1
			`, userID).Scan(&existingID)

			if lookupErr == nil {
				c.JSON(409, gin.H{
					"error":      "An active workout already exists",
					"workout_id": existingID,
				})
				return
			}

			c.JSON(409, gin.H{
				"error": "An active workout already exists",
			})
			return
		}

		c.JSON(500, gin.H{
			"error": "Failed to create workout session",
		})
		return
	}

	if input.PlanID != nil {
		if err := copyPlanExercisesToSession(tx, sessionID, *input.PlanID); err != nil {
			log.Printf(
				"StartWorkout: failed to copy plan exercises. user_id=%d plan_id=%d session_id=%d error=%v",
				userID,
				*input.PlanID,
				sessionID,
				err,
			)

			c.JSON(500, gin.H{
				"error": "Failed to load plan exercises",
			})
			return
		}
	}

	if err := tx.Commit(); err != nil {
		c.JSON(500, gin.H{
			"error": "Failed to commit workout",
		})
		return
	}

	// Return the complete workout structure.
	workout, err := loadWorkout(userID, sessionID)
	if err != nil {
		respondWorkoutError(c, err)
		return
	}

	c.JSON(201, workout)
}

func GetActiveWorkout(c *gin.Context) {
	userID := c.GetInt("userID")

	var sessionID int
	err := db.QueryRow(`
		SELECT id
		FROM workout_sessions
		WHERE user_id = $1 AND status = 'active'
		ORDER BY started_at DESC
		LIMIT 1
	`, userID).Scan(&sessionID)
	if err == sql.ErrNoRows {
		c.JSON(200, gin.H{"workout": nil})
		return
	}
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to fetch active workout"})
		return
	}

	workout, err := loadWorkout(userID, sessionID)
	if err != nil {
		respondWorkoutError(c, err)
		return
	}

	c.JSON(200, workout)
}

func GetWorkout(c *gin.Context) {
	userID := c.GetInt("userID")
	sessionID := c.Param("id")

	workoutID, err := parsePositiveInt(sessionID)
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid workout id"})
		return
	}

	workout, err := loadWorkout(userID, workoutID)
	if err != nil {
		respondWorkoutError(c, err)
		return
	}

	c.JSON(200, workout)
}

func AddExerciseToWorkout(c *gin.Context) {
	userID := c.GetInt("userID")
	sessionID, err := parsePositiveInt(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid workout id"})
		return
	}

	var input workoutExerciseInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": "Invalid input"})
		return
	}

	if !workoutOwnedByUser(sessionID, userID) {
		c.JSON(404, gin.H{"error": "Workout not found"})
		return
	}
	if !workoutIsActive(sessionID, userID) {
		c.JSON(409, gin.H{"error": "Workout is not active"})
		return
	}

	if input.TargetSets < 1 {
		input.TargetSets = 1
	}

	exerciseID, err := resolveExercise(int(input.ExerciseID), input.ExerciseName, input.Category)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to resolve exercise"})
		return
	}

	var exists bool
	if err := db.QueryRow(`
		SELECT EXISTS(
			SELECT 1 FROM workout_session_exercises
			WHERE session_id = $1 AND exercise_id = $2
		)
	`, sessionID, exerciseID).Scan(&exists); err != nil {
		c.JSON(500, gin.H{"error": "Failed to check workout exercise"})
		return
	}
	if exists {
		c.JSON(409, gin.H{"error": "Exercise already added to this workout"})
		return
	}

	var position int
	if err := db.QueryRow(
		"SELECT COALESCE(MAX(position), -1) + 1 FROM workout_session_exercises WHERE session_id = $1",
		sessionID,
	).Scan(&position); err != nil {
		c.JSON(500, gin.H{"error": "Failed to determine exercise position"})
		return
	}

	var sessionExerciseID int
	if err := db.QueryRow(`
		INSERT INTO workout_session_exercises (session_id, exercise_id, target_sets, position)
		VALUES ($1, $2, $3, $4)
		RETURNING id
	`, sessionID, exerciseID, input.TargetSets, position).Scan(&sessionExerciseID); err != nil {
		c.JSON(500, gin.H{"error": "Failed to add exercise to workout"})
		return
	}

	c.JSON(201, gin.H{
		"id":          sessionExerciseID,
		"exercise_id": exerciseID,
		"target_sets": input.TargetSets,
		"position":    position,
	})
}

func RemoveExerciseFromWorkout(c *gin.Context) {
	userID := c.GetInt("userID")
	sessionID, err := parsePositiveInt(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid workout id"})
		return
	}
	sessionExerciseID, err := parsePositiveInt(c.Param("session_exercise_id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid session exercise id"})
		return
	}

	if !workoutIsActive(sessionID, userID) {
		c.JSON(409, gin.H{"error": "Workout is not active"})
		return
	}

	result, err := db.Exec(`
		DELETE FROM workout_session_exercises
		WHERE id = $1 AND session_id = $2
	`, sessionExerciseID, sessionID)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to remove exercise"})
		return
	}

	affected, _ := result.RowsAffected()
	if affected == 0 {
		c.JSON(404, gin.H{"error": "Exercise not found in workout"})
		return
	}

	c.JSON(200, gin.H{"status": "removed"})
}

func LogWorkoutSet(c *gin.Context) {
	userID := c.GetInt("userID")
	sessionID, err := parsePositiveInt(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid workout id"})
		return
	}

	var input struct {
		SessionExerciseID int      `json:"session_exercise_id"`
		SetNumber         int      `json:"set_number"`
		Reps              int      `json:"reps"`
		Weight            float64  `json:"weight"`
		IsFailure         bool     `json:"is_failure"`
		NextTargetReps    *int     `json:"next_target_reps"`
		NextTargetWeight  *float64 `json:"next_target_weight"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": "Invalid input"})
		return
	}

	if input.SessionExerciseID <= 0 || input.SetNumber <= 0 || input.Reps < 0 || input.Weight < 0 {
		c.JSON(400, gin.H{"error": "Invalid set values"})
		return
	}
	if !workoutIsActive(sessionID, userID) {
		c.JSON(409, gin.H{"error": "Workout is not active"})
		return
	}

	var exerciseID int
	if err := db.QueryRow(`
		SELECT exercise_id
		FROM workout_session_exercises
		WHERE id = $1 AND session_id = $2
	`, input.SessionExerciseID, sessionID).Scan(&exerciseID); err != nil {
		if err == sql.ErrNoRows {
			c.JSON(404, gin.H{"error": "Workout exercise not found"})
		} else {
			c.JSON(500, gin.H{"error": "Failed to load workout exercise"})
		}
		return
	}

	tx, err := db.Begin()
	if err != nil {
		c.JSON(500, gin.H{"error": "Transaction failed"})
		return
	}
	defer tx.Rollback()

	var existingLogID sql.NullInt64
	err = tx.QueryRow(`
		SELECT log_id
		FROM workout_sets
		WHERE session_exercise_id = $1 AND set_number = $2
		FOR UPDATE
	`, input.SessionExerciseID, input.SetNumber).Scan(&existingLogID)
	if err != nil && err != sql.ErrNoRows {
		c.JSON(500, gin.H{"error": "Failed to load existing set"})
		return
	}

	var logID int
	isNewSet := err == sql.ErrNoRows || !existingLogID.Valid
	if isNewSet {
		if err := tx.QueryRow(`
			INSERT INTO logs (user_id, exercise_id, set_number, reps, weight, is_failure)
			VALUES ($1, $2, $3, $4, $5, $6)
			RETURNING id
		`, userID, exerciseID, input.SetNumber, input.Reps, input.Weight, input.IsFailure).Scan(&logID); err != nil {
			c.JSON(500, gin.H{"error": "Failed to save workout history"})
			return
		}
	} else {
		logID = int(existingLogID.Int64)
		if _, err := tx.Exec(`
			UPDATE logs
			SET reps = $1, weight = $2, is_failure = $3, created_at = CURRENT_TIMESTAMP
			WHERE id = $4 AND user_id = $5
		`, input.Reps, input.Weight, input.IsFailure, logID, userID); err != nil {
			c.JSON(500, gin.H{"error": "Failed to update workout history"})
			return
		}
	}

	_, err = tx.Exec(`
		INSERT INTO workout_sets (
			session_exercise_id, log_id, set_number, reps, weight, is_failure, next_target_reps, next_target_weight
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT (session_exercise_id, set_number)
		DO UPDATE SET
			log_id = EXCLUDED.log_id,
			reps = EXCLUDED.reps,
			weight = EXCLUDED.weight,
			is_failure = EXCLUDED.is_failure,
			next_target_reps = EXCLUDED.next_target_reps,
			next_target_weight = EXCLUDED.next_target_weight,
			completed_at = CURRENT_TIMESTAMP
	`, input.SessionExerciseID, logID, input.SetNumber, input.Reps, input.Weight, input.IsFailure, input.NextTargetReps, input.NextTargetWeight)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to save workout set"})
		return
	}

	// When no new target is supplied, preserve the previous target.
	_, err = tx.Exec(`
		INSERT INTO user_exercise_targets (user_id, exercise_id, set_number, target_reps, target_weight)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (user_id, exercise_id, set_number)
		DO UPDATE SET
			target_reps = COALESCE(EXCLUDED.target_reps, user_exercise_targets.target_reps),
			target_weight = COALESCE(EXCLUDED.target_weight, user_exercise_targets.target_weight),
			updated_at = CURRENT_TIMESTAMP
	`, userID, exerciseID, input.SetNumber, input.NextTargetReps, input.NextTargetWeight)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to save next target"})
		return
	}

	var expGained int
	expGained = int(input.Weight * float64(input.Reps) * 0.1)
	if expGained <= 0 && input.Reps > 0 {
		expGained = input.Reps
	}
	if expGained <= 0 {
		expGained = 1
	}

	// Re-saving an already completed set must not grant XP twice.
	if !isNewSet {
		expGained = 0
	}
	if expGained > 0 {
		if _, err := tx.Exec("UPDATE users SET exp = exp + $1 WHERE id = $2", expGained, userID); err != nil {
			c.JSON(500, gin.H{"error": "Failed to update experience"})
			return
		}
		if _, err := tx.Exec("UPDATE users SET level = FLOOR(exp / 1000.0) + 1 WHERE id = $1", userID); err != nil {
			c.JSON(500, gin.H{"error": "Failed to update level"})
			return
		}
	}

	if err := tx.Commit(); err != nil {
		c.JSON(500, gin.H{"error": "Failed to commit workout set"})
		return
	}

	c.JSON(200, gin.H{
		"status": "success",
		"log_id": logID,
		"exp":    expGained,
	})
}

func LogSet(c *gin.Context) {
	var input struct {
		ExerciseID int     `json:"exercise_id"`
		SetNumber  int     `json:"set_number"`
		Reps       int     `json:"reps"`
		Weight     float64 `json:"weight"`
		IsFailure  bool    `json:"is_failure"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": "Invalid input"})
		return
	}
	if input.ExerciseID <= 0 || input.SetNumber <= 0 || input.Reps < 0 || input.Weight < 0 {
		c.JSON(400, gin.H{"error": "Invalid set values"})
		return
	}

	userID := c.GetInt("userID")
	if _, err := db.Exec(`
		INSERT INTO logs (user_id, exercise_id, set_number, reps, weight, is_failure)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, userID, int(input.ExerciseID), input.SetNumber, input.Reps, input.Weight, input.IsFailure); err != nil {
		c.JSON(500, gin.H{"error": "Failed to save set"})
		return
	}

	expGained := int(input.Weight * float64(input.Reps) * 0.1)
	if expGained <= 0 && input.Reps > 0 {
		expGained = input.Reps
	}
	if expGained <= 0 {
		expGained = 1
	}

	_, _ = db.Exec("UPDATE users SET exp = exp + $1 WHERE id = $2", expGained, userID)
	_, _ = db.Exec("UPDATE users SET level = FLOOR(exp / 1000.0) + 1 WHERE id = $1", userID)

	c.JSON(200, gin.H{"status": "success", "exp": expGained})
}

func FinishWorkout(c *gin.Context) {
	updateWorkoutStatus(c, "completed")
}

func CancelWorkout(c *gin.Context) {
	updateWorkoutStatus(c, "cancelled")
}

func updateWorkoutStatus(c *gin.Context, status string) {
	userID := c.GetInt("userID")
	sessionID, err := parsePositiveInt(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid workout id"})
		return
	}

	result, err := db.Exec(`
		UPDATE workout_sessions
		SET status = $1, completed_at = CURRENT_TIMESTAMP
		WHERE id = $2 AND user_id = $3 AND status = 'active'
	`, status, sessionID, userID)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to update workout"})
		return
	}

	affected, _ := result.RowsAffected()
	if affected == 0 {
		c.JSON(404, gin.H{"error": "Active workout not found"})
		return
	}

	c.JSON(200, gin.H{"status": status})
}

func loadWorkout(userID, sessionID int) (gin.H, error) {
	var (
		planID      sql.NullInt64
		name        string
		status      string
		startedAt   time.Time
		completedAt sql.NullTime
	)

	err := db.QueryRow(`
		SELECT plan_id, name, status, started_at, completed_at
		FROM workout_sessions
		WHERE id = $1 AND user_id = $2
	`, sessionID, userID).Scan(&planID, &name, &status, &startedAt, &completedAt)
	if err != nil {
		return nil, err
	}

	rows, err := db.Query(`
		SELECT
			wse.id,
			wse.exercise_id,
			e.name,
			e.category,
			wse.target_sets,
			wse.position
		FROM workout_session_exercises wse
		JOIN exercises e ON e.id = wse.exercise_id
		WHERE wse.session_id = $1
		ORDER BY wse.position ASC, wse.id ASC
	`, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	exercises := make([]gin.H, 0)
	for rows.Next() {
		var (
			sessionExerciseID int
			exerciseID        int
			name              string
			category          string
			targetSets        int
			position          int
		)

		if err := rows.Scan(&sessionExerciseID, &exerciseID, &name, &category, &targetSets, &position); err != nil {
			return nil, err
		}

		sets, err := loadWorkoutSets(userID, sessionExerciseID, exerciseID, targetSets, startedAt)
		if err != nil {
			return nil, err
		}

		exercises = append(exercises, gin.H{
			"id":            sessionExerciseID,
			"exercise_id":   exerciseID,
			"exercise_name": name,
			"category":      category,
			"target_sets":   targetSets,
			"position":      position,
			"sets":          sets,
		})
	}

	response := gin.H{
		"id":         sessionID,
		"name":       name,
		"plan_id":    nullableInt(planID),
		"status":     status,
		"started_at": startedAt,
		"exercises":  exercises,
	}
	if completedAt.Valid {
		response["completed_at"] = completedAt.Time
	} else {
		response["completed_at"] = nil
	}

	return response, nil
}

func loadWorkoutSets(userID, sessionExerciseID, exerciseID, targetSets int, sessionStartedAt time.Time) ([]gin.H, error) {
	rows, err := db.Query(`
		SELECT set_number, reps, weight, is_failure, completed_at, next_target_reps, next_target_weight
		FROM workout_sets
		WHERE session_exercise_id = $1
		ORDER BY set_number ASC
	`, sessionExerciseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	saved := make(map[int]gin.H)
	maxSet := targetSets

	for rows.Next() {
		var setNumber, reps int
		var weight float64
		var isFailure bool
		var completedAt time.Time
		var nextReps sql.NullInt64
		var nextWeight sql.NullFloat64

		if err := rows.Scan(&setNumber, &reps, &weight, &isFailure, &completedAt, &nextReps, &nextWeight); err != nil {
			return nil, err
		}

		if setNumber > maxSet {
			maxSet = setNumber
		}

		var nextTarget any
		if nextReps.Valid || nextWeight.Valid {
			t := gin.H{}
			if nextReps.Valid {
				t["reps"] = int(nextReps.Int64)
			} else {
				t["reps"] = nil
			}
			if nextWeight.Valid {
				t["weight"] = nextWeight.Float64
			} else {
				t["weight"] = nil
			}
			nextTarget = t
		}

		saved[setNumber] = gin.H{
			"set_number":   setNumber,
			"reps":         reps,
			"weight":       weight,
			"is_failure":   isFailure,
			"completed_at": completedAt,
			"next_target":  nextTarget,
			"previous":     loadPreviousResult(userID, exerciseID, setNumber, sessionStartedAt),
			"target":       loadCurrentTarget(userID, exerciseID, setNumber),
		}
	}

	sets := make([]gin.H, 0, maxSet)
	for setNumber := 1; setNumber <= maxSet; setNumber++ {
		if set, ok := saved[setNumber]; ok {
			sets = append(sets, set)
			continue
		}

		sets = append(sets, gin.H{
			"set_number":   setNumber,
			"reps":         0,
			"weight":       0,
			"is_failure":   false,
			"completed_at": nil,
			"next_target":  nil,
			"previous":     loadPreviousResult(userID, exerciseID, setNumber, sessionStartedAt),
			"target":       loadCurrentTarget(userID, exerciseID, setNumber),
		})
	}

	return sets, rows.Err()
}

func loadPreviousResult(userID, exerciseID, setNumber int, before time.Time) gin.H {
	var reps int
	var weight float64
	var isFailure bool

	err := db.QueryRow(`
		SELECT reps, weight, COALESCE(is_failure, FALSE)
		FROM logs
		WHERE user_id = $1 AND exercise_id = $2 AND set_number = $3
		  AND created_at < $4
		ORDER BY created_at DESC, id DESC
		LIMIT 1
	`, userID, exerciseID, setNumber, before).Scan(&reps, &weight, &isFailure)
	if err != nil {
		return gin.H{"reps": nil, "weight": nil, "is_failure": false}
	}

	return gin.H{"reps": reps, "weight": weight, "is_failure": isFailure}
}

func loadCurrentTarget(userID, exerciseID, setNumber int) gin.H {
	var reps sql.NullInt64
	var weight sql.NullFloat64

	err := db.QueryRow(`
		SELECT target_reps, target_weight
		FROM user_exercise_targets
		WHERE user_id = $1 AND exercise_id = $2 AND set_number = $3
	`, userID, exerciseID, setNumber).Scan(&reps, &weight)
	if err != nil {
		return gin.H{"reps": nil, "weight": nil}
	}

	var r any
	var w any
	if reps.Valid {
		r = int(reps.Int64)
	}
	if weight.Valid {
		w = weight.Float64
	}
	return gin.H{"reps": r, "weight": w}
}

func copyPlanExercisesToSession(tx *sql.Tx, sessionID, planID int) error {
	rows, err := tx.Query(`
		SELECT exercise_id, target_sets, position
		FROM plan_exercises
		WHERE plan_id = $1
		ORDER BY position ASC, exercise_id ASC
	`, planID)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var exerciseID, targetSets, position int
		if err := rows.Scan(&exerciseID, &targetSets, &position); err != nil {
			return err
		}
		if _, err := tx.Exec(`
			INSERT INTO workout_session_exercises (session_id, exercise_id, target_sets, position)
			VALUES ($1, $2, $3, $4)
		`, sessionID, exerciseID, targetSets, position); err != nil {
			return err
		}
	}

	return rows.Err()
}

func workoutOwnedByUser(sessionID, userID int) bool {
	var exists bool
	err := db.QueryRow(
		"SELECT EXISTS(SELECT 1 FROM workout_sessions WHERE id = $1 AND user_id = $2)",
		sessionID,
		userID,
	).Scan(&exists)
	return err == nil && exists
}

func workoutIsActive(sessionID, userID int) bool {
	var exists bool
	err := db.QueryRow(`
		SELECT EXISTS(
			SELECT 1 FROM workout_sessions
			WHERE id = $1 AND user_id = $2 AND status = 'active'
		)
	`, sessionID, userID).Scan(&exists)
	return err == nil && exists
}

func respondWorkoutError(c *gin.Context, err error) {
	if err == sql.ErrNoRows {
		c.JSON(404, gin.H{"error": "Workout not found"})
		return
	}
	c.JSON(500, gin.H{"error": "Failed to load workout"})
}

func nullableInt(value sql.NullInt64) any {
	if !value.Valid {
		return nil
	}
	return int(value.Int64)
}

func parsePositiveInt(value string) (int, error) {
	number, err := strconv.Atoi(value)
	if err != nil || number <= 0 {
		return 0, errInvalidPositiveInt
	}
	return number, nil
}

var errInvalidPositiveInt = errors.New("invalid positive integer")
