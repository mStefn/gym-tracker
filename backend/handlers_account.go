package main

import (
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

func AdminListUsers(c *gin.Context) {
	rows, err := db.Query("SELECT id, name, is_admin FROM users ORDER BY id ASC")
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to fetch users"})
		return
	}
	defer rows.Close()

	list := make([]gin.H, 0)
	for rows.Next() {
		var id int
		var name string
		var isAdmin bool
		if rows.Scan(&id, &name, &isAdmin) == nil {
			list = append(list, gin.H{"id": id, "name": name, "is_admin": isAdmin})
		}
	}

	c.JSON(200, list)
}

func AdminResetPin(c *gin.Context) {
	var input struct {
		UserID int    `json:"user_id"`
		NewPin string `json:"new_pin"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": "Invalid input"})
		return
	}

	newHashed, err := bcrypt.GenerateFromPassword([]byte(input.NewPin), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(500, gin.H{"error": "Server error"})
		return
	}

	result, err := db.Exec("UPDATE users SET pin = $1 WHERE id = $2", string(newHashed), input.UserID)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to reset PIN"})
		return
	}
	if affected, _ := result.RowsAffected(); affected == 0 {
		c.JSON(404, gin.H{"error": "User not found"})
		return
	}

	c.JSON(200, gin.H{"status": "ok"})
}

func DeleteAccount(c *gin.Context) {
	id := c.Param("id")
	result, err := db.Exec("DELETE FROM users WHERE id = $1", id)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to delete account"})
		return
	}
	if affected, _ := result.RowsAffected(); affected == 0 {
		c.JSON(404, gin.H{"error": "User not found"})
		return
	}
	c.JSON(200, gin.H{"status": "deleted"})
}

func ClearOwnLogs(c *gin.Context) {
	userID := c.GetInt("userID")
	if _, err := db.Exec("DELETE FROM logs WHERE user_id = $1", userID); err != nil {
		c.JSON(500, gin.H{"error": "Failed to clear history"})
		return
	}
	c.JSON(200, gin.H{"status": "cleared"})
}

func DeleteOwnAccount(c *gin.Context) {
	userID := c.GetInt("userID")
	result, err := db.Exec("DELETE FROM users WHERE id = $1", userID)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to delete account"})
		return
	}
	if affected, _ := result.RowsAffected(); affected == 0 {
		c.JSON(404, gin.H{"error": "User not found"})
		return
	}
	c.JSON(200, gin.H{"status": "deleted"})
}

func HealthCheck(c *gin.Context) {
	if err := db.Ping(); err != nil {
		c.JSON(503, gin.H{"status": "unhealthy", "error": "Database unreachable"})
		return
	}
	c.JSON(200, gin.H{"status": "healthy"})
}
