package main

import (
	"net/http"

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

	// --- AUTH ROUTES ---
	r.POST("/login", Login)
	r.POST("/signup", SignUp)
	r.POST("/change-pin", ChangePin)
	r.POST("/admin/reset-pin", AdminResetPin)
	r.DELETE("/user/:id", DeleteAccount)
	r.GET("/admin/users", AdminListUsers)

	// --- WORKOUT ROUTES ---
	r.GET("/plans/:user_id", GetUserPlans)
	r.GET("/plan-exercises/:plan_id", GetPlanExercises)
	r.POST("/log", LogSet)
	r.GET("/last/:user_id/:ex_id/:set", GetLastResult)

	// --- PLAN CREATOR ROUTES ---
	r.POST("/plans", createPlan)
	r.POST("/plan-exercises", addExercise)
	r.DELETE("/plans/:id", deletePlan)

	r.Run("0.0.0.0:4000")
}

// --- HANDLERS DLA KREATORA PLANÓW ---

func createPlan(c *gin.Context) {
	var input struct {
		Name   string `json:"name"`
		UserID int    `json:"user_id"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	res, err := db.Exec("INSERT INTO workout_plans (user_id, name) VALUES (?, ?)", input.UserID, input.Name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not create plan"})
		return
	}

	id, _ := res.LastInsertId()
	c.JSON(http.StatusOK, gin.H{"id": id, "name": input.Name})
}

func addExercise(c *gin.Context) {
	var input struct {
		PlanID     int    `json:"plan_id"`
		Name       string `json:"name"`
		TargetSets int    `json:"target_sets"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	var exerciseID int64
	err := db.QueryRow("SELECT id FROM exercises WHERE name = ?", input.Name).Scan(&exerciseID)
	if err != nil {
		res, _ := db.Exec("INSERT INTO exercises (name) VALUES (?)", input.Name)
		exerciseID, _ = res.LastInsertId()
	}

	_, err = db.Exec("INSERT INTO plan_exercises (plan_id, exercise_id, target_sets) VALUES (?, ?, ?)",
		input.PlanID, exerciseID, input.TargetSets)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not add exercise to plan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success"})
}

func deletePlan(c *gin.Context) {
	id := c.Param("id")
	_, err := db.Exec("DELETE FROM workout_plans WHERE id = ?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not delete plan"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "deleted"})
}
