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
		dbPath = "/data/db.sqlite"
	}

	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	_, _ = db.Exec(`CREATE TABLE IF NOT EXISTS exercises (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, category TEXT NOT NULL, sets INTEGER NOT NULL);`)
	_, _ = db.Exec(`CREATE TABLE IF NOT EXISTS logs (id INTEGER PRIMARY KEY AUTOINCREMENT, exercise_id INTEGER NOT NULL, set_number INTEGER NOT NULL, reps INTEGER NOT NULL, weight REAL NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);`)

	// Smart Seeder
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
		var id int
		err := db.QueryRow("SELECT id FROM exercises WHERE name = ? AND category = ?", e.Name, e.Category).Scan(&id)
		if err == sql.ErrNoRows {
			db.Exec("INSERT INTO exercises (name, category, sets) VALUES (?, ?, ?)", e.Name, e.Category, e.Sets)
		} else {
			db.Exec("UPDATE exercises SET sets = ? WHERE id = ?", e.Sets, id)
		}
	}

	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowAllOrigins: true, // Bezpieczne wewnątrz Tailscale
		AllowMethods:    []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:    []string{"Origin", "Content-Type"},
	}))

	r.GET("/exercises/:category", func(c *gin.Context) {
		rows, _ := db.Query("SELECT id, name, sets FROM exercises WHERE category = ?", c.Param("category"))
		defer rows.Close()
		res := []gin.H{}
		for rows.Next() {
			var id, sets int
			var name string
			rows.Scan(&id, &name, &sets)
			res = append(res, gin.H{"id": id, "name": name, "sets": sets})
		}
		c.JSON(200, res)
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
		c.BindJSON(&b)
		db.Exec(`INSERT INTO logs (exercise_id, set_number, reps, weight) VALUES (?, ?, ?, ?)`, b.ExID, b.Set, b.Reps, b.W)
		c.JSON(200, gin.H{"status": "ok"})
	})

	r.Run("0.0.0.0:4000")
}
