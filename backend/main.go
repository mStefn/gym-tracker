package main

import (
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/zsais/go-gin-prometheus" // Biblioteka do metryk
)

func main() {
	// 1. Inicjalizacja baz danych i auth
	initDB()
	initAuth()

	// 2. Utworzenie routera Gin
	r := gin.Default()

	// --- 3. KONFIGURACJA PROMETHEUSA ---
	// Wystawia endpoint /metrics dla Twojej lokalnej instancji Prometheusa
	p := ginprometheus.NewPrometheus("gin")
	p.Use(r)
	// ----------------------------------

	// 4. Konfiguracja CORS (Twoje oryginalne ustawienia)
	allowOrigin := os.Getenv("CORS_ORIGIN")
	if allowOrigin == "" {
		allowOrigin = "*"
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

	// 5. Trasy Publiczne
	r.GET("/health", HealthCheck)
	r.POST("/login", Login)
	r.POST("/signup", SignUp)

	// 6. Trasy Zabezpieczone (Grupa Auth)
	auth := r.Group("/")
	auth.Use(AuthRequired())
	{
		auth.POST("/change-pin", ChangePin)
		auth.GET("/plans/:user_id", GetUserPlans)
		auth.GET("/plan-exercises/:plan_id", GetPlanExercises)
		auth.POST("/log", LogSet)
		auth.GET("/last/:user_id/:ex_id/:set", GetLastResult)
		auth.GET("/exercises", GetExercises)

		// Funkcje dla planów
		auth.POST("/plans", CreatePlan)
		auth.PUT("/plan/:id", UpdatePlanName)
		auth.DELETE("/plan/:id", DeletePlan)

		// Funkcje dla ćwiczeń w planie
		auth.POST("/plan-exercises", AddExerciseToPlan)
		auth.DELETE("/plan-exercises/:plan_id", DeletePlanExercises)

		auth.GET("/stats/:user_id", GetUserStats)
		auth.POST("/exercises/find-or-create", FindOrCreateExerciseHandler)

		auth.POST("/weight", LogBodyWeight)
		auth.GET("/dashboard/:user_id", GetDashboardData)

		auth.GET("/stats/advanced/:user_id", GetAdvancedStats)
		auth.GET("/stats/exercise/:user_id/:ex_id", GetExerciseDeepDive)

		// Funkcje zarządzania kontem (Settings)
		auth.DELETE("/history/:user_id", ClearOwnLogs)
		auth.DELETE("/account/:user_id", DeleteOwnAccount)
	}

	// 7. Administracja
	admin := r.Group("/admin")
	admin.Use(AuthRequired(), AdminRequired())
	{
		admin.GET("/users", AdminListUsers)
		admin.POST("/reset-pin", AdminResetPin)
	}

	// Dodatkowa trasa admina
	r.DELETE("/user/:id", AuthRequired(), AdminRequired(), DeleteAccount)

	// 8. Start serwera na Twoim porcie 4000
	r.Run("0.0.0.0:4000")
}

// --- Dodatkowe Typy i Handlery z Twojego pliku ---

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
