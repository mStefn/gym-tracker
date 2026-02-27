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

	// AUTH
	r.POST("/login", Login)
	r.POST("/signup", SignUp)
	r.POST("/change-pin", ChangePin)
	r.POST("/admin/reset-pin", AdminResetPin)
	r.DELETE("/user/:id", DeleteAccount)
	r.GET("/admin/users", AdminListUsers)

	// WORKOUT & PROGRESS
	r.GET("/plans/:user_id", GetUserPlans)
	r.GET("/plan-exercises/:plan_id", GetPlanExercises)
	r.POST("/log", LogSet)
	r.GET("/last/:user_id/:ex_id/:set", GetLastResult)

	// CREATOR
	r.GET("/exercises", getExercises)
	r.POST("/plans", createPlan)
	r.POST("/plan-exercises", addExerciseByPool)
	r.DELETE("/plans/:id", deletePlan)

	r.Run("0.0.0.0:4000")
}
