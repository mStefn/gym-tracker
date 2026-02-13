package main

import (
	"database/sql"
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/mattn/go-sqlite3"
)

func main() {
	// 1. Pobieranie ścieżki bazy z env (zdefiniowane w docker-compose)
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "/data/db.sqlite" // Domyślna ścieżka wewnątrz kontenera
	}

	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		log.Fatal("Błąd otwarcia bazy:", err)
	}
	defer db.Close()

	// 2. Tworzenie tabel
	_, err = db.Exec(`
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
	);`)
	if err != nil {
		log.Fatal(err)
	}

	// 3. INTELIGENTNY SEEDER (Doda nowe, ale nie usunie starych ID)
	type Ex struct {
		Name     string
		Category string
		Sets     int
	}

	plan := []Ex{
		{"Pull-ups", "Upper A", 3}, {"Incline Chest Press (Machine)", "Upper A", 3}, {"Dumbbell Lateral Raises", "Upper A", 3}, {"Triceps Rope Pushdown", "Upper A", 3}, {"Cable Biceps Curl", "Upper A", 3},
		{"Seated Machine Row", "Upper B", 3}, {"Machine Chest Fly", "Upper B", 3}, {"Machine Shoulder Press", "Upper B", 3}, {"Machine Assisted Dips", "Upper B", 3}, {"Machine Biceps Curl", "Upper B", 3},
		{"Incline Chest Press (Machine)", "Upper C", 2}, {"Machine Chest Fly", "Upper C", 2}, {"Straight-Arm Pulldown", "Upper C", 3}, {"Face Pull (Rope)", "Upper C", 3}, {"Cable Biceps Curl", "Upper C", 3}, {"Triceps Rope Pushdown", "Upper C", 3},
		{"Machine Squat", "Lower A", 3}, {"Leg Extension (Machine)", "Lower A", 3}, {"Leg Curl (Machine)", "Lower A", 3}, {"Hip Thrust (Machine)", "Lower A", 3}, {"Abbs", "Lower A", 3},
		{"Lateral Raises", "Lower B", 3}, {"Machine Shoulder Press", "Lower B", 3}, {"Face Pull (Rope)", "Lower B", 3}, {"Triceps Rope Pushdown", "Lower B", 3}, {"Machine Biceps Curl", "Lower B", 3},
	}

	for _, e := range plan {
		var existingID int
		// Szukamy po nazwie i kategorii
		err := db.QueryRow("SELECT id FROM exercises WHERE name = ? AND category = ?", e.Name, e.Category).Scan(&existingID)

		if err == sql.ErrNoRows {
			// Jeśli nie ma – dodaj
			db.Exec("INSERT INTO exercises (name, category, sets) VALUES (?, ?, ?)", e.Name, e.Category, e.Sets)
		} else {
			// Jeśli jest – tylko aktualizuj liczbę serii (na wypadek zmiany w planie)
			db.Exec("UPDATE exercises SET sets = ? WHERE id = ?", e.Sets, existingID)
		}
	}

	// 4. GIN SETUP
	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{"http://192.168.1.166:5000", "http://localhost:5000"},
		AllowMethods: []string{"GET", "POST", "OPTIONS"},
		AllowHeaders: []string{"Origin", "Content-Type"},
	}))

	r.GET("/exercises/:category", func(c *gin.Context) {
		category := c.Param("category")
		rows, _ := db.Query("SELECT id, name, sets FROM exercises WHERE category = ?", category)
		defer rows.Close()
		result := []gin.H{}
		for rows.Next() {
			var id, sets int
			var name string
			rows.Scan(&id, &name, &sets)
			result = append(result, gin.H{"id": id, "name": name, "sets": sets})
		}
		c.JSON(200, result)
	})

	r.GET("/last/:id/:set", func(c *gin.Context) {
		var reps int
		var weight float64
		err := db.QueryRow(`SELECT reps, weight FROM logs WHERE exercise_id = ? AND set_number = ? ORDER BY created_at DESC LIMIT 1`, c.Param("id"), c.Param("set")).Scan(&reps, &weight)
		if err != nil {
			c.JSON(200, gin.H{"reps": 0, "weight": 0})
			return
		}
		c.JSON(200, gin.H{"reps": reps, "weight": weight})
	})

	r.POST("/log", func(c *gin.Context) {
		var b struct {
			ExID int     `json:"exercise_id"`
			Set  int     `json:"set_number"`
			Reps int     `json:"reps"`
			W    float64 `json:"weight"`
		}
		if err := c.BindJSON(&b); err != nil {
			c.JSON(400, gin.H{"error": "invalid json"})
			return
		}
		db.Exec(`INSERT INTO logs (exercise_id, set_number, reps, weight) VALUES (?, ?, ?, ?)`, b.ExID, b.Set, b.Reps, b.W)
		c.JSON(200, gin.H{"status": "ok"})
	})

	r.Run("0.0.0.0:4000")
}
