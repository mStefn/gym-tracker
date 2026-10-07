package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
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

	// DevOps Retry Pattern:
	// PostgreSQL might take some time to start in Docker.
	for i := 0; i < 15; i++ {
		db, err = sql.Open("pgx", dsn)

		if err == nil && db.Ping() == nil {
			fmt.Println("Database connection established")
			break
		}

		fmt.Printf(
			"Database connection attempt %d/15 failed, retrying in 2s...\n",
			i+1,
		)

		time.Sleep(2 * time.Second)
	}

	if err != nil || db.Ping() != nil {
		log.Fatal("Critical Error: Could not connect to database after 15 attempts")
	}

	// Performance Tuning: Connection Pool Management
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	// Schema Bootstrap
	//
	// PostgreSQL equivalents:
	// AUTO_INCREMENT -> SERIAL
	// DATETIME       -> TIMESTAMP
	// FLOAT          -> DOUBLE PRECISION
	// BOOLEAN        -> BOOLEAN

	if _, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id SERIAL PRIMARY KEY,
			name VARCHAR(50) UNIQUE,
			pin VARCHAR(100),
			is_admin BOOLEAN DEFAULT FALSE,
			exp INT DEFAULT 0,
			level INT DEFAULT 1
		);
	`); err != nil {
		log.Fatal("Failed to create users table:", err)
	}

	if _, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS exercises (
			id SERIAL PRIMARY KEY,
			name VARCHAR(150) UNIQUE,
			category VARCHAR(50)
		);
	`); err != nil {
		log.Fatal("Failed to create exercises table:", err)
	}

	if _, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS workout_plans (
			id SERIAL PRIMARY KEY,
			user_id INT,
			name VARCHAR(50),
			FOREIGN KEY(user_id)
				REFERENCES users(id)
				ON DELETE CASCADE
		);
	`); err != nil {
		log.Fatal("Failed to create workout_plans table:", err)
	}

	if _, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS plan_exercises (
			plan_id INT,
			exercise_id INT,
			target_sets INT DEFAULT 3,
			FOREIGN KEY(plan_id)
				REFERENCES workout_plans(id)
				ON DELETE CASCADE,
			FOREIGN KEY(exercise_id)
				REFERENCES exercises(id)
				ON DELETE CASCADE
		);
	`); err != nil {
		log.Fatal("Failed to create plan_exercises table:", err)
	}

	if _, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS logs (
			id SERIAL PRIMARY KEY,
			user_id INT,
			exercise_id INT,
			set_number INT,
			reps INT,
			weight DOUBLE PRECISION,
			is_failure BOOLEAN DEFAULT FALSE,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY(user_id)
				REFERENCES users(id)
				ON DELETE CASCADE
		);
	`); err != nil {
		log.Fatal("Failed to create logs table:", err)
	}

	if _, err := db.Exec(`
		CREATE INDEX IF NOT EXISTS idx_logs_lookup
		ON logs (user_id, exercise_id, set_number, created_at DESC);
	`); err != nil {
		log.Fatal("Failed to create logs index:", err)
	}

	if _, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS user_weights (
			id SERIAL PRIMARY KEY,
			user_id INT,
			weight DOUBLE PRECISION,
			logged_at DATE,
			UNIQUE(user_id, logged_at),
			FOREIGN KEY(user_id)
				REFERENCES users(id)
				ON DELETE CASCADE
		);
	`); err != nil {
		log.Fatal("Failed to create user_weights table:", err)
	}

	// Progressive Schema Updates

	if _, err := db.Exec(`
		ALTER TABLE logs
		ADD COLUMN IF NOT EXISTS is_failure BOOLEAN DEFAULT FALSE;
	`); err != nil {
		log.Fatal("Failed to migrate logs.is_failure:", err)
	}

	if _, err := db.Exec(`
		ALTER TABLE users
		ADD COLUMN IF NOT EXISTS exp INT DEFAULT 0;
	`); err != nil {
		log.Fatal("Failed to migrate users.exp:", err)
	}

	if _, err := db.Exec(`
		ALTER TABLE users
		ADD COLUMN IF NOT EXISTS level INT DEFAULT 1;
	`); err != nil {
		log.Fatal("Failed to migrate users.level:", err)
	}

	seedAdmin()
}

// GetOrCreateExerciseDB returns an exercise ID,
// creating the record if it doesn't exist.
func GetOrCreateExerciseDB(name, category string) (int, error) {
	_, err := db.Exec(`
		INSERT INTO exercises (name, category)
		VALUES ($1, $2)
		ON CONFLICT (name) DO NOTHING
	`, name, category)

	if err != nil {
		return 0, err
	}

	var id int

	err = db.QueryRow(
		"SELECT id FROM exercises WHERE name = $1",
		name,
	).Scan(&id)

	if err != nil {
		return 0, err
	}

	return id, nil
}

// seedAdmin creates the initial admin user if
// the admin user does not already exist.
func seedAdmin() {
	var count int

	if err := db.QueryRow(
		"SELECT COUNT(*) FROM users WHERE name = 'admin'",
	).Scan(&count); err != nil {
		log.Println(
			"Error: Failed to check admin user:",
			err,
		)
		return
	}

	if count > 0 {
		return
	}

	// Default PIN: 1234
	// Should be changed via UI after first login.
	hashedPin, err := bcrypt.GenerateFromPassword(
		[]byte("1234"),
		bcrypt.DefaultCost,
	)

	if err != nil {
		log.Println(
			"Error: Failed to hash seed admin PIN:",
			err,
		)
		return
	}

	if _, err = db.Exec(`
		INSERT INTO users (name, pin, is_admin)
		VALUES ($1, $2, $3)
	`, "admin", string(hashedPin), true); err != nil {
		log.Println(
			"Error: Failed to seed admin user:",
			err,
		)
	}
}
