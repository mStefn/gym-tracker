package main

import (
	"database/sql"
	"fmt"
	"os"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

var db *sql.DB

func initDB() {
	dsn := os.Getenv("DB_DSN")
	if dsn == "" {
		dsn = "gym_user:gym_password_stefan@tcp(db:3306)/gym_tracker?parseTime=true"
	}

	var err error
	for i := 0; i < 15; i++ {
		db, err = sql.Open("mysql", dsn)
		if err == nil && db.Ping() == nil {
			fmt.Println("Database connection established")
			break
		}
		fmt.Printf("Database connection attempt %d failed, waiting...\n", i+1)
		time.Sleep(3 * time.Second)
	}

	// Create tables
	db.Exec(`CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(50), pin VARCHAR(4) DEFAULT NULL);`)
	db.Exec(`CREATE TABLE IF NOT EXISTS exercises (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100));`)
	db.Exec(`CREATE TABLE IF NOT EXISTS workout_plans (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, name VARCHAR(50), FOREIGN KEY(user_id) REFERENCES users(id));`)
	db.Exec(`CREATE TABLE IF NOT EXISTS plan_exercises (plan_id INT, exercise_id INT, target_sets INT DEFAULT 3, FOREIGN KEY(plan_id) REFERENCES workout_plans(id), FOREIGN KEY(exercise_id) REFERENCES exercises(id));`)
	db.Exec(`CREATE TABLE IF NOT EXISTS logs (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, exercise_id INT, set_number INT, reps INT, weight FLOAT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);`)

	seedData()
}

func seedData() {
	var count int
	db.QueryRow("SELECT COUNT(*) FROM users").Scan(&count)
	if count == 0 {
		fmt.Println("Seeding initial data...")
		db.Exec("INSERT INTO users (name) VALUES ('Stefan'), ('Maja')")
		db.Exec("INSERT INTO exercises (name) VALUES ('Pull-ups'), ('Bench Press'), ('Squat')")
		db.Exec("INSERT INTO workout_plans (user_id, name) VALUES (1, 'Stefan - Upper A'), (2, 'Maja - Full Body')")
		db.Exec("INSERT INTO plan_exercises (plan_id, exercise_id, target_sets) VALUES (1, 1, 3), (2, 3, 3)")
	}
}
