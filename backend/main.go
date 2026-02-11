package main

import (
	"database/sql"
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/mattn/go-sqlite3"
)

func main() {
	// --------------------
	// DATABASE
	// --------------------
	db, err := sql.Open("sqlite3", "./db.sqlite")
	if err != nil {
		panic(err)
	}
	defer db.Close()

	// --------------------
	// TABLES
	// --------------------
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
		weight INTEGER NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	`)
	if err != nil {
		panic(err)
	}

	// --------------------
	// GIN
	// --------------------
	r := gin.Default()

	// --------------------
	// CORS (FRONTEND :5000)
	// --------------------
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://192.168.1.166:5000", "http://localhost:5000"},
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type"},
		AllowCredentials: true,
	}))

	// --------------------
	// HEALTH
	// --------------------
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// --------------------
	// GET EXERCISES BY CATEGORY
	// --------------------
	r.GET("/exercises/:category", func(c *gin.Context) {
		category := c.Param("category")

		rows, err := db.Query(`
			SELECT id, name, sets
			FROM exercises
			WHERE category = ?
		`, category)
		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		var result []gin.H
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

		c.JSON(200, result)
	})

	// --------------------
	// GET LAST SET
	// --------------------
	r.GET("/last/:id", func(c *gin.Context) {
		id := c.Param("id")

		row := db.QueryRow(`
			SELECT set_number, weight
			FROM logs
			WHERE exercise_id = ?
			ORDER BY created_at DESC
			LIMIT 1
		`, id)

		var set, weight int
		err := row.Scan(&set, &weight)
		if err != nil {
			c.JSON(200, gin.H{})
			return
		}

		c.JSON(200, gin.H{
			"set_number": set,
			"weight":     weight,
		})
	})

	// --------------------
	// LOG SET
	// --------------------
	r.POST("/log", func(c *gin.Context) {
		var body struct {
			ExerciseID int `json:"exercise_id"`
			SetNumber  int `json:"set_number"`
			Reps       int `json:"reps"`
			Weight     int `json:"weight"`
		}

		if err := c.BindJSON(&body); err != nil {
			c.JSON(400, gin.H{"error": "invalid json"})
			return
		}

		_, err := db.Exec(`
			INSERT INTO logs (exercise_id, set_number, reps, weight)
			VALUES (?, ?, ?, ?)
		`, body.ExerciseID, body.SetNumber, body.Reps, body.Weight)

		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}

		c.JSON(200, gin.H{"status": "ok"})
	})

	// --------------------
	// START
	// --------------------
	r.Run(":4000")
}
