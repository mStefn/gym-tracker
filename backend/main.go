package main

import (
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	ginprometheus "github.com/zsais/go-gin-prometheus"
)

func main() {
	initDB()
	initAuth()

	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	// Prometheus metrics.
	p := ginprometheus.NewPrometheus("gin")
	p.Use(r)

	// CORS configuration.
	allowOrigin := os.Getenv("CORS_ORIGIN")
	if allowOrigin == "" {
		allowOrigin = "*"
	}

	corsConfig := cors.Config{
		AllowMethods: []string{
			"GET",
			"POST",
			"PUT",
			"DELETE",
			"OPTIONS",
		},
		AllowHeaders: []string{
			"Origin",
			"Content-Type",
			"Authorization",
		},
	}

	if allowOrigin == "*" {
		corsConfig.AllowAllOrigins = true
	} else {
		corsConfig.AllowOrigins = []string{allowOrigin}
	}

	r.Use(cors.New(corsConfig))

	// Public routes.
	r.GET("/health", HealthCheck)
	r.POST("/login", Login)
	r.POST("/signup", SignUp)

	// Protected routes.
	auth := r.Group("/")
	auth.Use(AuthRequired())
	{
		auth.POST("/change-pin", ChangePin)

		// Workout plans.
		auth.GET("/plans", GetUserPlans)
		auth.POST("/plans", CreatePlan)
		auth.PUT("/plan/:id", UpdatePlanName)
		auth.DELETE("/plan/:id", DeletePlan)

		// Exercises in workout plans.
		auth.GET("/plan-exercises/:plan_id", GetPlanExercises)
		auth.POST("/plan-exercises", AddExerciseToPlan)
		auth.DELETE("/plan-exercises/:plan_id", DeletePlanExercises)
		auth.POST("/plan-exercises/sync", SyncPlanExercises)

		// Active workout sessions.
		auth.POST("/workouts", StartWorkout)
		auth.GET("/workouts/active", GetActiveWorkout)
		auth.GET("/workouts/:id", GetWorkout)
		auth.POST("/workouts/:id/exercises", AddExerciseToWorkout)
		auth.DELETE(
			"/workouts/:id/exercises/:session_exercise_id",
			RemoveExerciseFromWorkout,
		)
		auth.POST("/workouts/:id/sets", LogWorkoutSet)
		auth.POST("/workouts/:id/finish", FinishWorkout)
		auth.POST("/workouts/:id/cancel", CancelWorkout)

		// Legacy progress endpoints.
		auth.POST("/log", LogSet)
		auth.GET("/last/:user_id/:ex_id/:set", GetLastResult)

		// Exercises.
		auth.GET("/exercises", GetExercises)
		auth.POST("/exercises/find-or-create", FindOrCreateExerciseHandler)

		// Dashboard and statistics.
		auth.GET("/stats/:user_id", GetUserStats)
		auth.POST("/weight", LogBodyWeight)
		auth.GET("/dashboard/:user_id", GetDashboardData)

		// New endpoint: user ID comes from the authenticated token.
		auth.GET("/stats/advanced", GetAdvancedStats)

		// Legacy route retained for compatibility.
		auth.GET("/stats/advanced/:user_id", GetAdvancedStats)

		auth.GET("/stats/exercise/:user_id/:ex_id", GetExerciseDeepDive)

		// Account management.
		auth.DELETE("/history/:user_id", ClearOwnLogs)
		auth.DELETE("/account/:user_id", DeleteOwnAccount)
	}

	// Admin routes.
	admin := r.Group("/admin")
	admin.Use(AuthRequired(), AdminRequired())
	{
		admin.GET("/users", AdminListUsers)
		admin.POST("/reset-pin", AdminResetPin)
	}

	r.DELETE(
		"/user/:id",
		AuthRequired(),
		AdminRequired(),
		DeleteAccount,
	)

	if err := r.Run("0.0.0.0:4000"); err != nil {
		panic(err)
	}
}
