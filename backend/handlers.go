package main

import (
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// --- AUTH HANDLERS ---

func Login(c *gin.Context) {
	var input struct {
		Name string `json:"name"`
		Pin  string `json:"pin"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": "Invalid input"})
		return
	}

	var id int
	var name, hashedPin string
	err := db.QueryRow("SELECT id, name, pin FROM users WHERE name = ?", input.Name).Scan(&id, &name, &hashedPin)
	if err != nil {
		c.JSON(401, gin.H{"error": "Invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hashedPin), []byte(input.Pin)); err != nil {
		c.JSON(401, gin.H{"error": "Invalid credentials"})
		return
	}

	token := GenerateToken(id)
	c.JSON(200, gin.H{"id": id, "name": name, "token": token})
}

// ... (SignUp, LogSet, GetLastResult, GetExercises pozostają bez zmian) ...

func ChangePin(c *gin.Context) {
	var input struct {
		UserID int    `json:"user_id"`
		OldPin string `json:"old_pin"`
		NewPin string `json:"new_pin"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": "Invalid input"})
		return
	}

	var hashedPin string
	err := db.QueryRow("SELECT pin FROM users WHERE id = ?", input.UserID).Scan(&hashedPin)
	if err != nil {
		c.JSON(404, gin.H{"error": "User not found"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hashedPin), []byte(input.OldPin)); err != nil {
		c.JSON(401, gin.H{"error": "Current password incorrect"})
		return
	}

	newHashed, _ := bcrypt.GenerateFromPassword([]byte(input.NewPin), bcrypt.DefaultCost)
	_, err = db.Exec("UPDATE users SET pin = ? WHERE id = ?", string(newHashed), input.UserID)
	if err != nil {
		c.JSON(500, gin.H{"error": "Update failed"})
		return
	}
	c.JSON(200, gin.H{"status": "ok"})
}

func AdminListUsers(c *gin.Context) {
	rows, err := db.Query("SELECT id, name, is_admin FROM users")
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var list []map[string]interface{}
	for rows.Next() {
		var id int
		var name string
		var isAdmin bool
		rows.Scan(&id, &name, &isAdmin)
		list = append(list, map[string]interface{}{
			"id":       id,
			"name":     name,
			"is_admin": isAdmin,
		})
	}
	c.JSON(200, list)
}

// ... (Pozostałe funkcje: AdminResetPin, DeleteAccount, HealthCheck bez zmian) ...
