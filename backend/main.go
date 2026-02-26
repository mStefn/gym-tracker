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

	// API Routes
	r.GET("/users", GetUsers)
	r.POST("/auth", AuthUser)
	r.GET("/plans/:user_id", GetUserPlans)
	// We will add more routes as we develop new features

	r.Run("0.0.0.0:4000")
}
