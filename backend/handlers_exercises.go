package main

import (
	"strings"

	"github.com/gin-gonic/gin"
)

type FindOrCreateReq struct {
	Name     string `json:"name"`
	Category string `json:"category"`
}

func GetExercises(c *gin.Context) {
	rows, err := db.Query(
		"SELECT id, name, category FROM exercises ORDER BY category, name ASC",
	)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to fetch exercises"})
		return
	}
	defer rows.Close()

	list := make([]gin.H, 0)
	for rows.Next() {
		var id int
		var name, category string
		if err := rows.Scan(&id, &name, &category); err != nil {
			continue
		}
		list = append(list, gin.H{
			"id":       id,
			"name":     name,
			"category": category,
		})
	}

	c.JSON(200, list)
}

func FindOrCreateExerciseHandler(c *gin.Context) {
	var req FindOrCreateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Invalid input"})
		return
	}

	req.Name = strings.TrimSpace(req.Name)
	req.Category = strings.TrimSpace(req.Category)
	if req.Name == "" {
		c.JSON(400, gin.H{"error": "Exercise name is required"})
		return
	}

	id, err := GetOrCreateExerciseDB(req.Name, req.Category)
	if err != nil {
		c.JSON(500, gin.H{"error": "Database error while processing exercise"})
		return
	}

	c.JSON(200, gin.H{
		"id":       id,
		"name":     req.Name,
		"category": req.Category,
	})
}
