package main

import (
	"log"
	"strings"

	"github.com/gin-gonic/gin"
)

func LogBodyWeight(c *gin.Context) {
	var input struct {
		Weight float64 `json:"weight"`
	}
	if err := c.ShouldBindJSON(&input); err != nil || input.Weight <= 0 {
		c.JSON(400, gin.H{"error": "Invalid input"})
		return
	}

	userID := c.GetInt("userID")
	_, err := db.Exec(`
		INSERT INTO user_weights (user_id, weight, logged_at)
		VALUES ($1, $2, CURRENT_DATE)
		ON CONFLICT (user_id, logged_at)
		DO UPDATE SET weight = EXCLUDED.weight
	`, userID, input.Weight)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to log weight"})
		return
	}

	c.JSON(200, gin.H{"status": "ok"})
}

func GetDashboardData(c *gin.Context) {
	userID := c.GetInt("userID")

	var exp, level int
	if err := db.QueryRow("SELECT exp, level FROM users WHERE id = $1", userID).Scan(&exp, &level); err != nil {
		log.Printf("GetDashboardData: failed to fetch user stats: %v", err)
	}
	if level <= 0 {
		level = 1
	}

	currentLevelBaseExp := (level - 1) * 1000
	expProgress := exp - currentLevelBaseExp
	if expProgress < 0 {
		expProgress = 0
	}

	weights := make([]float64, 0)
	if rows, err := db.Query(
		"SELECT weight FROM user_weights WHERE user_id = $1 ORDER BY logged_at DESC LIMIT 7",
		userID,
	); err == nil {
		defer rows.Close()
		for rows.Next() {
			var weight float64
			if rows.Scan(&weight) == nil {
				weights = append(weights, weight)
			}
		}
	}

	readiness := map[string]int{
		"Chest": 100, "Back": 100, "Shoulders": 100, "Biceps": 100, "Triceps": 100,
		"Abs": 100, "Quads": 100, "Hamstrings": 100, "Glutes": 100, "Calves": 100,
	}

	if rows, err := db.Query(`
		SELECT e.name, e.category,
		       FLOOR(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - MAX(l.created_at))) / 3600)::int
		FROM logs l
		JOIN exercises e ON l.exercise_id = e.id
		WHERE l.user_id = $1
		GROUP BY e.id, e.name, e.category
	`, userID); err == nil {
		defer rows.Close()
		for rows.Next() {
			var exName, category string
			var hours int
			if rows.Scan(&exName, &category, &hours) != nil {
				continue
			}

			detailedCategory := category
			if category == "Legs" {
				nameLower := strings.ToLower(exName)
				switch {
				case strings.Contains(nameLower, "calf"), strings.Contains(nameLower, "calves"):
					detailedCategory = "Calves"
				case strings.Contains(nameLower, "deadlift"), strings.Contains(nameLower, "curl"):
					detailedCategory = "Hamstrings"
				case strings.Contains(nameLower, "thrust"), strings.Contains(nameLower, "glute"), strings.Contains(nameLower, "abduction"), strings.Contains(nameLower, "adduction"):
					detailedCategory = "Glutes"
				default:
					detailedCategory = "Quads"
				}
			}

			pct := 100
			if hours < 24 {
				pct = 15
			} else if hours < 48 {
				pct = 50
			} else if hours < 72 {
				pct = 85
			}

			if current, ok := readiness[detailedCategory]; ok && pct < current {
				readiness[detailedCategory] = pct
			}
		}
	}

	heatmap := make([]string, 0)
	if rows, err := db.Query(`
		SELECT DISTINCT created_at::date::text
		FROM logs
		WHERE user_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '45 days'
		ORDER BY created_at::date ASC
	`, userID); err == nil {
		defer rows.Close()
		for rows.Next() {
			var date string
			if rows.Scan(&date) == nil {
				heatmap = append(heatmap, date)
			}
		}
	}

	type VolData struct {
		Week  string  `json:"week"`
		Total float64 `json:"total"`
	}
	volume := make([]VolData, 0)
	if rows, err := db.Query(`
		SELECT TO_CHAR(created_at, 'IYYY-IW'), SUM(weight * reps)
		FROM logs
		WHERE user_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '28 days'
		GROUP BY TO_CHAR(created_at, 'IYYY-IW')
		ORDER BY TO_CHAR(created_at, 'IYYY-IW') ASC
	`, userID); err == nil {
		defer rows.Close()
		for rows.Next() {
			var week string
			var total float64
			if rows.Scan(&week, &total) == nil {
				volume = append(volume, VolData{Week: week, Total: total})
			}
		}
	}

	c.JSON(200, gin.H{
		"weights":    weights,
		"readiness":  readiness,
		"heatmap":    heatmap,
		"volume":     volume,
		"level":      level,
		"exp":        expProgress,
		"exp_target": 1000,
	})
}

func GetUserStats(c *gin.Context) {
	userID := c.GetInt("userID")

	rows, err := db.Query(`
		SELECT l.created_at, e.name, l.weight, l.reps, e.id
		FROM logs l
		JOIN exercises e ON l.exercise_id = e.id
		WHERE l.user_id = $1
		ORDER BY l.created_at ASC
	`, userID)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to fetch stats"})
		return
	}
	defer rows.Close()

	type StatRow struct {
		Date     string  `json:"date"`
		Exercise string  `json:"exercise"`
		Weight   float64 `json:"weight"`
		Reps     int     `json:"reps"`
		ExID     int     `json:"ex_id"`
	}

	stats := make([]StatRow, 0)
	for rows.Next() {
		var row StatRow
		if rows.Scan(&row.Date, &row.Exercise, &row.Weight, &row.Reps, &row.ExID) == nil {
			stats = append(stats, row)
		}
	}

	c.JSON(200, stats)
}
