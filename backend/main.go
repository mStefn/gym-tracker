package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/mattn/go-sqlite3"
)

// Exercise struktura ćwiczenia
type Exercise struct {
	ID       int    `json:"id"`
	Name     string `json:"name"`
	Category string `json:"category"`
	Sets     int    `json:"sets"`
}

// LogEntry struktura logu treningowego
type LogEntry struct {
	ID         int     `json:"id"`
	ExerciseID int     `json:"exercise_id"`
	Date       string  `json:"date"`
	SetNumber  int     `json:"set_number"`
	Reps       int     `json:"reps"`
	Weight     float64 `json:"weight"`
}

func main() {
	// ---------- DB PATH ----------
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "./db.sqlite"
	}

	// ---------- DB ----------
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	initDB(db)

	// ---------- GIN ----------
	r := gin.Default()
	r.Use(cors.Default())

	// ---------- ROUTES ----------

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	r.GET("/exercises/:category", func(c *gin.Context) {
		category := c.Param("category")

		rows, err := db.Query(
			"SELECT id, name, category, sets FROM exercises WHERE category = ?",
			category,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		var exercises []Exercise
		for rows.Next() {
			var e Exercise
			if err := rows.Scan(&e.ID, &e.Name, &e.Category, &e.Sets); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			exercises = append(exercises, e)
		}

		c.JSON(http.StatusOK, exercises)
	})

	r.GET("/last/:exercise_id", func(c *gin.Context) {
		exID := c.Param("exercise_id")

		row := db.QueryRow(`
			SELECT set_number, reps, weight, date
			FROM workout_log
			WHERE exercise_id = ?
			ORDER BY date DESC, set_number DESC
			LIMIT 1
		`, exID)

		var setNumber, reps int
		var weight float64
		var date string

		err := row.Scan(&setNumber, &reps, &weight, &date)
		if err == sql.ErrNoRows {
			c.JSON(http.StatusOK, gin.H{"message": "No previous data"})
			return
		}
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"set_number": setNumber,
			"reps":       reps,
			"weight":     weight,
			"date":       date,
		})
	})

	r.POST("/log", func(c *gin.Context) {
		var entry LogEntry
		if err := c.ShouldBindJSON(&entry); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		entry.Date = time.Now().Format("2006-01-02 15:04:05")

		_, err := db.Exec(`
			INSERT INTO workout_log (exercise_id, date, set_number, reps, weight)
			VALUES (?, ?, ?, ?, ?)
		`,
			entry.ExerciseID,
			entry.Date,
			entry.SetNumber,
			entry.Reps,
			entry.Weight,
		)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// ---------- START ----------
	log.Println("Backend running on :4000")
	r.Run("0.0.0.0:4000")
}

// ---------- DB INIT ----------
func initDB(db *sql.DB) {
	_, err := db.Exec(`
	CREATE TABLE IF NOT EXISTS exercises (
		id INTEGER PRIMARY KEY,
		name TEXT,
		category TEXT,
		sets INTEGER
	);

	CREATE TABLE IF NOT EXISTS workout_log (
		id INTEGER PRIMARY KEY,
		exercise_id INTEGER,
		date TEXT,
		set_number INTEGER,
		reps INTEGER,
		weight REAL
	);
	`)
	if err != nil {
		log.Fatal(err)
	}

	// przykładowe dane
	db.Exec(`INSERT OR IGNORE INTO exercises VALUES (1,'Bench Press','Upper A',3)`)
	db.Exec(`INSERT OR IGNORE INTO exercises VALUES (2,'Pull-ups','Upper B',3)`)
	db.Exec(`INSERT OR IGNORE INTO exercises VALUES (3,'Squat','Lower A',3)`)
	db.Exec(`INSERT OR IGNORE INTO exercises VALUES (4,'Deadlift','Lower B',3)`)
	db.Exec(`INSERT OR IGNORE INTO exercises VALUES (5,'Overhead Press','Upper C',3)`)
}
