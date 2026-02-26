package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func Login(c *gin.Context) {
	var b struct {
		Name string `json:"name"`
		Pin  string `json:"pin"`
	}
	c.BindJSON(&b)

	var u struct {
		ID      int
		Name    string
		IsAdmin bool
	}
	err := db.QueryRow("SELECT id, name, is_admin FROM users WHERE name = ? AND pin = ?", b.Name, b.Pin).Scan(&u.ID, &u.Name, &u.IsAdmin)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"id": u.ID, "name": u.Name, "is_admin": u.IsAdmin})
}

func SignUp(c *gin.Context) {
	var b struct {
		Name string `json:"name"`
		Pin  string `json:"pin"`
	}
	c.BindJSON(&b)

	var count int
	db.QueryRow("SELECT COUNT(*) FROM users WHERE is_admin = FALSE").Scan(&count)
	if count >= 5 {
		c.JSON(http.StatusForbidden, gin.H{"error": "User limit reached (5)"})
		return
	}

	_, err := db.Exec("INSERT INTO users (name, pin) VALUES (?, ?)", b.Name, b.Pin)
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Username taken"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "created"})
}

func ChangePin(c *gin.Context) {
	var b struct {
		UserID int    `json:"user_id"`
		NewPin string `json:"new_pin"`
	}
	c.BindJSON(&b)
	db.Exec("UPDATE users SET pin = ? WHERE id = ?", b.NewPin, b.UserID)
	c.JSON(http.StatusOK, gin.H{"status": "updated"})
}

func DeleteAccount(c *gin.Context) {
	id := c.Param("id")
	db.Exec("DELETE FROM users WHERE id = ?", id)
	c.JSON(http.StatusOK, gin.H{"status": "deleted"})
}

func AdminListUsers(c *gin.Context) {
	rows, _ := db.Query("SELECT id, name, is_admin FROM users")
	defer rows.Close()
	var users []map[string]interface{}
	for rows.Next() {
		var id int
		var name string
		var isAdmin bool
		rows.Scan(&id, &name, &isAdmin)
		users = append(users, map[string]interface{}{"id": id, "name": name, "is_admin": isAdmin})
	}
	c.JSON(http.StatusOK, users)
}

// Keep existing Workout/Log handlers below...
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

func LogSet(c *gin.Context) {
	var b struct {
		UserID int
		ExID   int
		Set    int
		Reps   int
		W      float64
	}
	c.BindJSON(&b)
	db.Exec(`INSERT INTO logs (user_id, exercise_id, set_number, reps, weight) VALUES (?, ?, ?, ?, ?)`, b.UserID, b.ExID, b.Set, b.Reps, b.W)
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func GetLastResult(c *gin.Context) {
	var reps int
	var weight float64
	err := db.QueryRow(`SELECT reps, weight FROM logs WHERE user_id = ? AND exercise_id = ? AND set_number = ? ORDER BY created_at DESC LIMIT 1`, c.Param("user_id"), c.Param("ex_id"), c.Param("set")).Scan(&reps, &weight)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"reps": 0, "weight": 0})
		return
	}
	c.JSON(http.StatusOK, gin.H{"reps": reps, "weight": weight})
}
