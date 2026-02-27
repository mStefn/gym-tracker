package main

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	initDB()
	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowAllOrigins: true,
		AllowMethods:    []string{"GET", "POST", "DELETE", "OPTIONS"},
		AllowHeaders:    []string{"Origin", "Content-Type"},
	}))

	r.POST("/login", Login)
	r.POST("/signup", SignUp)
	r.POST("/change-pin", ChangePin)
	r.POST("/admin/reset-pin", AdminResetPin)
	r.DELETE("/user/:id", DeleteAccount)
	r.GET("/admin/users", AdminListUsers)

	r.GET("/plans/:user_id", GetUserPlans)
	r.GET("/plan-exercises/:plan_id", GetPlanExercises)
	r.POST("/log", LogSet)
	r.GET("/last/:user_id/:ex_id/:set", GetLastResult)

	r.GET("/exercises", getExercises)
	r.POST("/plans", createPlan)
	r.POST("/plan-exercises", addExerciseByPool)
	r.DELETE("/plans/:id", deletePlan)

	r.Run("0.0.0.0:4000")
}

func getExercises(c *gin.Context) {
	rows, _ := db.Query("SELECT id, name, category FROM exercises ORDER BY category, name ASC")
	defer rows.Close()
	var list []map[string]interface{}
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

func deletePlan(c *gin.Context) {
	id := c.Param("id")
	db.Exec("DELETE FROM workout_plans WHERE id = ?", id)
	c.JSON(200, gin.H{"status": "deleted"})
}

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
