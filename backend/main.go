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

	// Public routes (no auth)
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

		// NOWA TRASA DLA STATYSTYK
		auth.GET("/stats/:user_id", GetUserStats)
	}

	// Admin routes (auth + admin check)
	admin := r.Group("/admin")
	admin.Use(AuthRequired(), AdminRequired())
	{
		admin.GET("/users", AdminListUsers)
		admin.POST("/reset-pin", AdminResetPin)
	}

	// Admin delete user also needs admin auth
	r.DELETE("/user/:id", AuthRequired(), AdminRequired(), DeleteAccount)

	r.Run("0.0.0.0:4000")
}
