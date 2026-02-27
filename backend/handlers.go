package main

import (
	"golang.org/x/crypto/bcrypt"
	"github.com/gin-gonic/gin"
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
	err := db.QueryRow("SELECT id, name, pin FROM users WHERE name = ?", input.Name).Scan(&id, &name, &hashedPin)
	if err != nil {
		c.JSON(401, gin.H{"error": "Invalid credentials"})
		return
	}

	if bcrypt.CompareHashAndPassword([]byte(hashedPin), []byte(input.Pin)) != nil {
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

	res, err := db.Exec("INSERT INTO users (name, pin) VALUES (?, ?)", input.Name, string(hashed))
	if err != nil {
		c.JSON(500, gin.H{"error": "Username already exists"})
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

func GetExercises(c *gin.Context) {
	rows, err := db.Query("SELECT id, name, category FROM exercises ORDER BY category, name ASC")
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
		list = append(list, map[string]interface{}{"id": id, "name": name, "category": cat})
	}
	c.JSON(200, list)
}

func CreatePlan(c *gin.Context) {
	var input struct {
		Name   string `json:"name"`
		UserID int    `json:"user_id"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": "Invalid input"})
		return
	}
	res, err := db.Exec("INSERT INTO workout_plans (user_id, name) VALUES (?, ?)", input.UserID, input.Name)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to create plan"})
		return
	}
	id, _ := res.LastInsertId()
	c.JSON(200, gin.H{"id": id, "name": input.Name})
}

func AddExerciseToPlan(c *gin.Context) {
	var input struct {
		PlanID     int `json:"plan_id"`
		ExerciseID int `json:"exercise_id"`
		TargetSets int `json:"target_sets"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": "Invalid input"})
		return
	}
	_, err := db.Exec("INSERT INTO plan_exercises (plan_id, exercise_id, target_sets) VALUES (?, ?, ?)", input.PlanID, input.ExerciseID, input.TargetSets)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to add exercise to plan"})
		return
	}
	c.JSON(200, gin.H{"status": "ok"})
}

func GetUserPlans(c *gin.Context) {
	userID := c.Param("user_id")
	rows, err := db.Query("SELECT id, name FROM workout_plans WHERE user_id = ?", userID)
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
		list = append(list, map[string]interface{}{"id": id, "name": name})
	}
	c.JSON(200, list)
}

func GetPlanExercises(c *gin.Context) {
	planID := c.Param("plan_id")
	rows, err := db.Query(`
        SELECT e.id, e.name, pe.target_sets 
        FROM plan_exercises pe 
        JOIN exercises e ON pe.exercise_id = e.id 
        WHERE pe.plan_id = ?`, planID)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to fetch plan exercises"})
		return
	}
	defer rows.Close()
	list := []map[string]interface{}{}
	for rows.Next() {
		var id, sets int
		var name string
		if err := rows.Scan(&id, &name, &sets); err != nil {
			continue
		}
		list = append(list, map[string]interface{}{"exercise_id": id, "exercise_name": name, "target_sets": sets})
	}
	c.JSON(200, list)
}

func DeletePlan(c *gin.Context) {
	id := c.Param("id")
	result, err := db.Exec("DELETE FROM workout_plans WHERE id = ?", id)
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

// --- HEALTH CHECK ---

func HealthCheck(c *gin.Context) {
	if err := db.Ping(); err != nil {
		c.JSON(500, gin.H{"status": "unhealthy", "error": "Database unreachable"})
		return
	}
	c.JSON(200, gin.H{"status": "healthy"})
}

func ChangePin(c *gin.Context) {
	var input struct {
		UserID int    `json:"user_id"`
		OldPin string `json:"old_pin"`
		NewPin string `json:"new_pin"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": "Invalid input"})
		return
	}

	var hashedPin string
	err := db.QueryRow("SELECT pin FROM users WHERE id = ?", input.UserID).Scan(&hashedPin)
	if err != nil {
		c.JSON(404, gin.H{"error": "User not found"})
		return
	}

	if bcrypt.CompareHashAndPassword([]byte(hashedPin), []byte(input.OldPin)) != nil {
		c.JSON(401, gin.H{"error": "Current PIN is incorrect"})
		return
	}

	newHashed, err := bcrypt.GenerateFromPassword([]byte(input.NewPin), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(500, gin.H{"error": "Server error"})
		return
	}

	_, err = db.Exec("UPDATE users SET pin = ? WHERE id = ?", string(newHashed), input.UserID)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to update PIN"})
		return
	}
	c.JSON(200, gin.H{"status": "ok"})
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

	newHashed, err := bcrypt.GenerateFromPassword([]byte(input.NewPin), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(500, gin.H{"error": "Server error"})
		return
	}

	result, err := db.Exec("UPDATE users SET pin = ? WHERE id = ?", string(newHashed), input.UserID)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to reset PIN"})
		return
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		c.JSON(404, gin.H{"error": "User not found"})
		return
	}
	c.JSON(200, gin.H{"status": "ok"})
}

func DeleteAccount(c *gin.Context) {
	id := c.Param("id")
	result, err := db.Exec("DELETE FROM users WHERE id = ?", id)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to delete user"})
		return
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		c.JSON(404, gin.H{"error": "User not found"})
		return
	}
	c.JSON(200, gin.H{"status": "deleted"})
}

func AdminListUsers(c *gin.Context) {
	rows, err := db.Query("SELECT id, name FROM users")
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
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
