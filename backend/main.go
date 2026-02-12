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
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "./db.sqlite"
	}

	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// Tworzenie tabel
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

	// SEEDER: Czyścimy i wgrywamy Twój plan
	db.Exec("DELETE FROM exercises")
	seedQuery := `
	INSERT INTO exercises (name, category, sets) VALUES 
	-- Upper A
	('Pull-ups', 'Upper A', 3),
	('Incline Chest Press (Machine)', 'Upper A', 3),
	('Dumbbell Lateral Raises', 'Upper A', 3),
	('Triceps Rope Pushdown', 'Upper A', 3),
	('Cable Biceps Curl', 'Upper A', 3),

	-- Upper B
	('Seated Machine Row', 'Upper B', 3),
	('Machine Chest Fly', 'Upper B', 3),
	('Machine Shoulder Press', 'Upper B', 3),
	('Machine Assisted Dips', 'Upper B', 3),
	('Machine Biceps Curl', 'Upper B', 3),

	-- Upper C
	('Incline Chest Press (Machine)', 'Upper C', 2),
	('Machine Chest Fly', 'Upper C', 2),
	('Straight-Arm Pulldown', 'Upper C', 3),
	('Face Pull (Rope)', 'Upper C', 3),
	('Cable Biceps Curl', 'Upper C', 3),
	('Triceps Rope Pushdown', 'Upper C', 3),

	-- Lower Day (Lower A)
	('Machine Squat', 'Lower A', 3),
	('Leg Extension (Machine)', 'Lower A', 3),
	('Leg Curl (Machine)', 'Lower A', 3),
	('Hip Thrust (Machine)', 'Lower A', 3),
	('Abbs', 'Lower A', 3),

	-- Arm Day (Lower B)
	('Lateral Raises', 'Lower B', 3),
	('Machine Shoulder Press', 'Lower B', 3),
	('Face Pull (Rope)', 'Lower B', 3),
	('Triceps Rope Pushdown', 'Lower B', 3),
	('Machine Biceps Curl', 'Lower B', 3);`

	_, err = db.Exec(seedQuery)
	if err != nil {
		log.Println("Seeder error:", err)
	}

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://192.168.1.166:5000", "http://localhost:5000"},
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type"},
		AllowCredentials: true,
	}))

	r.GET("/exercises/:category", func(c *gin.Context) {
		category := c.Param("category")
		rows, err := db.Query("SELECT id, name, sets FROM exercises WHERE category = ?", category)
		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
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
		id := c.Param("id")
		set := c.Param("set")
		var reps int
		var weight float64
		err := db.QueryRow(`SELECT reps, weight FROM logs WHERE exercise_id = ? AND set_number = ? ORDER BY created_at DESC LIMIT 1`, id, set).Scan(&reps, &weight)
		if err != nil {
			c.JSON(200, gin.H{"reps": 0, "weight": 0})
			return
		}
		c.JSON(200, gin.H{"reps": reps, "weight": weight})
	})

	r.POST("/log", func(c *gin.Context) {
		var body struct {
			ExerciseID int     `json:"exercise_id"`
			SetNumber  int     `json:"set_number"`
			Reps       int     `json:"reps"`
			Weight     float64 `json:"weight"`
		}
		if err := c.BindJSON(&body); err != nil {
			c.JSON(400, gin.H{"error": "invalid json"})
			return
		}
		_, err := db.Exec(`INSERT INTO logs (exercise_id, set_number, reps, weight) VALUES (?, ?, ?, ?)`,
			body.ExerciseID, body.SetNumber, body.Reps, body.Weight)
		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		c.JSON(200, gin.H{"status": "ok"})
	})

	r.Run("0.0.0.0:4000")
}
