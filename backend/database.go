package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"golang.org/x/crypto/bcrypt"
)

var db *sql.DB

// initDB initializes the database connection and runs migrations
func initDB() {
	dsn := os.Getenv("DB_DSN")
	if dsn == "" {
		log.Fatal("DB_DSN environment variable is required")
	}

	var err error
	// DevOps Retry Pattern: Database might take time to start in Docker
	for i := 0; i < 15; i++ {
		db, err = sql.Open("mysql", dsn)
		if err == nil && db.Ping() == nil {
			fmt.Println("Database connection established")
			break
		}
		fmt.Printf("Database connection attempt %d/15 failed, retrying in 2s...\n", i+1)
		time.Sleep(2 * time.Second)
	}

	if err != nil || db.Ping() != nil {
		log.Fatal("Critical Error: Could not connect to database after 15 attempts")
	}

	// Performance Tuning: Connection Pool Management
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	// Schema Bootstrap (Self-migrating logic)
	db.Exec(`CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(50) UNIQUE, pin VARCHAR(100), is_admin BOOLEAN DEFAULT FALSE);`)
	db.Exec(`CREATE TABLE IF NOT EXISTS exercises (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(150) UNIQUE, category VARCHAR(50));`)
	db.Exec(`CREATE TABLE IF NOT EXISTS workout_plans (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, name VARCHAR(50), FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);`)
	db.Exec(`CREATE TABLE IF NOT EXISTS plan_exercises (plan_id INT, exercise_id INT, target_sets INT DEFAULT 3, FOREIGN KEY(plan_id) REFERENCES workout_plans(id) ON DELETE CASCADE, FOREIGN KEY(exercise_id) REFERENCES exercises(id) ON DELETE CASCADE);`)
	db.Exec(`CREATE TABLE IF NOT EXISTS logs (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, exercise_id INT, set_number INT, reps INT, weight FLOAT, is_failure BOOLEAN DEFAULT FALSE, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);`)
	db.Exec(`CREATE INDEX IF NOT EXISTS idx_logs_lookup ON logs (user_id, exercise_id, set_number, created_at DESC);`)
	db.Exec(`CREATE TABLE IF NOT EXISTS user_weights (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, weight FLOAT, logged_at DATE, UNIQUE(user_id, logged_at), FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);`)

	// Progressive Schema Updates
	db.Exec(`ALTER TABLE logs ADD COLUMN IF NOT EXISTS is_failure BOOLEAN DEFAULT FALSE;`)
	db.Exec(`ALTER TABLE users ADD COLUMN IF NOT EXISTS exp INT DEFAULT 0;`)
	db.Exec(`ALTER TABLE users ADD COLUMN IF NOT EXISTS level INT DEFAULT 1;`)

	seedExercises()
	seedAdmin()
}

// GetOrCreateExerciseDB returns an exercise ID, creating the record if it doesn't exist
func GetOrCreateExerciseDB(name, category string) (int, error) {
	// INSERT IGNORE avoids unique constraint violations on concurrent requests
	db.Exec("INSERT IGNORE INTO exercises (name, category) VALUES (?, ?)", name, category)
	var id int
	err := db.QueryRow("SELECT id FROM exercises WHERE name = ?", name).Scan(&id)
	if err != nil {
		return 0, err
	}
	return id, nil
}

// seedExercises populates the database from exercises.json with various permutations
func seedExercises() {
	var count int
	db.QueryRow("SELECT COUNT(*) FROM exercises").Scan(&count)
	if count > 0 {
		return // Data already seeded
	}

	file, err := os.ReadFile("exercises.json")
	if err != nil {
		fmt.Println("Warning: exercises.json not found, skipping seed:", err)
		return
	}

	var exercises []struct {
		Name      string   `json:"name"`
		Category  string   `json:"category"`
		Equipment []string `json:"equipment"`
		Angles    []string `json:"angles"`
		Variants  []string `json:"variants"`
	}

	if err := json.Unmarshal(file, &exercises); err != nil {
		fmt.Println("Error: Failed to parse exercises.json:", err)
		return
	}

	// Generate permutations (Equipment + Angle + Name + Variant)
	for _, ex := range exercises {
		eqs := ex.Equipment
		if len(eqs) == 0 {
			eqs = []string{""}
		}
		angs := ex.Angles
		if len(angs) == 0 {
			angs = []string{""}
		}
		vars := ex.Variants
		if len(vars) == 0 {
			vars = []string{""}
		}

		for _, eq := range eqs {
			for _, ang := range angs {
				for _, v := range vars {
					var parts []string
					if ang != "" && ang != "Flat" {
						parts = append(parts, ang)
					}
					if eq != "" && eq != "Bodyweight" {
						parts = append(parts, eq)
					}
					parts = append(parts, ex.Name)
					if v != "" && v != "Standard" {
						parts = append(parts, "- "+v)
					}

					fullName := strings.Join(parts, " ")
					fullName = strings.Join(strings.Fields(fullName), " ") // Clean extra spaces

					db.Exec("INSERT IGNORE INTO exercises (name, category) VALUES (?, ?)", fullName, ex.Category)
				}
			}
		}
	}
	fmt.Println("Infrastructure: Exercise database successfully seeded with permutations")
}

// seedAdmin creates the initial admin user if the user table is empty
func seedAdmin() {
	var count int
	db.QueryRow("SELECT COUNT(*) FROM users WHERE name = 'admin'").Scan(&count)
	if count > 0 {
		return
	}

	// Default PIN: 1234 (Should be changed via UI after first login)
	hashedPin, err := bcrypt.GenerateFromPassword([]byte("1234"), bcrypt.DefaultCost)
	if err != nil {
		log.Println("Error: Failed to hash seed admin PIN:", err)
		return
	}
	if _, err = db.Exec("INSERT INTO users (name, pin, is_admin) VALUES (?, ?, ?)", "admin", string(hashedPin), true); err != nil {
		log.Println("Error: Failed to seed admin user:", err)
	}
}
