package main

import (
	"log"
	"strings"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// --- AUTH HANDLERS ---

func Login(c *gin.Context) {
	var input struct {
		Name string `json:"name"`
		Pin  string `json:"pin"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": "Invalid input"})
		return
	}

	var id int
	var name, hashedPin string
	err := db.QueryRow(
		"SELECT id, name, pin FROM users WHERE name = $1",
		input.Name,
	).Scan(&id, &name, &hashedPin)

	if err != nil {
		c.JSON(401, gin.H{"error": "Invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hashedPin), []byte(input.Pin)); err != nil {
		c.JSON(401, gin.H{"error": "Invalid credentials"})
		return
	}

	token := GenerateToken(id)
	c.JSON(200, gin.H{"id": id, "name": name, "token": token})
}

func SignUp(c *gin.Context) {
	var input struct {
		Name string `json:"name"`
		Pin  string `json:"pin"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": "Invalid input"})
		return
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(input.Pin), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(500, gin.H{"error": "Server error"})
		return
	}

	var id int
	err = db.QueryRow(
		"INSERT INTO users (name, pin) VALUES ($1, $2) RETURNING id",
		input.Name,
		string(hashed),
	).Scan(&id)

	if err != nil {
		if strings.Contains(err.Error(), "duplicate key value violates unique constraint") {
			c.JSON(409, gin.H{"error": "Username already exists"})
		} else {
			c.JSON(500, gin.H{"error": "Failed to create account"})
		}
		return
	}

	c.JSON(200, gin.H{"id": id, "name": input.Name})
}

// --- WORKOUT & PROGRESS ---

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

	userID := c.GetInt("userID")

	_, err := db.Exec(
		"INSERT INTO logs (user_id, exercise_id, set_number, reps, weight, is_failure) VALUES ($1, $2, $3, $4, $5, $6)",
		userID,
		input.ExerciseID,
		input.SetNumber,
		input.Reps,
		input.Weight,
		input.IsFailure,
	)

	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	expGained := int(input.Weight * float64(input.Reps) * 0.1)

	if expGained <= 0 && input.Reps > 0 {
		expGained = input.Reps
	}

	if expGained <= 0 {
		expGained = 1
	}

	if _, err := db.Exec(
		"UPDATE users SET exp = exp + $1 WHERE id = $2",
		expGained,
		userID,
	); err != nil {
		log.Printf("LogSet: failed to update exp for user %d: %v", userID, err)
	}

	if _, err := db.Exec(
		"UPDATE users SET level = FLOOR(exp / 1000.0) + 1 WHERE id = $1",
		userID,
	); err != nil {
		log.Printf("LogSet: failed to update level for user %d: %v", userID, err)
	}

	c.JSON(200, gin.H{"status": "success"})
}

func GetLastResult(c *gin.Context) {
	userID := c.GetInt("userID")
	exID := c.Param("ex_id")
	setNum := c.Param("set")

	var reps int
	var weight float64
	var isFailure bool

	err := db.QueryRow(
		"SELECT reps, weight, COALESCE(is_failure, FALSE) FROM logs WHERE user_id = $1 AND exercise_id = $2 AND set_number = $3 ORDER BY created_at DESC LIMIT 1",
		userID,
		exID,
		setNum,
	).Scan(&reps, &weight, &isFailure)

	if err != nil {
		c.JSON(200, gin.H{
			"reps":       0,
			"weight":     0,
			"is_failure": false,
		})
		return
	}

	c.JSON(200, gin.H{
		"reps":       reps,
		"weight":     weight,
		"is_failure": isFailure,
	})
}

func GetUserStats(c *gin.Context) {
	userID := c.GetInt("userID")

	rows, err := db.Query(`
		SELECT l.created_at, e.name, l.weight, l.reps, e.id
		FROM logs l
		JOIN exercises e ON l.exercise_id = e.id
		WHERE l.user_id = $1
		ORDER BY l.created_at ASC`,
		userID,
	)

	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to fetch stats"})
		return
	}

	defer rows.Close()

	type StatRow struct {
		Date     string  `json:"date"`
		Exercise string  `json:"exercise"`
		Weight   float64 `json:"weight"`
		Reps     int     `json:"reps"`
		ExID     int     `json:"ex_id"`
	}

	var stats []StatRow

	for rows.Next() {
		var s StatRow

		if err := rows.Scan(
			&s.Date,
			&s.Exercise,
			&s.Weight,
			&s.Reps,
			&s.ExID,
		); err != nil {
			continue
		}

		stats = append(stats, s)
	}

	if stats == nil {
		stats = []StatRow{}
	}

	c.JSON(200, stats)
}

// --- DASHBOARD ---

func LogBodyWeight(c *gin.Context) {
	var input struct {
		Weight float64 `json:"weight"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": "Invalid input"})
		return
	}

	userID := c.GetInt("userID")

	_, err := db.Exec(`
		INSERT INTO user_weights (user_id, weight, logged_at)
		VALUES ($1, $2, CURRENT_DATE)
		ON CONFLICT (user_id, logged_at)
		DO UPDATE SET weight = EXCLUDED.weight
	`,
		userID,
		input.Weight,
	)

	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to log weight"})
		return
	}

	c.JSON(200, gin.H{"status": "ok"})
}

func GetDashboardData(c *gin.Context) {
	userID := c.GetInt("userID")

	var exp, level int

	if err := db.QueryRow(
		"SELECT exp, level FROM users WHERE id = $1",
		userID,
	).Scan(&exp, &level); err != nil {
		log.Printf("GetDashboardData: failed to fetch user stats: %v", err)
	}

	if level == 0 {
		level = 1
	}

	currentLevelBaseExp := (level - 1) * 1000
	expProgress := exp - currentLevelBaseExp

	var weights []float64

	if wRows, err := db.Query(
		"SELECT weight FROM user_weights WHERE user_id = $1 ORDER BY logged_at DESC LIMIT 7",
		userID,
	); err == nil {
		for wRows.Next() {
			var w float64

			if err := wRows.Scan(&w); err == nil {
				weights = append(weights, w)
			}
		}

		wRows.Close()
	}

	readiness := map[string]int{
		"Chest":      100,
		"Back":       100,
		"Shoulders":  100,
		"Biceps":     100,
		"Triceps":    100,
		"Abs":        100,
		"Quads":      100,
		"Hamstrings": 100,
		"Glutes":     100,
		"Calves":     100,
	}

	if rRows, err := db.Query(`
		SELECT
			e.name,
			e.category,
			FLOOR(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - MAX(l.created_at))) / 3600)::int
		FROM logs l
		JOIN exercises e ON l.exercise_id = e.id
		WHERE l.user_id = $1
		GROUP BY e.id, e.name, e.category`,
		userID,
	); err == nil {
		for rRows.Next() {
			var exName, cat string
			var hours int

			if err := rRows.Scan(&exName, &cat, &hours); err == nil {
				detailedCat := cat

				if cat == "Legs" {
					nameLower := strings.ToLower(exName)

					if strings.Contains(nameLower, "calf") ||
						strings.Contains(nameLower, "calves") {
						detailedCat = "Calves"
					} else if strings.Contains(nameLower, "deadlift") ||
						strings.Contains(nameLower, "curl") {
						detailedCat = "Hamstrings"
					} else if strings.Contains(nameLower, "thrust") ||
						strings.Contains(nameLower, "glute") ||
						strings.Contains(nameLower, "abduction") ||
						strings.Contains(nameLower, "adduction") {
						detailedCat = "Glutes"
					} else {
						detailedCat = "Quads"
					}
				}

				pct := 100

				if hours < 24 {
					pct = 15
				} else if hours < 48 {
					pct = 50
				} else if hours < 72 {
					pct = 85
				}

				if pct < readiness[detailedCat] {
					readiness[detailedCat] = pct
				}
			}
		}

		rRows.Close()
	}

	var heatmap []string

	if hRows, err := db.Query(`
		SELECT DISTINCT created_at::date
		FROM logs
		WHERE user_id = $1
		  AND created_at >= CURRENT_DATE - INTERVAL '45 days'
	`,
		userID,
	); err == nil {
		for hRows.Next() {
			var d string

			if err := hRows.Scan(&d); err == nil {
				heatmap = append(heatmap, d)
			}
		}

		hRows.Close()
	}

	type VolData struct {
		Week  string  `json:"week"`
		Total float64 `json:"total"`
	}

	var volume []VolData

	if vRows, err := db.Query(`
		SELECT
			TO_CHAR(created_at, 'IYYY-IW'),
			SUM(weight * reps)
		FROM logs
		WHERE user_id = $1
		  AND created_at >= CURRENT_DATE - INTERVAL '28 days'
		GROUP BY TO_CHAR(created_at, 'IYYY-IW')
		ORDER BY TO_CHAR(created_at, 'IYYY-IW') ASC
	`,
		userID,
	); err == nil {
		for vRows.Next() {
			var w string
			var t float64

			if err := vRows.Scan(&w, &t); err == nil {
				volume = append(volume, VolData{
					Week:  w,
					Total: t,
				})
			}
		}

		vRows.Close()
	}

	c.JSON(200, gin.H{
		"weights":    weights,
		"readiness":  readiness,
		"heatmap":    heatmap,
		"volume":     volume,
		"level":      level,
		"exp":        expProgress,
		"exp_target": 1000,
	})
}

// --- EXERCISES & PLANS ---

func GetExercises(c *gin.Context) {
	rows, err := db.Query(
		"SELECT id, name, category FROM exercises ORDER BY category, name ASC",
	)

	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to fetch exercises"})
		return
	}

	defer rows.Close()

	list := []map[string]interface{}{}

	for rows.Next() {
		var id int
		var name, cat string

		if err := rows.Scan(&id, &name, &cat); err != nil {
			continue
		}

		list = append(list, map[string]interface{}{
			"id":       id,
			"name":     name,
			"category": cat,
		})
	}

	c.JSON(200, list)
}

func CreatePlan(c *gin.Context) {
	var input struct {
		Name string `json:"name"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": "Invalid input"})
		return
	}

	userID := c.GetInt("userID")

	var id int

	err := db.QueryRow(
		"INSERT INTO workout_plans (user_id, name) VALUES ($1, $2) RETURNING id",
		userID,
		input.Name,
	).Scan(&id)

	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to create plan"})
		return
	}

	c.JSON(200, gin.H{
		"id":   id,
		"name": input.Name,
	})
}

func AddExerciseToPlan(c *gin.Context) {
	var input struct {
		PlanID       int    `json:"plan_id"`
		ExerciseID   string `json:"exercise_id"`
		TargetSets   int    `json:"target_sets"`
		ExerciseName string `json:"exercise_name"`
		Category     string `json:"category"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": "Invalid input"})
		return
	}

	realExerciseID, err := GetOrCreateExerciseDB(
		input.ExerciseName,
		input.Category,
	)

	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to resolve exercise ID"})
		return
	}

	_, err = db.Exec(
		"INSERT INTO plan_exercises (plan_id, exercise_id, target_sets) VALUES ($1, $2, $3)",
		input.PlanID,
		realExerciseID,
		input.TargetSets,
	)

	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to add exercise to plan"})
		return
	}

	c.JSON(200, gin.H{"status": "ok"})
}

func GetUserPlans(c *gin.Context) {
	userID := c.GetInt("userID")

	rows, err := db.Query(
		"SELECT id, name FROM workout_plans WHERE user_id = $1",
		userID,
	)

	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to fetch plans"})
		return
	}

	defer rows.Close()

	list := []map[string]interface{}{}

	for rows.Next() {
		var id int
		var name string

		if err := rows.Scan(&id, &name); err != nil {
			continue
		}

		list = append(list, map[string]interface{}{
			"id":   id,
			"name": name,
		})
	}

	c.JSON(200, list)
}

func GetPlanExercises(c *gin.Context) {
	planID := c.Param("plan_id")

	rows, err := db.Query(`
		SELECT e.id, e.name, e.category, pe.target_sets
		FROM plan_exercises pe
		JOIN exercises e ON pe.exercise_id = e.id
		WHERE pe.plan_id = $1`,
		planID,
	)

	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to fetch plan exercises"})
		return
	}

	defer rows.Close()

	list := []map[string]interface{}{}

	for rows.Next() {
		var id, sets int
		var name, category string

		if err := rows.Scan(
			&id,
			&name,
			&category,
			&sets,
		); err != nil {
			continue
		}

		list = append(list, map[string]interface{}{
			"exercise_id":   id,
			"exercise_name": name,
			"category":      category,
			"target_sets":   sets,
		})
	}

	c.JSON(200, list)
}

func SyncPlanExercises(c *gin.Context) {
	var input struct {
		PlanID    int `json:"plan_id"`
		Exercises []struct {
			Name     string `json:"name"`
			Category string `json:"category"`
			Sets     int    `json:"sets"`
		} `json:"exercises"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": "Invalid input"})
		return
	}

	tx, err := db.Begin()
	if err != nil {
		c.JSON(500, gin.H{"error": "Transaction failed"})
		return
	}

	_, err = tx.Exec(
		"DELETE FROM plan_exercises WHERE plan_id = $1",
		input.PlanID,
	)

	if err != nil {
		tx.Rollback()
		c.JSON(500, gin.H{"error": "Failed to clear old exercises"})
		return
	}

	for _, ex := range input.Exercises {
		var exID int

		err := tx.QueryRow(
			"SELECT id FROM exercises WHERE name = $1",
			ex.Name,
		).Scan(&exID)

		if err != nil {
			errInsert := tx.QueryRow(
				"INSERT INTO exercises (name, category) VALUES ($1, $2) RETURNING id",
				ex.Name,
				ex.Category,
			).Scan(&exID)

			if errInsert != nil {
				tx.Rollback()
				c.JSON(500, gin.H{"error": "Failed to create missing exercise"})
				return
			}
		}

		_, err = tx.Exec(
			"INSERT INTO plan_exercises (plan_id, exercise_id, target_sets) VALUES ($1, $2, $3)",
			input.PlanID,
			exID,
			ex.Sets,
		)

		if err != nil {
			tx.Rollback()
			c.JSON(500, gin.H{"error": "Failed to insert exercises into plan"})
			return
		}
	}

	if err := tx.Commit(); err != nil {
		c.JSON(500, gin.H{"error": "Failed to commit transaction"})
		return
	}

	c.JSON(200, gin.H{"status": "synchronized"})
}

func DeletePlan(c *gin.Context) {
	id := c.Param("id")

	result, err := db.Exec(
		"DELETE FROM workout_plans WHERE id = $1",
		id,
	)

	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to delete plan"})
		return
	}

	affected, _ := result.RowsAffected()

	if affected == 0 {
		c.JSON(404, gin.H{"error": "Plan not found"})
		return
	}

	c.JSON(200, gin.H{"status": "deleted"})
}

// --- ADMIN & MANAGEMENT ---

func AdminListUsers(c *gin.Context) {
	rows, err := db.Query(
		"SELECT id, name, is_admin FROM users",
	)

	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	defer rows.Close()

	var list []map[string]interface{}

	for rows.Next() {
		var id int
		var name string
		var isAdmin bool

		if err := rows.Scan(&id, &name, &isAdmin); err != nil {
			continue
		}

		list = append(list, map[string]interface{}{
			"id":       id,
			"name":     name,
			"is_admin": isAdmin,
		})
	}

	c.JSON(200, list)
}

func AdminResetPin(c *gin.Context) {
	var input struct {
		UserID int    `json:"user_id"`
		NewPin string `json:"new_pin"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": "Invalid input"})
		return
	}

	newHashed, err := bcrypt.GenerateFromPassword(
		[]byte(input.NewPin),
		bcrypt.DefaultCost,
	)

	if err != nil {
		c.JSON(500, gin.H{"error": "Server error"})
		return
	}

	if _, err := db.Exec(
		"UPDATE users SET pin = $1 WHERE id = $2",
		string(newHashed),
		input.UserID,
	); err != nil {
		c.JSON(500, gin.H{"error": "Failed to reset PIN"})
		return
	}

	c.JSON(200, gin.H{"status": "ok"})
}

func DeleteAccount(c *gin.Context) {
	id := c.Param("id")

	_, err := db.Exec(
		"DELETE FROM users WHERE id = $1",
		id,
	)

	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to delete account"})
		return
	}

	c.JSON(200, gin.H{"status": "deleted"})
}

func ChangePin(c *gin.Context) {
	var input struct {
		OldPin string `json:"old_pin"`
		NewPin string `json:"new_pin"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": "Invalid input"})
		return
	}

	userID := c.GetInt("userID")

	var hashedPin string

	if err := db.QueryRow(
		"SELECT pin FROM users WHERE id = $1",
		userID,
	).Scan(&hashedPin); err != nil {
		c.JSON(404, gin.H{"error": "User not found"})
		return
	}

	if err := bcrypt.CompareHashAndPassword(
		[]byte(hashedPin),
		[]byte(input.OldPin),
	); err != nil {
		c.JSON(401, gin.H{"error": "Current password incorrect"})
		return
	}

	newHashed, err := bcrypt.GenerateFromPassword(
		[]byte(input.NewPin),
		bcrypt.DefaultCost,
	)

	if err != nil {
		c.JSON(500, gin.H{"error": "Server error"})
		return
	}

	if _, err := db.Exec(
		"UPDATE users SET pin = $1 WHERE id = $2",
		string(newHashed),
		userID,
	); err != nil {
		c.JSON(500, gin.H{"error": "Failed to update PIN"})
		return
	}

	c.JSON(200, gin.H{"status": "ok"})
}

func HealthCheck(c *gin.Context) {
	if err := db.Ping(); err != nil {
		c.JSON(503, gin.H{
			"status": "unhealthy",
			"error":  "Database unreachable",
		})
		return
	}

	c.JSON(200, gin.H{"status": "healthy"})
}

// --- ADVANCED STATISTICS ---

func GetAdvancedStats(c *gin.Context) {
	userID := c.GetInt("userID")

	var totalVolume float64
	var totalSets, totalWorkouts int

	db.QueryRow(`
		SELECT
			COALESCE(SUM(weight * reps), 0),
			COUNT(id),
			COUNT(DISTINCT created_at::date)
		FROM logs
		WHERE user_id = $1
	`,
		userID,
	).Scan(
		&totalVolume,
		&totalSets,
		&totalWorkouts,
	)

	milestones := gin.H{
		"volume":   totalVolume,
		"sets":     totalSets,
		"workouts": totalWorkouts,
	}

	type Fame struct {
		Name   string  `json:"name"`
		Weight float64 `json:"weight"`
	}

	var hallOfFame []Fame

	if fRows, err := db.Query(`
		SELECT e.name, MAX(l.weight)
		FROM logs l
		JOIN exercises e ON l.exercise_id = e.id
		WHERE l.user_id = $1
		  AND l.weight > 0
		GROUP BY e.name
		ORDER BY MAX(l.weight) DESC
		LIMIT 10`,
		userID,
	); err == nil {
		for fRows.Next() {
			var f Fame

			if err := fRows.Scan(&f.Name, &f.Weight); err == nil {
				hallOfFame = append(hallOfFame, f)
			}
		}

		fRows.Close()
	}

	type Distribution struct {
		Category string `json:"category"`
		Count    int    `json:"count"`
	}

	var dist []Distribution
	totalDistSets := 0

	if dRows, err := db.Query(`
		SELECT e.category, COUNT(l.id)
		FROM logs l
		JOIN exercises e ON l.exercise_id = e.id
		WHERE l.user_id = $1
		GROUP BY e.category
		ORDER BY COUNT(l.id) DESC`,
		userID,
	); err == nil {
		for dRows.Next() {
			var d Distribution

			if err := dRows.Scan(&d.Category, &d.Count); err == nil {
				dist = append(dist, d)
				totalDistSets += d.Count
			}
		}

		dRows.Close()
	}

	type UserExercise struct {
		ID   int    `json:"id"`
		Name string `json:"name"`
	}

	var exercises []UserExercise

	if eRows, err := db.Query(`
		SELECT DISTINCT e.id, e.name
		FROM logs l
		JOIN exercises e ON l.exercise_id = e.id
		WHERE l.user_id = $1
		ORDER BY e.name ASC`,
		userID,
	); err == nil {
		for eRows.Next() {
			var ex UserExercise

			if err := eRows.Scan(&ex.ID, &ex.Name); err == nil {
				exercises = append(exercises, ex)
			}
		}

		eRows.Close()
	}

	c.JSON(200, gin.H{
		"milestones":    milestones,
		"hallOfFame":    hallOfFame,
		"distribution":  dist,
		"totalDistSets": totalDistSets,
		"exercises":     exercises,
	})
}

func GetExerciseDeepDive(c *gin.Context) {
	userID := c.GetInt("userID")
	exID := c.Param("ex_id")

	type ChartPoint struct {
		Date   string  `json:"date"`
		Weight float64 `json:"weight"`
	}

	var points []ChartPoint

	rows, err := db.Query(`
		SELECT created_at::date, MAX(weight)
		FROM logs
		WHERE user_id = $1
		  AND exercise_id = $2
		GROUP BY created_at::date
		ORDER BY created_at::date ASC`,
		userID,
		exID,
	)

	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to fetch exercise data"})
		return
	}

	defer rows.Close()

	for rows.Next() {
		var p ChartPoint

		if err := rows.Scan(&p.Date, &p.Weight); err == nil {
			points = append(points, p)
		}
	}

	c.JSON(200, points)
}

// --- SETTINGS MANAGEMENT ---

func ClearOwnLogs(c *gin.Context) {
	userID := c.GetInt("userID")

	_, err := db.Exec(
		"DELETE FROM logs WHERE user_id = $1",
		userID,
	)

	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to clear history"})
		return
	}

	c.JSON(200, gin.H{"status": "cleared"})
}

func DeleteOwnAccount(c *gin.Context) {
	userID := c.GetInt("userID")

	_, err := db.Exec(
		"DELETE FROM users WHERE id = $1",
		userID,
	)

	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to delete account"})
		return
	}

	c.JSON(200, gin.H{"status": "deleted"})
}

func UpdatePlanName(c *gin.Context) {
	planID := c.Param("id")

	var input struct {
		Name string `json:"name"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": "Invalid input"})
		return
	}

	_, err := db.Exec(
		"UPDATE workout_plans SET name = $1 WHERE id = $2",
		input.Name,
		planID,
	)

	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to update plan"})
		return
	}

	c.JSON(200, gin.H{"status": "updated"})
}

func DeletePlanExercises(c *gin.Context) {
	planID := c.Param("plan_id")

	_, err := db.Exec(
		"DELETE FROM plan_exercises WHERE plan_id = $1",
		planID,
	)

	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to clear old exercises"})
		return
	}

	c.JSON(200, gin.H{"status": "cleared"})
}
