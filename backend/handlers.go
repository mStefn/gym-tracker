package main

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
)

// GetUsers returns all available profiles
func GetUsers(c *gin.Context) {
	rows, _ := db.Query("SELECT id, name, (pin IS NOT NULL AND pin != '') as has_pin FROM users")
	defer rows.Close()
	var users []User
	for rows.Next() {
		var u User
		rows.Scan(&u.ID, &u.Name, &u.HasPin)
		users = append(users, u)
	}
	c.JSON(http.StatusOK, users)
}

// AuthUser handles PIN verification or creation
func AuthUser(c *gin.Context) {
	var b struct {
		UserID int    `json:"user_id"`
		Pin    string `json:"pin"`
	}
	c.BindJSON(&b)

	var dbPin sql.NullString
	err := db.QueryRow("SELECT pin FROM users WHERE id = ?", b.UserID).Scan(&dbPin)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// First login - set pin
	if !dbPin.Valid || dbPin.String == "" {
		db.Exec("UPDATE users SET pin = ? WHERE id = ?", b.Pin, b.UserID)
		c.JSON(http.StatusOK, gin.H{"status": "pin_established"})
		return
	}

	// Regular login - verify pin
	if dbPin.String == b.Pin {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	} else {
		c.JSON(http.StatusUnauthorized, gin.H{"status": "unauthorized"})
	}
}

// GetUserPlans returns plans for a specific user
func GetUserPlans(c *gin.Context) {
	rows, _ := db.Query("SELECT id, name FROM workout_plans WHERE user_id = ?", c.Param("user_id"))
	defer rows.Close()
	var plans []WorkoutPlan
	for rows.Next() {
		var p WorkoutPlan
		rows.Scan(&p.ID, &p.Name)
		plans = append(plans, p)
	}
	c.JSON(http.StatusOK, plans)
}

// (Other handlers for LastResult, LogSet, etc... would go here)
