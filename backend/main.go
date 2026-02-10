package main

import (
	"database/sql"
	"log"
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "modernc.org/sqlite"
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
	r := gin.Default()
	r.Use(cors.Default())

	// otwarcie bazy
	db, err := sql.Open("sqlite", "./db.sqlite")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// inicjalizacja tabel i danych
	initDB(db)

	// testowy endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// pobranie ćwiczeń wg zakładki
	r.GET("/exercises/:category", func(c *gin.Context) {
		category := c.Param("category")
		rows, err := db.Query("SELECT id, name, category, sets FROM exercises WHERE category = ?", category)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		var exercises []Exercise
		for rows.Next() {
			var e Exercise
			rows.Scan(&e.ID, &e.Name, &e.Category, &e.Sets)
			exercises = append(exercises, e)
		}
		c.JSON(http.StatusOK, exercises)
	})

	// pobranie ostatniego wyniku ćwiczenia
	r.GET("/last/:exercise_id", func(c *gin.Context) {
		exID := c.Param("exercise_id")
		row := db.QueryRow("SELECT set_number, reps, weight, date FROM workout_log WHERE exercise_id = ? ORDER BY date DESC, set_number DESC LIMIT 1", exID)

		var setNumber, reps int
		var weight float64
		var date string
		err := row.Scan(&setNumber, &reps, &weight, &date)
		if err != nil {
			if err == sql.ErrNoRows {
				c.JSON(http.StatusOK, gin.H{"message": "No previous data"})
				return
			}
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

	// zapis logu ćwiczenia
	r.POST("/log", func(c *gin.Context) {
		var logEntry LogEntry
		if err := c.ShouldBindJSON(&logEntry); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		logEntry.Date = time.Now().Format("2006-01-02 15:04:05")
		_, err := db.Exec("INSERT INTO workout_log (exercise_id, date, set_number, reps, weight) VALUES (?, ?, ?, ?, ?)",
			logEntry.ExerciseID, logEntry.Date, logEntry.SetNumber, logEntry.Reps, logEntry.Weight)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// uruchomienie serwera
	r.Run(":3000")
}

// initDB tworzy tabele i dodaje hardcodowane ćwiczenia
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

	// dodanie przykładowych ćwiczeń
	db.Exec(`INSERT OR IGNORE INTO exercises (id, name, category, sets) VALUES (1,'Bench Press','Upper A',3)`)
	db.Exec(`INSERT OR IGNORE INTO exercises (id, name, category, sets) VALUES (2,'Pull-ups','Upper B',3)`)
	db.Exec(`INSERT OR IGNORE INTO exercises (id, name, category, sets) VALUES (3,'Squat','Lower A',3)`)
	db.Exec(`INSERT OR IGNORE INTO exercises (id, name, category, sets) VALUES (4,'Deadlift','Lower B',3)`)
	db.Exec(`INSERT OR IGNORE INTO exercises (id, name, category, sets) VALUES (5,'Overhead Press','Upper C',3)`)
}
