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
	db.Exec(`CREATE TABLE IF NOT EXISTS logs (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, exercise_id INT, set_number INT, reps INT, weight FLOAT, is_failure BOOLEAN DEFAULT FALSE, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);`)
	db.Exec(`CREATE INDEX IF NOT EXISTS idx_logs_lookup ON logs (user_id, exercise_id, set_number, created_at DESC);`)

	// NOWA TABELA: Śledzenie wagi ciała
	db.Exec(`CREATE TABLE IF NOT EXISTS user_weights (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, weight FLOAT, logged_at DATE, UNIQUE(user_id, logged_at), FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);`)

	db.Exec(`ALTER TABLE logs ADD COLUMN is_failure BOOLEAN DEFAULT FALSE;`)

	seedExercises()
	seedAdmin()
}

func GetOrCreateExerciseDB(name, category string) (int, error) {
	var id int
	err := db.QueryRow("SELECT id FROM exercises WHERE name = ?", name).Scan(&id)

	if err == sql.ErrNoRows {
		res, err := db.Exec("INSERT INTO exercises (name, category) VALUES (?, ?)", name, category)
		if err != nil {
			return 0, err
		}
		newId, err := res.LastInsertId()
		return int(newId), nil
	} else if err != nil {
		return 0, err
	}

	return id, nil
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
			Name      string   `json:"name"`
			Category  string   `json:"category"`
			Equipment []string `json:"equipment"`
			Angles    []string `json:"angles"`
			Variants  []string `json:"variants"`
		}

		if err := json.Unmarshal(file, &exercises); err != nil {
			fmt.Println("Error parsing exercises.json:", err)
			return
		}

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
						parts := []string{}
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
						fullName = strings.Join(strings.Fields(fullName), " ")

						db.Exec("INSERT IGNORE INTO exercises (name, category) VALUES (?, ?)", fullName, ex.Category)
					}
				}
			}
		}
		fmt.Println("✅ Exercises seeded with dynamic permutations")
	}
}

func seedAdmin() {
	var count int
	db.QueryRow("SELECT COUNT(*) FROM users WHERE name = 'admin'").Scan(&count)
	if count == 0 {
		hashedPin, _ := bcrypt.GenerateFromPassword([]byte("1234"), bcrypt.DefaultCost)
		db.Exec("INSERT INTO users (name, pin, is_admin) VALUES (?, ?, ?)", "admin", string(hashedPin), true)
	}
}
