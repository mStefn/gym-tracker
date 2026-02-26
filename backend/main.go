package main

import (
	"database/sql"
	"fmt"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/go-sql-driver/mysql"
)

var db *sql.DB

func main() {
	// Get Database DSN from environment or use default for local dev
	dsn := os.Getenv("DB_DSN")
	if dsn == "" {
		dsn = "gym_user:gym_password_stefan@tcp(db:3306)/gym_tracker?parseTime=true"
	}

	// Retry connection to MariaDB (wait for container to be ready)
	var err error
	for i := 0; i < 15; i++ {
		db, err = sql.Open("mysql", dsn)
		if err == nil && db.Ping() == nil {
			fmt.Println("Successfully connected to MariaDB")
			break
		}
		fmt.Printf("Connection attempt %d failed, retrying...\n", i+1)
		time.Sleep(3 * time.Second)
	}

	initDB()

	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowAllOrigins: true,
		AllowMethods:    []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:    []string{"Origin", "Content-Type"},
	}))

	// Get all users for profile selection
	r.GET("/users", func(c *gin.Context) {
		rows, err := db.Query("SELECT id, name FROM users")
		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()
		var users []gin.H
		for rows.Next() {
			var id int
			var name string
			rows.Scan(&id, &name)
			users = append(users, gin.H{"id": id, "name": name})
		}
		c.JSON(200, users)
	})

	// Verify User PIN
	r.POST("/verify-pin", func(c *gin.Context) {
		var b struct {
			UserID int    `json:"user_id"`
			Pin    string `json:"pin"`
		}
		if err := c.BindJSON(&b); err != nil {
			c.JSON(400, gin.H{"error": "Invalid request"})
			return
		}

		var dbPin string
		err := db.QueryRow("SELECT pin FROM users WHERE id = ?", b.UserID).Scan(&dbPin)
		if err == nil && dbPin == b.Pin {
			c.JSON(200, gin.H{"status": "ok"})
		} else {
			c.JSON(401, gin.H{"status": "unauthorized"})
		}
	})

	// Get workout plans for a specific user
	r.GET("/plans/:user_id", func(c *gin.Context) {
		rows, _ := db.Query("SELECT id, name FROM workout_plans WHERE user_id = ?", c.Param("user_id"))
		defer rows.Close()
		var plans []gin.H
		for rows.Next() {
			var id int
			var name string
			rows.Scan(&id, &name)
			plans = append(plans, gin.H{"id": id, "name": name})
		}
		c.JSON(200, plans)
	})

	// Fetch exercises within a specific plan
	r.GET("/plan-exercises/:plan_id", func(c *gin.Context) {
		query := `SELECT e.id, e.name, pe.target_sets FROM exercises e 
                  JOIN plan_exercises pe ON e.id = pe.exercise_id WHERE pe.plan_id = ?`
		rows, _ := db.Query(query, c.Param("plan_id"))
		defer rows.Close()
		var exercises []gin.H
		for rows.Next() {
			var id, sets int
			var name string
			rows.Scan(&id, &name, &sets)
			exercises = append(exercises, gin.H{"id": id, "name": name, "sets": sets})
		}
		c.JSON(200, exercises)
	})

	// Save a workout set log
	r.POST("/log", func(c *gin.Context) {
		var b struct {
			UserID int     `json:"user_id"`
			ExID   int     `json:"exercise_id"`
			Set    int     `json:"set_number"`
			Reps   int     `json:"reps"`
			W      float64 `json:"weight"`
		}
		if err := c.BindJSON(&b); err != nil {
			c.JSON(400, gin.H{"error": "Invalid data"})
			return
		}
		db.Exec(`INSERT INTO logs (user_id, exercise_id, set_number, reps, weight) VALUES (?, ?, ?, ?, ?)`,
			b.UserID, b.ExID, b.Set, b.Reps, b.W)
		c.JSON(200, gin.H{"status": "success"})
	})

	r.Run("0.0.0.0:4000")
}

func initDB() {
	// Create tables with relationships
	db.Exec(`CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(50), pin VARCHAR(5));`)
	db.Exec(`CREATE TABLE IF NOT EXISTS exercises (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100));`)
	db.Exec(`CREATE TABLE IF NOT EXISTS workout_plans (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, name VARCHAR(50), FOREIGN KEY(user_id) REFERENCES users(id));`)
	db.Exec(`CREATE TABLE IF NOT EXISTS plan_exercises (plan_id INT, exercise_id INT, target_sets INT DEFAULT 3, FOREIGN KEY(plan_id) REFERENCES workout_plans(id), FOREIGN KEY(exercise_id) REFERENCES exercises(id));`)
	db.Exec(`CREATE TABLE IF NOT EXISTS logs (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, exercise_id INT, set_number INT, reps INT, weight FLOAT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);`)

	// Seed initial data if table is empty
	var count int
	db.QueryRow("SELECT COUNT(*) FROM users").Scan(&count)
	if count == 0 {
		fmt.Println("Seeding database with initial users and plans...")
		db.Exec("INSERT INTO users (name, pin) VALUES ('Stefan', '12345'), ('Maja', '54321')")
		db.Exec("INSERT INTO exercises (name) VALUES ('Pull-ups'), ('Bench Press'), ('Squat'), ('Hip Thrust')")
		db.Exec("INSERT INTO workout_plans (user_id, name) VALUES (1, 'Stefan - Upper A'), (2, 'Maja - Full Body')")
		db.Exec("INSERT INTO plan_exercises (plan_id, exercise_id, target_sets) VALUES (1, 1, 3), (1, 2, 3), (2, 4, 3)")
	}
}
