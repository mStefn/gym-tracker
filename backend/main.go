package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/mattn/go-sqlite3"
)

func main() {
	// 1. POŁĄCZENIE Z BAZĄ (Ścieżka z environment variable z Docker Compose)
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "./db.sqlite"
	}

	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		log.Fatal("Błąd otwarcia bazy:", err)
	}
	defer db.Close()

	// 2. TWORZENIE TABEL
	query := `
	CREATE TABLE IF NOT EXISTS exercises (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		category TEXT NOT NULL,
		sets INTEGER NOT NULL
	);
	CREATE TABLE IF NOT EXISTS logs (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		exercise_id INTEGER NOT NULL,
		set_number INTEGER NOT NULL,
		reps INTEGER NOT NULL,
		weight REAL NOT NULL, 
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);`

	if _, err := db.Exec(query); err != nil {
		log.Fatal("Błąd tworzenia tabel:", err)
	}

	// 3. SEEDER (Doda dane, jeśli baza jest pusta)
	var count int
	db.QueryRow("SELECT COUNT(*) FROM exercises").Scan(&count)
	if count == 0 {
		log.Println("Baza pusta, dodaję przykładowe ćwiczenia...")
		seedQuery := `
		INSERT INTO exercises (name, category, sets) VALUES 
		('Bench Press', 'Upper A', 3),
		('Pull Ups', 'Upper A', 3),
		('Shoulder Press', 'Upper B', 3),
		('Barbell Row', 'Upper B', 3),
		('Incline DB Press', 'Upper C', 3),
		('Lateral Raises', 'Upper C', 4),
		('Squats', 'Lower A', 4),
		('Leg Press', 'Lower A', 3),
		('Deadlift', 'Lower B', 3),
		('Leg Curls', 'Lower B', 4);`

		if _, err := db.Exec(seedQuery); err != nil {
			log.Println("Błąd podczas seedowania:", err)
		} else {
			log.Println("Pomyślnie dodano ćwiczenia do bazy.")
		}
	}

	// 4. KONFIGURACJA GIN
	r := gin.Default()

	// CORS - musi pozwalać na port 5000 (Twój frontend)
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://192.168.1.166:5000", "http://localhost:5000"},
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type"},
		AllowCredentials: true,
	}))

	// ENDPOINT: Pobierz ćwiczenia z kategorii
	r.GET("/exercises/:category", func(c *gin.Context) {
		category := c.Param("category")
		rows, err := db.Query("SELECT id, name, sets FROM exercises WHERE category = ?", category)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		result := []gin.H{}
		for rows.Next() {
			var id, sets int
			var name string
			rows.Scan(&id, &name, &sets)
			result = append(result, gin.H{
				"id":   id,
				"name": name,
				"sets": sets,
			})
		}
		c.JSON(http.StatusOK, result)
	})

	// ENDPOINT: Pobierz ostatni wynik konkretnej serii
	r.GET("/last/:id/:set", func(c *gin.Context) {
		id := c.Param("id")
		set := c.Param("set")

		var reps int
		var weight float64
		err := db.QueryRow(`
			SELECT reps, weight FROM logs 
			WHERE exercise_id = ? AND set_number = ? 
			ORDER BY created_at DESC LIMIT 1`, id, set).Scan(&reps, &weight)

		if err != nil {
			// Jeśli nie ma wyników, zwracamy zera zamiast błędu
			c.JSON(http.StatusOK, gin.H{"reps": 0, "weight": 0})
			return
		}
		c.JSON(http.StatusOK, gin.H{"reps": reps, "weight": weight})
	})

	// ENDPOINT: Zapisz wykonaną serię
	r.POST("/log", func(c *gin.Context) {
		var body struct {
			ExerciseID int     `json:"exercise_id"`
			SetNumber  int     `json:"set_number"`
			Reps       int     `json:"reps"`
			Weight     float64 `json:"weight"`
		}

		if err := c.BindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid json"})
			return
		}

		_, err := db.Exec(`INSERT INTO logs (exercise_id, set_number, reps, weight) VALUES (?, ?, ?, ?)`,
			body.ExerciseID, body.SetNumber, body.Reps, body.Weight)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// 5. URUCHOMIENIE (0.0.0.0 jest kluczowe dla Dockera!)
	log.Println("Serwer biega na porcie 4000...")
	r.Run("0.0.0.0:4000")
}
