package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

var db *sql.DB

func initDB() {
	dsn := os.Getenv("DB_DSN")
	if dsn == "" {
		log.Fatal("DB_DSN environment variable is required")
	}

	var err error
	for i := 0; i < 15; i++ {
		db, err = sql.Open("mysql", dsn)
		if err == nil && db.Ping() == nil {
			fmt.Println("Database connection established")
			break
		}
		fmt.Printf("Database connection attempt %d/15 failed, retrying...\n", i+1)
		time.Sleep(2 * time.Second)
	}
	if err != nil || db.Ping() != nil {
		log.Fatal("Failed to connect to database after 15 attempts")
	}

db.Exec(`CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(50) UNIQUE, pin VARCHAR(100), is_admin BOOLEAN DEFAULT FALSE);`)
	db.Exec(`CREATE TABLE IF NOT EXISTS exercises (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(150) UNIQUE, category VARCHAR(50));`)
	db.Exec(`CREATE TABLE IF NOT EXISTS workout_plans (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, name VARCHAR(50), FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);`)
	db.Exec(`CREATE TABLE IF NOT EXISTS plan_exercises (plan_id INT, exercise_id INT, target_sets INT DEFAULT 3, FOREIGN KEY(plan_id) REFERENCES workout_plans(id) ON DELETE CASCADE, FOREIGN KEY(exercise_id) REFERENCES exercises(id) ON DELETE CASCADE);`)
	db.Exec(`CREATE TABLE IF NOT EXISTS logs (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, exercise_id INT, set_number INT, reps INT, weight FLOAT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);`)
	db.Exec(`CREATE INDEX IF NOT EXISTS idx_logs_lookup ON logs (user_id, exercise_id, set_number, created_at DESC);`)

	seedExercises()
}

func seedExercises() {
	var count int
	db.QueryRow("SELECT COUNT(*) FROM exercises").Scan(&count)
	if count == 0 {
		file, err := os.ReadFile("exercises.json")
		if err != nil {
			fmt.Println("Error reading exercises.json:", err)
			return
		}
		var exercises []struct {
			Name     string `json:"name"`
			Category string `json:"category"`
		}
		if err := json.Unmarshal(file, &exercises); err != nil {
			fmt.Println("Error parsing exercises.json:", err)
			return
		}
		for _, ex := range exercises {
			db.Exec("INSERT IGNORE INTO exercises (name, category) VALUES (?, ?)", ex.Name, ex.Category)
		}
		fmt.Println("✅ Exercises seeded from JSON")
	}
}
