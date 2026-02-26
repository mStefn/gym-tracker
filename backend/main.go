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
		AllowMethods:    []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:    []string{"Origin", "Content-Type"},
	}))

	// API Routes for Authentication
	r.POST("/login", Login)
	r.POST("/signup", SignUp)

	// Data Routes
	r.GET("/plans/:user_id", GetUserPlans)
	r.GET("/plan-exercises/:plan_id", GetPlanExercises)
	r.POST("/log", LogSet)
	r.GET("/last/:user_id/:ex_id/:set", GetLastResult)

	r.Run("0.0.0.0:4000")
}
