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

	// User progression.
	var exp, level int

	if err := db.QueryRow(`
		SELECT exp, level
		FROM users
		WHERE id = $1
	`, userID).Scan(&exp, &level); err != nil {
		log.Printf("GetDashboardData: failed to fetch progression: %v", err)
		c.JSON(500, gin.H{"error": "Failed to load user progression"})
		return
	}

	if level <= 0 {
		level = 1
	}

	expProgress := exp - (level-1)*1000
	if expProgress < 0 {
		expProgress = 0
	}

	// Completed workouts this calendar month.
	var workoutsThisMonth int

	if err := db.QueryRow(`
		SELECT COUNT(*)
		FROM workout_sessions
		WHERE user_id = $1
		  AND status = 'completed'
		  AND completed_at >= date_trunc('month', CURRENT_DATE)
		  AND completed_at < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
	`, userID).Scan(&workoutsThisMonth); err != nil {
		c.JSON(500, gin.H{"error": "Failed to count monthly workouts"})
		return
	}

	// Total logged training volume, across the user's history.
	var totalVolume float64

	if err := db.QueryRow(`
		SELECT COALESCE(SUM(weight * reps), 0)::double precision
		FROM logs
		WHERE user_id = $1
	`, userID).Scan(&totalVolume); err != nil {
		c.JSON(500, gin.H{"error": "Failed to calculate total volume"})
		return
	}

	// Most trained muscle group in the last 30 days.
	categoryRows, err := db.Query(`
		SELECT COALESCE(e.category, 'Other'), COUNT(*)
		FROM logs l
		JOIN exercises e ON e.id = l.exercise_id
		WHERE l.user_id = $1
		  AND l.created_at >= CURRENT_DATE - INTERVAL '30 days'
		GROUP BY e.category
	`, userID)

	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to calculate favorite muscle"})
		return
	}

	categoryCounts := make(map[string]int)

	for categoryRows.Next() {
		var category string
		var count int

		if err := categoryRows.Scan(&category, &count); err != nil {
			categoryRows.Close()
			c.JSON(500, gin.H{"error": "Failed to read muscle group data"})
			return
		}

		categoryCounts[normalizeMuscleCategory(category)] += count
	}

	if err := categoryRows.Err(); err != nil {
		categoryRows.Close()
		c.JSON(500, gin.H{"error": "Failed to read muscle group data"})
		return
	}
	categoryRows.Close()

	favoriteMuscle := ""
	favoriteMuscleCount := 0

	for category, count := range categoryCounts {
		if count > favoriteMuscleCount ||
			(count == favoriteMuscleCount &&
				(favoriteMuscle == "" || category < favoriteMuscle)) {
			favoriteMuscle = category
			favoriteMuscleCount = count
		}
	}

	// Three most recently completed workouts.
	type RecentWorkout struct {
		ID              int    `json:"id"`
		Name            string `json:"name"`
		CompletedAt     string `json:"completedAt"`
		DurationMinutes int    `json:"durationMinutes"`
		ExerciseCount   int    `json:"exerciseCount"`
	}

	recentWorkouts := make([]RecentWorkout, 0, 3)

	workoutRows, err := db.Query(`
		SELECT
			ws.id,
			ws.name,
			ws.completed_at::date::text,
			GREATEST(
				0,
				FLOOR(
					EXTRACT(EPOCH FROM (ws.completed_at - ws.started_at)) / 60
				)::int
			),
			(
				SELECT COUNT(*)::int
				FROM workout_session_exercises wse
				WHERE wse.session_id = ws.id
			)
		FROM workout_sessions ws
		WHERE ws.user_id = $1
		  AND ws.status = 'completed'
		  AND ws.completed_at IS NOT NULL
		ORDER BY ws.completed_at DESC
		LIMIT 3
	`, userID)

	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to load recent workouts"})
		return
	}

	for workoutRows.Next() {
		var workout RecentWorkout

		if err := workoutRows.Scan(
			&workout.ID,
			&workout.Name,
			&workout.CompletedAt,
			&workout.DurationMinutes,
			&workout.ExerciseCount,
		); err != nil {
			workoutRows.Close()
			c.JSON(500, gin.H{"error": "Failed to read recent workouts"})
			return
		}

		recentWorkouts = append(recentWorkouts, workout)
	}

	if err := workoutRows.Err(); err != nil {
		workoutRows.Close()
		c.JSON(500, gin.H{"error": "Failed to read recent workouts"})
		return
	}
	workoutRows.Close()

	// Recent body weight measurements.
	weights := make([]float64, 0, 7)

	weightRows, err := db.Query(`
		SELECT weight
		FROM user_weights
		WHERE user_id = $1
		ORDER BY logged_at DESC
		LIMIT 7
	`, userID)

	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to load weight history"})
		return
	}

	for weightRows.Next() {
		var weight float64

		if err := weightRows.Scan(&weight); err != nil {
			weightRows.Close()
			c.JSON(500, gin.H{"error": "Failed to read weight history"})
			return
		}

		weights = append(weights, weight)
	}

	if err := weightRows.Err(); err != nil {
		weightRows.Close()
		c.JSON(500, gin.H{"error": "Failed to read weight history"})
		return
	}
	weightRows.Close()

	// Recovery estimates, calculated from the last logged set of each exercise.
	readiness := map[string]int{
		"Chest":      100,
		"Back":       100,
		"Shoulders":  100,
		"Biceps":     100,
		"Triceps":    100,
		"Abs":        100,
		"Quads":      100,
		"Hamstrings": 100,
		"Glutes":     100,
		"Calves":     100,
	}

	readinessRows, err := db.Query(`
		SELECT
			e.name,
			COALESCE(e.category, 'Other'),
			FLOOR(
				EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - MAX(l.created_at))) / 3600
			)::int
		FROM logs l
		JOIN exercises e ON e.id = l.exercise_id
		WHERE l.user_id = $1
		GROUP BY e.id, e.name, e.category
	`, userID)

	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to calculate readiness"})
		return
	}

	for readinessRows.Next() {
		var exerciseName, category string
		var hours int

		if err := readinessRows.Scan(&exerciseName, &category, &hours); err != nil {
			readinessRows.Close()
			c.JSON(500, gin.H{"error": "Failed to read readiness data"})
			return
		}

		detailedCategory := category

		if category == "Legs" {
			nameLower := strings.ToLower(exerciseName)

			switch {
			case strings.Contains(nameLower, "calf"),
				strings.Contains(nameLower, "calves"):
				detailedCategory = "Calves"

			case strings.Contains(nameLower, "deadlift"),
				strings.Contains(nameLower, "curl"):
				detailedCategory = "Hamstrings"

			case strings.Contains(nameLower, "thrust"),
				strings.Contains(nameLower, "glute"),
				strings.Contains(nameLower, "abduction"),
				strings.Contains(nameLower, "adduction"):
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

	if err := readinessRows.Err(); err != nil {
		readinessRows.Close()
		c.JSON(500, gin.H{"error": "Failed to read readiness data"})
		return
	}
	readinessRows.Close()

	// Workout activity heatmap, last 45 days.
	heatmap := make([]string, 0)

	heatmapRows, err := db.Query(`
    SELECT DISTINCT created_at::date::text AS activity_date
    FROM logs
    WHERE user_id = $1
      AND created_at >= CURRENT_DATE - INTERVAL '45 days'
    ORDER BY activity_date ASC
`, userID)

	if err != nil {
		log.Printf("GetDashboardData: failed to load workout heatmap: %v", err)
		c.JSON(500, gin.H{"error": "Failed to load workout heatmap"})
		return
	}

	for heatmapRows.Next() {
		var date string

		if err := heatmapRows.Scan(&date); err != nil {
			heatmapRows.Close()
			log.Printf("GetDashboardData: failed to scan workout heatmap: %v", err)
			c.JSON(500, gin.H{"error": "Failed to read workout heatmap"})
			return
		}

		heatmap = append(heatmap, date)
	}

	if err := heatmapRows.Err(); err != nil {
		heatmapRows.Close()
		log.Printf("GetDashboardData: failed while reading workout heatmap: %v", err)
		c.JSON(500, gin.H{"error": "Failed to read workout heatmap"})
		return
	}

	heatmapRows.Close()

	// Weekly training volume for the current week and previous four weeks.
	type VolData struct {
		Week  string  `json:"week"`
		Total float64 `json:"total"`
	}

	volume := make([]VolData, 0, 5)

	volumeRows, err := db.Query(`
		WITH weeks AS (
			SELECT generate_series(
				date_trunc('week', CURRENT_DATE) - INTERVAL '4 weeks',
				date_trunc('week', CURRENT_DATE),
				INTERVAL '1 week'
			)::date AS week_start
		),
		weekly_volume AS (
			SELECT
				date_trunc('week', created_at)::date AS week_start,
				SUM(weight * reps)::double precision AS total
			FROM logs
			WHERE user_id = $1
			  AND created_at >=
				  date_trunc('week', CURRENT_DATE) - INTERVAL '4 weeks'
			GROUP BY 1
		)
		SELECT
			to_char(w.week_start, 'IYYY-IW'),
			COALESCE(v.total, 0)::double precision
		FROM weeks w
		LEFT JOIN weekly_volume v ON v.week_start = w.week_start
		ORDER BY w.week_start ASC
	`, userID)

	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to load volume history"})
		return
	}

	for volumeRows.Next() {
		var point VolData

		if err := volumeRows.Scan(&point.Week, &point.Total); err != nil {
			volumeRows.Close()
			c.JSON(500, gin.H{"error": "Failed to read volume history"})
			return
		}

		volume = append(volume, point)
	}

	if err := volumeRows.Err(); err != nil {
		volumeRows.Close()
		c.JSON(500, gin.H{"error": "Failed to read volume history"})
		return
	}
	volumeRows.Close()

	c.JSON(200, gin.H{
		"workoutsThisMonth": workoutsThisMonth,
		"totalVolume":       totalVolume,
		"favoriteMuscle":    favoriteMuscle,
		"recentWorkouts":    recentWorkouts,

		// Existing fields retained for compatibility.
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

		if err := rows.Scan(
			&row.Date,
			&row.Exercise,
			&row.Weight,
			&row.Reps,
			&row.ExID,
		); err == nil {
			stats = append(stats, row)
		}
	}

	c.JSON(200, stats)
}
