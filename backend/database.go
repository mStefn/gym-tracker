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

	db.Exec(`CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(50) UNIQUE, pin VARCHAR(4));`)
	db.Exec(`CREATE TABLE IF NOT EXISTS exercises (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100));`)
	db.Exec(`CREATE TABLE IF NOT EXISTS workout_plans (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, name VARCHAR(50), FOREIGN KEY(user_id) REFERENCES users(id));`)
	db.Exec(`CREATE TABLE IF NOT EXISTS plan_exercises (plan_id INT, exercise_id INT, target_sets INT DEFAULT 3, FOREIGN KEY(plan_id) REFERENCES workout_plans(id), FOREIGN KEY(exercise_id) REFERENCES exercises(id));`)
	db.Exec(`CREATE TABLE IF NOT EXISTS logs (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, exercise_id INT, set_number INT, reps INT, weight FLOAT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);`)
}
