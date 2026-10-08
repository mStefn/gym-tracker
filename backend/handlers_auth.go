package main

import (
	"strings"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

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
	err := db.QueryRow(
		"SELECT id, name, pin FROM users WHERE name = $1",
		input.Name,
	).Scan(&id, &name, &hashedPin)
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

func SignUp(c *gin.Context) {
	var input struct {
		Name string `json:"name"`
		Pin  string `json:"pin"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": "Invalid input"})
		return
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(input.Pin), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(500, gin.H{"error": "Server error"})
		return
	}

	var id int
	err = db.QueryRow(
		"INSERT INTO users (name, pin) VALUES ($1, $2) RETURNING id",
		input.Name,
		string(hashed),
	).Scan(&id)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key value violates unique constraint") {
			c.JSON(409, gin.H{"error": "Username already exists"})
		} else {
			c.JSON(500, gin.H{"error": "Failed to create account"})
		}
		return
	}

	c.JSON(200, gin.H{"id": id, "name": input.Name})
}

func ChangePin(c *gin.Context) {
	var input struct {
		OldPin string `json:"old_pin"`
		NewPin string `json:"new_pin"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": "Invalid input"})
		return
	}

	userID := c.GetInt("userID")

	var hashedPin string
	if err := db.QueryRow(
		"SELECT pin FROM users WHERE id = $1",
		userID,
	).Scan(&hashedPin); err != nil {
		c.JSON(404, gin.H{"error": "User not found"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hashedPin), []byte(input.OldPin)); err != nil {
		c.JSON(401, gin.H{"error": "Current password incorrect"})
		return
	}

	newHashed, err := bcrypt.GenerateFromPassword([]byte(input.NewPin), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(500, gin.H{"error": "Server error"})
		return
	}

	if _, err := db.Exec(
		"UPDATE users SET pin = $1 WHERE id = $2",
		string(newHashed),
		userID,
	); err != nil {
		c.JSON(500, gin.H{"error": "Failed to update PIN"})
		return
	}

	c.JSON(200, gin.H{"status": "ok"})
}
