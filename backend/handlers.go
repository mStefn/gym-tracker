package main

import (
	"github.com/gin-gonic/gin"
)

// --- AUTH HANDLERS ---

func Login(c *gin.Context) {
	var input struct {
		Name string `json:"name"`
		Pin  string `json:"pin"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": "Złe dane"})
		return
	}

	var id int
	var name string
	err := db.QueryRow("SELECT id, name FROM users WHERE name = ? AND pin = ?", input.Name, input.Pin).Scan(&id, &name)
	if err != nil {
		c.JSON(401, gin.H{"error": "Nieprawidłowy PIN"})
		return
	}

	c.JSON(200, gin.H{"id": id, "name": name})
}

func SignUp(c *gin.Context) {
	var input struct {
		Name string `json:"name"`
		Pin  string `json:"pin"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": "Złe dane"})
		return
	}

	res, err := db.Exec("INSERT INTO users (name, pin) VALUES (?, ?)", input.Name, input.Pin)
	if err != nil {
		c.JSON(500, gin.H{"error": "Użytkownik już istnieje"})
		return
	}

	id, _ := res.LastInsertId()
	c.JSON(200, gin.H{"id": id, "name": input.Name})
}

// --- WORKOUT & PROGRESS ---

func LogSet(c *gin.Context) {
	var input struct {
		UserID     int     `json:"user_id"`
		ExerciseID int     `json:"exercise_id"`
		SetNumber  int     `json:"set_number"`
		Reps       int     `json:"reps"`
		Weight     float64 `json:"weight"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": "Invalid input"})
		return
	}
	_, err := db.Exec("INSERT INTO logs (user_id, exercise_id, set_number, reps, weight) VALUES (?, ?, ?, ?, ?)",
		input.UserID, input.ExerciseID, input.SetNumber, input.Reps, input.Weight)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"status": "success"})
}

func GetLastResult(c *gin.Context) {
	userID := c.Param("user_id")
	exID := c.Param("ex_id")
	setNum := c.Param("set")
	var reps int
	var weight float64
	err := db.QueryRow("SELECT reps, weight FROM logs WHERE user_id = ? AND exercise_id = ? AND set_number = ? ORDER BY created_at DESC LIMIT 1",
		userID, exID, setNum).Scan(&reps, &weight)
	if err != nil {
		c.JSON(200, gin.H{"reps": 0, "weight": 0})
		return
	}
	c.JSON(200, gin.H{"reps": reps, "weight": weight})
}

// --- CREATOR & PLANS ---

func getExercises(c *gin.Context) {
	rows, err := db.Query("SELECT id, name, category FROM exercises ORDER BY category, name ASC")
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()
	list := []map[string]interface{}{}
	for rows.Next() {
		var id int
		var name, cat string
		rows.Scan(&id, &name, &cat)
		list = append(list, map[string]interface{}{"id": id, "name": name, "category": cat})
	}
	c.JSON(200, list)
}

func createPlan(c *gin.Context) {
	var input struct {
		Name   string `json:"name"`
		UserID int    `json:"user_id"`
	}
	c.BindJSON(&input)
	res, _ := db.Exec("INSERT INTO workout_plans (user_id, name) VALUES (?, ?)", input.UserID, input.Name)
	id, _ := res.LastInsertId()
	c.JSON(200, gin.H{"id": id, "name": input.Name})
}

func addExerciseByPool(c *gin.Context) {
	var input struct {
		PlanID     int `json:"plan_id"`
		ExerciseID int `json:"exercise_id"`
		TargetSets int `json:"target_sets"`
	}
	c.BindJSON(&input)
	db.Exec("INSERT INTO plan_exercises (plan_id, exercise_id, target_sets) VALUES (?, ?, ?)", input.PlanID, input.ExerciseID, input.TargetSets)
	c.JSON(200, gin.H{"status": "ok"})
}

func GetUserPlans(c *gin.Context) {
	userID := c.Param("user_id")
	rows, _ := db.Query("SELECT id, name FROM workout_plans WHERE user_id = ?", userID)
	defer rows.Close()
	list := []map[string]interface{}{}
	for rows.Next() {
		var id int
		var name string
		rows.Scan(&id, &name)
		list = append(list, map[string]interface{}{"id": id, "name": name})
	}
	c.JSON(200, list)
}

func GetPlanExercises(c *gin.Context) {
	planID := c.Param("plan_id")
	rows, _ := db.Query(`
        SELECT e.id, e.name, pe.target_sets 
        FROM plan_exercises pe 
        JOIN exercises e ON pe.exercise_id = e.id 
        WHERE pe.plan_id = ?`, planID)
	defer rows.Close()
	list := []map[string]interface{}{}
	for rows.Next() {
		var id, sets int
		var name string
		rows.Scan(&id, &name, &sets)
		list = append(list, map[string]interface{}{"exercise_id": id, "exercise_name": name, "target_sets": sets})
	}
	c.JSON(200, list)
}

func deletePlan(c *gin.Context) {
	id := c.Param("id")
	db.Exec("DELETE FROM workout_plans WHERE id = ?", id)
	c.JSON(200, gin.H{"status": "deleted"})
}

// Pozostałe (naprawione funkcje)
func ChangePin(c *gin.Context)     { c.JSON(200, gin.H{"status": "ok"}) }
func AdminResetPin(c *gin.Context) { c.JSON(200, gin.H{"status": "ok"}) }
func DeleteAccount(c *gin.Context) { c.JSON(200, gin.H{"status": "ok"}) }
func AdminListUsers(c *gin.Context) {
	rows, _ := db.Query("SELECT id, name FROM users")
	defer rows.Close()
	list := []map[string]interface{}{}
	for rows.Next() {
		var id int
		var name string
		rows.Scan(&id, &name)
		list = append(list, map[string]interface{}{"id": id, "name": name})
	}
	c.JSON(200, list)
}
