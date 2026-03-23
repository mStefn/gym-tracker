package main

import (
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	ginprometheus "github.com/zsais/go-gin-prometheus"
)

func main() {
	// Initialize core services
	initDB()
	initAuth()

	// Set Gin mode based on environment (default to release for security)
	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	// Prometheus metrics setup
	// This enables the /metrics endpoint for Prometheus scraping
	p := ginprometheus.NewPrometheus("gin")
	p.Use(r)

	// CORS (Cross-Origin Resource Sharing) Configuration
	allowOrigin := os.Getenv("CORS_ORIGIN")
	if allowOrigin == "" {
		allowOrigin = "*" // Fallback for development
	}

	corsConfig := cors.Config{
		AllowMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders: []string{"Origin", "Content-Type", "Authorization"},
	}

	if allowOrigin == "*" {
		corsConfig.AllowAllOrigins = true
	} else {
		corsConfig.AllowOrigins = []string{allowOrigin}
	}
	r.Use(cors.New(corsConfig))

	// --- PUBLIC ROUTES ---
	r.GET("/health", HealthCheck)
	r.POST("/login", Login)
	r.POST("/signup", SignUp)

	// --- PROTECTED ROUTES (User Access) ---
	auth := r.Group("/")
	auth.Use(AuthRequired())
	{
		auth.POST("/change-pin", ChangePin)
		auth.GET("/plans/:user_id", GetUserPlans)
		auth.GET("/plan-exercises/:plan_id", GetPlanExercises)
		auth.POST("/log", LogSet)
		auth.GET("/last/:user_id/:ex_id/:set", GetLastResult)
		auth.GET("/exercises", GetExercises)

		// Plan management
		auth.POST("/plans", CreatePlan)
		auth.PUT("/plan/:id", UpdatePlanName)
		auth.DELETE("/plan/:id", DeletePlan)

		// Plan exercise management
		auth.POST("/plan-exercises", AddExerciseToPlan)
		auth.DELETE("/plan-exercises/:plan_id", DeletePlanExercises)
		auth.POST("/plan-exercises/sync", SyncPlanExercises)

		// Statistics and Dashboard
		auth.GET("/stats/:user_id", GetUserStats)
		auth.POST("/exercises/find-or-create", FindOrCreateExerciseHandler)
		auth.POST("/weight", LogBodyWeight)
		auth.GET("/dashboard/:user_id", GetDashboardData)
		auth.GET("/stats/advanced/:user_id", GetAdvancedStats)
		auth.GET("/stats/exercise/:user_id/:ex_id", GetExerciseDeepDive)

		// Account management
		auth.DELETE("/history/:user_id", ClearOwnLogs)
		auth.DELETE("/account/:user_id", DeleteOwnAccount)
	}

	// --- ADMIN ROUTES ---
	admin := r.Group("/admin")
	admin.Use(AuthRequired(), AdminRequired())
	{
		admin.GET("/users", AdminListUsers)
		admin.POST("/reset-pin", AdminResetPin)
	}

	// High-level admin actions
	r.DELETE("/user/:id", AuthRequired(), AdminRequired(), DeleteAccount)

	// Start server on the internal container port
	r.Run("0.0.0.0:4000")
}

// FindOrCreateReq defines the payload for finding/creating exercises
type FindOrCreateReq struct {
	Name     string `json:"name"`
	Category string `json:"category"`
}

// FindOrCreateExerciseHandler handles the logic for exercise lookup or creation
func FindOrCreateExerciseHandler(c *gin.Context) {
	var req FindOrCreateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Invalid input"})
		return
	}

	id, err := GetOrCreateExerciseDB(req.Name, req.Category)
	if err != nil {
		c.JSON(500, gin.H{"error": "Database error while processing exercise"})
		return
	}

	c.JSON(200, gin.H{"id": id, "name": req.Name, "category": req.Category})
}
