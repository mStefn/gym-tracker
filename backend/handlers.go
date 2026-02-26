package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Login verifies credentials and returns user data
func Login(c *gin.Context) {
	var b struct {
		Name string `json:"name"`
		Pin  string `json:"pin"`
	}
	if err := c.BindJSON(&b); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	var u User
	err := db.QueryRow("SELECT id, name FROM users WHERE name = ? AND pin = ?", b.Name, b.Pin).Scan(&u.ID, &u.Name)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	c.JSON(http.StatusOK, u)
}

// SignUp creates a new account if limit (5) is not exceeded
func SignUp(c *gin.Context) {
	var b struct {
		Name string `json:"name"`
		Pin  string `json:"pin"`
	}
	if err := c.BindJSON(&b); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// 1. Check user limit
	var count int
	db.QueryRow("SELECT COUNT(*) FROM users").Scan(&count)
	if count >= 5 {
		c.JSON(http.StatusForbidden, gin.H{"error": "User limit reached (max 5)"})
		return
	}

	// 2. Check if username exists
	var exists int
	db.QueryRow("SELECT COUNT(*) FROM users WHERE name = ?", b.Name).Scan(&exists)
	if exists > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Username already taken"})
		return
	}

	// 3. Insert new user
	res, err := db.Exec("INSERT INTO users (name, pin) VALUES (?, ?)", b.Name, b.Pin)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	newID, _ := res.LastInsertId()
	c.JSON(http.StatusOK, gin.H{"id": newID, "name": b.Name})
}

// GetUserPlans returns workout plans for the user
func GetUserPlans(c *gin.Context) {
	rows, _ := db.Query("SELECT id, name FROM workout_plans WHERE user_id = ?", c.Param("user_id"))
	defer rows.Close()
	var plans []WorkoutPlan
	for rows.Next() {
		var p WorkoutPlan
		rows.Scan(&p.ID, &p.Name)
		plans = append(plans, p)
	}
	c.JSON(http.StatusOK, plans)
}

// GetPlanExercises returns exercises for a specific plan
func GetPlanExercises(c *gin.Context) {
	query := `SELECT e.id, e.name, pe.target_sets FROM exercises e 
              JOIN plan_exercises pe ON e.id = pe.exercise_id WHERE pe.plan_id = ?`
	rows, _ := db.Query(query, c.Param("plan_id"))
	defer rows.Close()
	var exercises []Exercise
	for rows.Next() {
		var e Exercise
		rows.Scan(&e.ID, &e.Name, &e.TargetSets)
		exercises = append(exercises, e)
	}
	c.JSON(http.StatusOK, exercises)
}

// LogSet saves a workout set
func LogSet(c *gin.Context) {
	var b struct {
		UserID int     `json:"user_id"`
		ExID   int     `json:"exercise_id"`
		Set    int     `json:"set_number"`
		Reps   int     `json:"reps"`
		W      float64 `json:"weight"`
	}
	c.BindJSON(&b)
	db.Exec(`INSERT INTO logs (user_id, exercise_id, set_number, reps, weight) VALUES (?, ?, ?, ?, ?)`,
		b.UserID, b.ExID, b.Set, b.Reps, b.W)
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// GetLastResult returns the most recent result for an exercise/set
func GetLastResult(c *gin.Context) {
	var reps int
	var weight float64
	err := db.QueryRow(`SELECT reps, weight FROM logs WHERE user_id = ? AND exercise_id = ? AND set_number = ? 
                        ORDER BY created_at DESC LIMIT 1`, c.Param("user_id"), c.Param("ex_id"), c.Param("set")).Scan(&reps, &weight)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"reps": 0, "weight": 0})
		return
	}
	c.JSON(http.StatusOK, gin.H{"reps": reps, "weight": weight})
}
