package main

import "github.com/gin-gonic/gin"

func GetAdvancedStats(c *gin.Context) {
	userID := c.GetInt("userID")

	var totalVolume float64
	var totalSets, totalWorkouts int
	if err := db.QueryRow(`
		SELECT
			COALESCE(SUM(weight * reps), 0),
			COUNT(id),
			COUNT(DISTINCT created_at::date)
		FROM logs
		WHERE user_id = $1
	`, userID).Scan(&totalVolume, &totalSets, &totalWorkouts); err != nil {
		c.JSON(500, gin.H{"error": "Failed to fetch advanced stats"})
		return
	}

	hallOfFame := make([]gin.H, 0)
	if rows, err := db.Query(`
		SELECT e.name, MAX(l.weight)
		FROM logs l
		JOIN exercises e ON l.exercise_id = e.id
		WHERE l.user_id = $1 AND l.weight > 0
		GROUP BY e.name
		ORDER BY MAX(l.weight) DESC
		LIMIT 10
	`, userID); err == nil {
		defer rows.Close()
		for rows.Next() {
			var name string
			var weight float64
			if rows.Scan(&name, &weight) == nil {
				hallOfFame = append(hallOfFame, gin.H{"name": name, "weight": weight})
			}
		}
	}

	distribution := make([]gin.H, 0)
	totalDistSets := 0
	if rows, err := db.Query(`
		SELECT e.category, COUNT(l.id)
		FROM logs l
		JOIN exercises e ON l.exercise_id = e.id
		WHERE l.user_id = $1
		GROUP BY e.category
		ORDER BY COUNT(l.id) DESC
	`, userID); err == nil {
		defer rows.Close()
		for rows.Next() {
			var category string
			var count int
			if rows.Scan(&category, &count) == nil {
				distribution = append(distribution, gin.H{"category": category, "count": count})
				totalDistSets += count
			}
		}
	}

	exercises := make([]gin.H, 0)
	if rows, err := db.Query(`
		SELECT DISTINCT e.id, e.name
		FROM logs l
		JOIN exercises e ON l.exercise_id = e.id
		WHERE l.user_id = $1
		ORDER BY e.name ASC
	`, userID); err == nil {
		defer rows.Close()
		for rows.Next() {
			var id int
			var name string
			if rows.Scan(&id, &name) == nil {
				exercises = append(exercises, gin.H{"id": id, "name": name})
			}
		}
	}

	c.JSON(200, gin.H{
		"milestones": gin.H{
			"volume":   totalVolume,
			"sets":     totalSets,
			"workouts": totalWorkouts,
		},
		"hallOfFame":    hallOfFame,
		"distribution":  distribution,
		"totalDistSets": totalDistSets,
		"exercises":     exercises,
	})
}

func GetExerciseDeepDive(c *gin.Context) {
	userID := c.GetInt("userID")
	exID := c.Param("ex_id")

	type ChartPoint struct {
		Date   string  `json:"date"`
		Weight float64 `json:"weight"`
	}

	rows, err := db.Query(`
		SELECT created_at::date::text, MAX(weight)
		FROM logs
		WHERE user_id = $1 AND exercise_id = $2
		GROUP BY created_at::date
		ORDER BY created_at::date ASC
	`, userID, exID)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to fetch exercise data"})
		return
	}
	defer rows.Close()

	points := make([]ChartPoint, 0)
	for rows.Next() {
		var point ChartPoint
		if rows.Scan(&point.Date, &point.Weight) == nil {
			points = append(points, point)
		}
	}

	c.JSON(200, points)
}

func GetLastResult(c *gin.Context) {
	userID := c.GetInt("userID")
	exID := c.Param("ex_id")
	setNum := c.Param("set")

	var reps int
	var weight float64
	var isFailure bool

	err := db.QueryRow(`
		SELECT reps, weight, COALESCE(is_failure, FALSE)
		FROM logs
		WHERE user_id = $1 AND exercise_id = $2 AND set_number = $3
		ORDER BY created_at DESC, id DESC
		LIMIT 1
	`, userID, exID, setNum).Scan(&reps, &weight, &isFailure)
	if err != nil {
		c.JSON(200, gin.H{"reps": 0, "weight": 0, "is_failure": false})
		return
	}

	c.JSON(200, gin.H{"reps": reps, "weight": weight, "is_failure": isFailure})
}
