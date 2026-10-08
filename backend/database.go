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

// initDB opens the PostgreSQL connection, waits for PostgreSQL to become ready,
// and applies the application schema/migrations.
func initDB() {
	dsn := os.Getenv("DB_DSN")
	if dsn == "" {
		log.Fatal("DB_DSN environment variable is required")
	}

	var err error
	db, err = sql.Open("pgx", dsn)
	if err != nil {
		log.Fatal("Failed to open database:", err)
	}

	connected := false
	for i := 0; i < 15; i++ {
		if err = db.Ping(); err == nil {
			connected = true
			fmt.Println("Database connection established")
			break
		}

		fmt.Printf(
			"Database connection attempt %d/15 failed, retrying in 2s...\n",
			i+1,
		)
		time.Sleep(2 * time.Second)
	}

	if !connected {
		db.Close()
		log.Fatal("Critical Error: Could not connect to database after 15 attempts")
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	applySchema()
	seedAdmin()
}

func applySchema() {
	statements := []struct {
		name string
		sql  string
	}{
		{
			"users table",
			`CREATE TABLE IF NOT EXISTS users (
				id SERIAL PRIMARY KEY,
				name VARCHAR(50) UNIQUE,
				pin VARCHAR(100),
				is_admin BOOLEAN DEFAULT FALSE,
				exp INT DEFAULT 0,
				level INT DEFAULT 1
			);`,
		},
		{
			"exercises table",
			`CREATE TABLE IF NOT EXISTS exercises (
				id SERIAL PRIMARY KEY,
				name VARCHAR(150) UNIQUE,
				category VARCHAR(50)
			);`,
		},
		{
			"workout_plans table",
			`CREATE TABLE IF NOT EXISTS workout_plans (
				id SERIAL PRIMARY KEY,
				user_id INT NOT NULL,
				name VARCHAR(50) NOT NULL,
				FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
			);`,
		},
		{
			"plan_exercises table",
			`CREATE TABLE IF NOT EXISTS plan_exercises (
				plan_id INT NOT NULL,
				exercise_id INT NOT NULL,
				target_sets INT DEFAULT 3,
				position INT DEFAULT 0,
				FOREIGN KEY(plan_id) REFERENCES workout_plans(id) ON DELETE CASCADE,
				FOREIGN KEY(exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
			);`,
		},
		{
			"logs table",
			`CREATE TABLE IF NOT EXISTS logs (
				id SERIAL PRIMARY KEY,
				user_id INT NOT NULL,
				exercise_id INT,
				set_number INT,
				reps INT,
				weight DOUBLE PRECISION,
				is_failure BOOLEAN DEFAULT FALSE,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
			);`,
		},
		{
			"logs lookup index",
			`CREATE INDEX IF NOT EXISTS idx_logs_lookup
			 ON logs (user_id, exercise_id, set_number, created_at DESC);`,
		},
		{
			"user_weights table",
			`CREATE TABLE IF NOT EXISTS user_weights (
				id SERIAL PRIMARY KEY,
				user_id INT NOT NULL,
				weight DOUBLE PRECISION,
				logged_at DATE,
				UNIQUE(user_id, logged_at),
				FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
			);`,
		},
		{
			"workout_sessions table",
			`CREATE TABLE IF NOT EXISTS workout_sessions (
				id SERIAL PRIMARY KEY,
				user_id INT NOT NULL,
				plan_id INT NULL,
				name VARCHAR(50) NOT NULL,
				status VARCHAR(20) NOT NULL DEFAULT 'active',
				started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
				completed_at TIMESTAMP NULL,
				FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
				FOREIGN KEY(plan_id) REFERENCES workout_plans(id) ON DELETE SET NULL
			);`,
		},
		{
			"workout_session_exercises table",
			`CREATE TABLE IF NOT EXISTS workout_session_exercises (
				id SERIAL PRIMARY KEY,
				session_id INT NOT NULL,
				exercise_id INT NOT NULL,
				target_sets INT NOT NULL DEFAULT 3,
				position INT NOT NULL DEFAULT 0,
				FOREIGN KEY(session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE,
				FOREIGN KEY(exercise_id) REFERENCES exercises(id) ON DELETE CASCADE,
				UNIQUE(session_id, exercise_id)
			);`,
		},
		{
			"workout_sets table",
			`CREATE TABLE IF NOT EXISTS workout_sets (
				id SERIAL PRIMARY KEY,
				session_exercise_id INT NOT NULL,
				log_id INT UNIQUE NULL,
				set_number INT NOT NULL,
				reps INT NOT NULL,
				weight DOUBLE PRECISION NOT NULL DEFAULT 0,
				is_failure BOOLEAN NOT NULL DEFAULT FALSE,
				next_target_reps INT NULL,
			next_target_weight DOUBLE PRECISION NULL,
				completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY(session_exercise_id) REFERENCES workout_session_exercises(id) ON DELETE CASCADE,
				FOREIGN KEY(log_id) REFERENCES logs(id) ON DELETE CASCADE,
				UNIQUE(session_exercise_id, set_number)
			);`,
		},
		{
			"user_exercise_targets table",
			`CREATE TABLE IF NOT EXISTS user_exercise_targets (
				user_id INT NOT NULL,
				exercise_id INT NOT NULL,
				set_number INT NOT NULL,
				target_reps INT NULL,
				target_weight DOUBLE PRECISION NULL,
				updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
				PRIMARY KEY(user_id, exercise_id, set_number),
				FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
				FOREIGN KEY(exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
			);`,
		},
	}

	for _, statement := range statements {
		if _, err := db.Exec(statement.sql); err != nil {
			log.Fatalf("Failed to apply %s: %v", statement.name, err)
		}
	}

	migrations := []struct {
		name string
		sql  string
	}{
		{"logs.is_failure", `ALTER TABLE logs ADD COLUMN IF NOT EXISTS is_failure BOOLEAN DEFAULT FALSE;`},
		{"users.exp", `ALTER TABLE users ADD COLUMN IF NOT EXISTS exp INT DEFAULT 0;`},
		{"users.level", `ALTER TABLE users ADD COLUMN IF NOT EXISTS level INT DEFAULT 1;`},
		{"plan_exercises.position", `ALTER TABLE plan_exercises ADD COLUMN IF NOT EXISTS position INT DEFAULT 0;`},
		{"workout_sets.log_id", `ALTER TABLE workout_sets ADD COLUMN IF NOT EXISTS log_id INT UNIQUE NULL;`},
		{"workout_sets.log_fk", `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workout_sets_log_id_fkey') THEN ALTER TABLE workout_sets ADD CONSTRAINT workout_sets_log_id_fkey FOREIGN KEY (log_id) REFERENCES logs(id) ON DELETE CASCADE; END IF; END $$;`},
	}

	for _, migration := range migrations {
		if _, err := db.Exec(migration.sql); err != nil {
			log.Fatalf("Failed to migrate %s: %v", migration.name, err)
		}
	}

	if _, err := db.Exec(`
		CREATE INDEX IF NOT EXISTS idx_workout_sessions_active
		ON workout_sessions (user_id, status, started_at DESC);
	`); err != nil {
		log.Fatal("Failed to create workout session index:", err)
	}

	if _, err := db.Exec(`
		CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_workout_per_user
		ON workout_sessions (user_id)
		WHERE status = 'active';
	`); err != nil {
		log.Fatal("Failed to create active workout uniqueness index:", err)
	}
}

// GetOrCreateExerciseDB returns an exercise ID, creating the record if needed.
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
	if err := db.QueryRow(
		"SELECT id FROM exercises WHERE name = $1",
		name,
	).Scan(&id); err != nil {
		return 0, err
	}

	return id, nil
}

func seedAdmin() {
	var count int
	if err := db.QueryRow(
		"SELECT COUNT(*) FROM users WHERE name = 'admin'",
	).Scan(&count); err != nil {
		log.Println("Error: Failed to check admin user:", err)
		return
	}

	if count > 0 {
		return
	}

	hashedPin, err := bcrypt.GenerateFromPassword([]byte("1234"), bcrypt.DefaultCost)
	if err != nil {
		log.Println("Error: Failed to hash seed admin PIN:", err)
		return
	}

	if _, err = db.Exec(`
		INSERT INTO users (name, pin, is_admin)
		VALUES ($1, $2, $3)
	`, "admin", string(hashedPin), true); err != nil {
		log.Println("Error: Failed to seed admin user:", err)
	}
}
