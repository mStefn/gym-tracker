package main

import (
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	initDB()
	initAuth()

	r := gin.Default()

	allowOrigin := os.Getenv("CORS_ORIGIN")
	if allowOrigin == "" {
		allowOrigin = "*"
	}

	corsConfig := cors.Config{
		AllowMethods: []string{"GET", "POST", "DELETE", "OPTIONS"},
		AllowHeaders: []string{"Origin", "Content-Type", "Authorization"},
	}
	if allowOrigin == "*" {
		corsConfig.AllowAllOrigins = true
	} else {
		corsConfig.AllowOrigins = []string{allowOrigin}
	}
	r.Use(cors.New(corsConfig))

	// Health check (public)
	r.GET("/health", HealthCheck)

	// Public routes
	r.POST("/login", Login)
	r.POST("/signup", SignUp)

	// Authenticated routes
	auth := r.Group("/")
	auth.Use(AuthRequired())
	{
		auth.POST("/change-pin", ChangePin)
		auth.GET("/plans/:user_id", GetUserPlans)
		auth.GET("/plan-exercises/:plan_id", GetPlanExercises)
		auth.POST("/log", LogSet)
		auth.GET("/last/:user_id/:ex_id/:set", GetLastResult)
		auth.GET("/exercises", GetExercises)
		auth.POST("/plans", CreatePlan)
		auth.POST("/plan-exercises", AddExerciseToPlan)
		auth.DELETE("/plan/:id", DeletePlan)
		auth.GET("/stats/:user_id", GetUserStats)
		auth.POST("/exercises/find-or-create", FindOrCreateExerciseHandler)

		// NOWE TRASY DLA PRO DASHBOARDU
		auth.POST("/weight", LogBodyWeight)
		auth.GET("/dashboard/:user_id", GetDashboardData)
	}

	// Admin routes
	admin := r.Group("/admin")
	admin.Use(AuthRequired(), AdminRequired())
	{
		admin.GET("/users", AdminListUsers)
		admin.POST("/reset-pin", AdminResetPin)
	}

	r.DELETE("/user/:id", AuthRequired(), AdminRequired(), DeleteAccount)

	r.Run("0.0.0.0:4000")
}

// Handler dla Wizarda
type FindOrCreateReq struct {
	Name     string `json:"name"`
	Category string `json:"category"`
}

func FindOrCreateExerciseHandler(c *gin.Context) {
	var req FindOrCreateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Invalid input"})
		return
	}

	id, err := GetOrCreateExerciseDB(req.Name, req.Category)
	if err != nil {
		c.JSON(500, gin.H{"error": "Database error while creating exercise"})
		return
	}

	c.JSON(200, gin.H{"id": id, "name": req.Name, "category": req.Category})
}
