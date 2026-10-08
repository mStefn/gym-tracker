package main

import (
	"database/sql"
	"strings"

	"github.com/gin-gonic/gin"
)

func CreatePlan(c *gin.Context) {
	var input struct {
		Name string `json:"name"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": "Invalid input"})
		return
	}

	name := strings.TrimSpace(input.Name)
	if name == "" {
		c.JSON(400, gin.H{"error": "Plan name is required"})
		return
	}

	userID := c.GetInt("userID")
	var id int
	if err := db.QueryRow(
		"INSERT INTO workout_plans (user_id, name) VALUES ($1, $2) RETURNING id",
		userID,
		name,
	).Scan(&id); err != nil {
		c.JSON(500, gin.H{"error": "Failed to create plan"})
		return
	}

	c.JSON(200, gin.H{"id": id, "name": name})
}

func GetUserPlans(c *gin.Context) {
	userID := c.GetInt("userID")

	rows, err := db.Query(
		"SELECT id, name FROM workout_plans WHERE user_id = $1 ORDER BY id ASC",
		userID,
	)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to fetch plans"})
		return
	}
	defer rows.Close()

	list := make([]gin.H, 0)
	for rows.Next() {
		var id int
		var name string
		if err := rows.Scan(&id, &name); err != nil {
			continue
		}
		list = append(list, gin.H{"id": id, "name": name})
	}

	c.JSON(200, list)
}

func GetPlanExercises(c *gin.Context) {
	userID := c.GetInt("userID")
	planID := c.Param("plan_id")

	if !planBelongsToUser(planID, userID) {
		c.JSON(404, gin.H{"error": "Plan not found"})
		return
	}

	rows, err := db.Query(`
		SELECT e.id, e.name, e.category, pe.target_sets, pe.position
		FROM plan_exercises pe
		JOIN exercises e ON pe.exercise_id = e.id
		WHERE pe.plan_id = $1
		ORDER BY pe.position ASC, pe.exercise_id ASC
	`, planID)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to fetch plan exercises"})
		return
	}
	defer rows.Close()

	list := make([]gin.H, 0)
	for rows.Next() {
		var id, sets, position int
		var name, category string
		if err := rows.Scan(&id, &name, &category, &sets, &position); err != nil {
			continue
		}
		list = append(list, gin.H{
			"exercise_id":   id,
			"exercise_name": name,
			"category":      category,
			"target_sets":   sets,
			"position":      position,
		})
	}

	c.JSON(200, list)
}

func AddExerciseToPlan(c *gin.Context) {
	var input struct {
		PlanID       int         `json:"plan_id"`
		ExerciseID   FlexibleInt `json:"exercise_id"`
		TargetSets   int         `json:"target_sets"`
		ExerciseName string      `json:"exercise_name"`
		Category     string      `json:"category"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": "Invalid input"})
		return
	}

	userID := c.GetInt("userID")
	if !planBelongsToUserID(input.PlanID, userID) {
		c.JSON(404, gin.H{"error": "Plan not found"})
		return
	}
	if input.TargetSets < 1 {
		input.TargetSets = 1
	}

	exerciseID, err := resolveExercise(int(input.ExerciseID), input.ExerciseName, input.Category)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to resolve exercise ID"})
		return
	}

	var position int
	if err := db.QueryRow(
		"SELECT COALESCE(MAX(position), -1) + 1 FROM plan_exercises WHERE plan_id = $1",
		input.PlanID,
	).Scan(&position); err != nil {
		c.JSON(500, gin.H{"error": "Failed to determine exercise position"})
		return
	}

	_, err = db.Exec(`
		INSERT INTO plan_exercises (plan_id, exercise_id, target_sets, position)
		VALUES ($1, $2, $3, $4)
	`, input.PlanID, exerciseID, input.TargetSets, position)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to add exercise to plan"})
		return
	}

	c.JSON(200, gin.H{"status": "ok", "exercise_id": exerciseID, "position": position})
}

func SyncPlanExercises(c *gin.Context) {
	var input struct {
		PlanID    int `json:"plan_id"`
		Exercises []struct {
			ExerciseID FlexibleInt `json:"exercise_id"`
			Name       string      `json:"name"`
			Category   string      `json:"category"`
			Sets       int         `json:"sets"`
		} `json:"exercises"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": "Invalid input"})
		return
	}

	userID := c.GetInt("userID")
	if !planBelongsToUserID(input.PlanID, userID) {
		c.JSON(404, gin.H{"error": "Plan not found"})
		return
	}

	tx, err := db.Begin()
	if err != nil {
		c.JSON(500, gin.H{"error": "Transaction failed"})
		return
	}
	defer tx.Rollback()

	if _, err := tx.Exec("DELETE FROM plan_exercises WHERE plan_id = $1", input.PlanID); err != nil {
		c.JSON(500, gin.H{"error": "Failed to clear old exercises"})
		return
	}

	for position, ex := range input.Exercises {
		if strings.TrimSpace(ex.Name) == "" && ex.ExerciseID == 0 {
			c.JSON(400, gin.H{"error": "Exercise name is required"})
			return
		}

		exerciseID := int(ex.ExerciseID)
		if exerciseID == 0 {
			exerciseID, err = getOrCreateExerciseTx(tx, strings.TrimSpace(ex.Name), strings.TrimSpace(ex.Category))
			if err != nil {
				c.JSON(500, gin.H{"error": "Failed to create missing exercise"})
				return
			}
		}

		sets := ex.Sets
		if sets < 1 {
			sets = 1
		}

		if _, err := tx.Exec(`
			INSERT INTO plan_exercises (plan_id, exercise_id, target_sets, position)
			VALUES ($1, $2, $3, $4)
		`, input.PlanID, exerciseID, sets, position); err != nil {
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

func UpdatePlanName(c *gin.Context) {
	userID := c.GetInt("userID")
	planID := c.Param("id")

	var input struct {
		Name string `json:"name"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": "Invalid input"})
		return
	}

	name := strings.TrimSpace(input.Name)
	if name == "" {
		c.JSON(400, gin.H{"error": "Plan name is required"})
		return
	}

	result, err := db.Exec(
		"UPDATE workout_plans SET name = $1 WHERE id = $2 AND user_id = $3",
		name,
		planID,
		userID,
	)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to update plan"})
		return
	}

	affected, _ := result.RowsAffected()
	if affected == 0 {
		c.JSON(404, gin.H{"error": "Plan not found"})
		return
	}

	c.JSON(200, gin.H{"status": "updated"})
}

func DeletePlan(c *gin.Context) {
	userID := c.GetInt("userID")
	planID := c.Param("id")

	result, err := db.Exec(
		"DELETE FROM workout_plans WHERE id = $1 AND user_id = $2",
		planID,
		userID,
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

func DeletePlanExercises(c *gin.Context) {
	userID := c.GetInt("userID")
	planID := c.Param("plan_id")
	if !planBelongsToUser(planID, userID) {
		c.JSON(404, gin.H{"error": "Plan not found"})
		return
	}

	if _, err := db.Exec("DELETE FROM plan_exercises WHERE plan_id = $1", planID); err != nil {
		c.JSON(500, gin.H{"error": "Failed to clear old exercises"})
		return
	}

	c.JSON(200, gin.H{"status": "cleared"})
}

func planBelongsToUser(planID string, userID int) bool {
	var exists bool
	err := db.QueryRow(
		"SELECT EXISTS(SELECT 1 FROM workout_plans WHERE id = $1 AND user_id = $2)",
		planID,
		userID,
	).Scan(&exists)
	return err == nil && exists
}

func planBelongsToUserID(planID, userID int) bool {
	var exists bool
	err := db.QueryRow(
		"SELECT EXISTS(SELECT 1 FROM workout_plans WHERE id = $1 AND user_id = $2)",
		planID,
		userID,
	).Scan(&exists)
	return err == nil && exists
}

func resolveExercise(exerciseID int, name, category string) (int, error) {
	if exerciseID > 0 {
		var id int
		if err := db.QueryRow("SELECT id FROM exercises WHERE id = $1", exerciseID).Scan(&id); err != nil {
			return 0, err
		}
		return id, nil
	}
	return GetOrCreateExerciseDB(strings.TrimSpace(name), strings.TrimSpace(category))
}

func getOrCreateExerciseTx(tx *sql.Tx, name, category string) (int, error) {
	var id int
	err := tx.QueryRow(`
		INSERT INTO exercises (name, category)
		VALUES ($1, $2)
		ON CONFLICT (name) DO UPDATE SET category = EXCLUDED.category
		RETURNING id
	`, name, category).Scan(&id)
	return id, err
}
