package main

import (
	"database/sql"
	"math"
	"sort"
	"strings"

	"github.com/gin-gonic/gin"
)

func GetAdvancedStats(c *gin.Context) {
	userID := c.GetInt("userID")

	type Summary struct {
		CompletedWorkouts   int    `json:"completedWorkouts"`
		CurrentStreakWeeks  int    `json:"currentStreakWeeks"`
		MostWorkoutsInMonth int    `json:"mostWorkoutsInMonth"`
		FavoriteExercise    string `json:"favoriteExercise"`
	}

	type MonthlyTrend struct {
		Month        string  `json:"month"`
		TotalVolume  float64 `json:"totalVolume"`
		WorkoutCount int     `json:"workoutCount"`
		ChestVolume  float64 `json:"chestVolume"`
	}

	type PersonalRecord struct {
		Name   string  `json:"name"`
		Weight float64 `json:"weight"`
		Reps   int     `json:"reps"`
		Date   string  `json:"date"`
	}

	type MuscleDistribution struct {
		Category string `json:"category"`
		Count    int    `json:"count"`
		Percent  int    `json:"percent"`
	}

	summary := Summary{
		FavoriteExercise: "",
	}

	// Completed workout sessions.
	if err := db.QueryRow(`
		SELECT COUNT(*)
		FROM workout_sessions
		WHERE user_id = $1
		  AND status = 'completed'
	`, userID).Scan(&summary.CompletedWorkouts); err != nil {
		c.JSON(500, gin.H{"error": "Failed to count completed workouts"})
		return
	}

	// Weekly streak. If the user has not trained this week yet,
	// their previous week's streak remains active until that week ends.
	if err := db.QueryRow(`
		WITH RECURSIVE completed_weeks AS (
			SELECT DISTINCT date_trunc('week', completed_at)::date AS week_start
			FROM workout_sessions
			WHERE user_id = $1
			  AND status = 'completed'
			  AND completed_at IS NOT NULL
		),
		anchor AS (
			SELECT CASE
				WHEN EXISTS (
					SELECT 1
					FROM completed_weeks
					WHERE week_start = date_trunc('week', CURRENT_DATE)::date
				)
				THEN date_trunc('week', CURRENT_DATE)::date
				ELSE (
					date_trunc('week', CURRENT_DATE) - INTERVAL '1 week'
				)::date
			END AS week_start
		),
		streak(week_start, streak_weeks) AS (
			SELECT anchor.week_start, 1
			FROM anchor
			WHERE EXISTS (
				SELECT 1
				FROM completed_weeks
				WHERE completed_weeks.week_start = anchor.week_start
			)

			UNION ALL

			SELECT
				(streak.week_start - INTERVAL '1 week')::date,
				streak.streak_weeks + 1
			FROM streak
			JOIN completed_weeks
				ON completed_weeks.week_start =
				   (streak.week_start - INTERVAL '1 week')::date
		)
		SELECT COALESCE(MAX(streak_weeks), 0)
		FROM streak
	`, userID).Scan(&summary.CurrentStreakWeeks); err != nil {
		c.JSON(500, gin.H{"error": "Failed to calculate training streak"})
		return
	}

	// Highest number of completed workouts in a calendar month.
	if err := db.QueryRow(`
		SELECT COALESCE(MAX(monthly_count), 0)
		FROM (
			SELECT COUNT(*) AS monthly_count
			FROM workout_sessions
			WHERE user_id = $1
			  AND status = 'completed'
			  AND completed_at IS NOT NULL
			GROUP BY date_trunc('month', completed_at)
		) monthly
	`, userID).Scan(&summary.MostWorkoutsInMonth); err != nil {
		c.JSON(500, gin.H{"error": "Failed to calculate monthly record"})
		return
	}

	// Favorite exercise: the exercise with the most logged sets.
	err := db.QueryRow(`
		SELECT e.name
		FROM logs l
		JOIN exercises e ON e.id = l.exercise_id
		WHERE l.user_id = $1
		GROUP BY e.id, e.name
		ORDER BY COUNT(l.id) DESC, e.name ASC
		LIMIT 1
	`, userID).Scan(&summary.FavoriteExercise)

	if err != nil && err != sql.ErrNoRows {
		c.JSON(500, gin.H{"error": "Failed to find favorite exercise"})
		return
	}

	// All-time training volume and logged sets, retained for compatibility.
	var totalVolume float64
	var totalSets int

	if err := db.QueryRow(`
		SELECT
			COALESCE(SUM(weight * reps), 0)::double precision,
			COUNT(*)
		FROM logs
		WHERE user_id = $1
	`, userID).Scan(&totalVolume, &totalSets); err != nil {
		c.JSON(500, gin.H{"error": "Failed to calculate training volume"})
		return
	}

	// Monthly trend: current month and the previous five months.
	trendRows, err := db.Query(`
		WITH months AS (
			SELECT generate_series(
				date_trunc('month', CURRENT_DATE) - INTERVAL '5 months',
				date_trunc('month', CURRENT_DATE),
				INTERVAL '1 month'
			)::date AS month
		),
		monthly_volume AS (
			SELECT
				date_trunc('month', created_at)::date AS month,
				SUM(weight * reps)::double precision AS volume
			FROM logs
			WHERE user_id = $1
			  AND created_at >=
			      date_trunc('month', CURRENT_DATE) - INTERVAL '5 months'
			GROUP BY 1
		),
		monthly_workouts AS (
			SELECT
				date_trunc('month', completed_at)::date AS month,
				COUNT(*) AS workout_count
			FROM workout_sessions
			WHERE user_id = $1
			  AND status = 'completed'
			  AND completed_at >=
			      date_trunc('month', CURRENT_DATE) - INTERVAL '5 months'
			GROUP BY 1
		),
		monthly_chest AS (
			SELECT
				date_trunc('month', l.created_at)::date AS month,
				SUM(l.weight * l.reps)::double precision AS volume
			FROM logs l
			JOIN exercises e ON e.id = l.exercise_id
			WHERE l.user_id = $1
			  AND l.created_at >=
			      date_trunc('month', CURRENT_DATE) - INTERVAL '5 months'
			  AND LOWER(COALESCE(e.category, '')) LIKE '%chest%'
			GROUP BY 1
		)
		SELECT
			to_char(m.month, 'YYYY-MM'),
			COALESCE(v.volume, 0)::double precision,
			COALESCE(w.workout_count, 0)::int,
			COALESCE(ch.volume, 0)::double precision
		FROM months m
		LEFT JOIN monthly_volume v ON v.month = m.month
		LEFT JOIN monthly_workouts w ON w.month = m.month
		LEFT JOIN monthly_chest ch ON ch.month = m.month
		ORDER BY m.month ASC
	`, userID)

	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to load monthly training data"})
		return
	}

	monthlyTrend := make([]MonthlyTrend, 0, 6)

	for trendRows.Next() {
		var point MonthlyTrend

		if err := trendRows.Scan(
			&point.Month,
			&point.TotalVolume,
			&point.WorkoutCount,
			&point.ChestVolume,
		); err != nil {
			trendRows.Close()
			c.JSON(500, gin.H{"error": "Failed to read monthly training data"})
			return
		}

		monthlyTrend = append(monthlyTrend, point)
	}

	if err := trendRows.Err(); err != nil {
		trendRows.Close()
		c.JSON(500, gin.H{"error": "Failed to read monthly training data"})
		return
	}
	trendRows.Close()

	// Best logged weighted performance for each exercise.
	// Results are ordered by the date those best performances were recorded.
	recordRows, err := db.Query(`
		WITH best AS (
			SELECT DISTINCT ON (l.exercise_id)
				e.name,
				l.weight,
				l.reps,
				l.created_at::date AS record_date
			FROM logs l
			JOIN exercises e ON e.id = l.exercise_id
			WHERE l.user_id = $1
			  AND l.weight > 0
			  AND l.reps > 0
			ORDER BY
				l.exercise_id,
				l.weight DESC,
				l.reps DESC,
				l.created_at DESC,
				l.id DESC
		)
		SELECT name, weight, reps, record_date::text
		FROM best
		ORDER BY record_date DESC, weight DESC
		LIMIT 5
	`, userID)

	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to load personal records"})
		return
	}

	personalRecords := make([]PersonalRecord, 0, 5)

	for recordRows.Next() {
		var record PersonalRecord

		if err := recordRows.Scan(
			&record.Name,
			&record.Weight,
			&record.Reps,
			&record.Date,
		); err != nil {
			recordRows.Close()
			c.JSON(500, gin.H{"error": "Failed to read personal records"})
			return
		}

		personalRecords = append(personalRecords, record)
	}

	if err := recordRows.Err(); err != nil {
		recordRows.Close()
		c.JSON(500, gin.H{"error": "Failed to read personal records"})
		return
	}
	recordRows.Close()

	// Muscle group distribution based on logged sets over the last 30 days.
	distributionRows, err := db.Query(`
		SELECT
			COALESCE(e.category, 'Other'),
			COUNT(l.id)
		FROM logs l
		JOIN exercises e ON e.id = l.exercise_id
		WHERE l.user_id = $1
		  AND l.created_at >= CURRENT_DATE - INTERVAL '30 days'
		GROUP BY e.category
		ORDER BY COUNT(l.id) DESC
	`, userID)

	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to load muscle distribution"})
		return
	}

	distributionCounts := make(map[string]int)

	for distributionRows.Next() {
		var category string
		var count int

		if err := distributionRows.Scan(&category, &count); err != nil {
			distributionRows.Close()
			c.JSON(500, gin.H{"error": "Failed to read muscle distribution"})
			return
		}

		category = normalizeMuscleCategory(category)
		distributionCounts[category] += count
	}

	if err := distributionRows.Err(); err != nil {
		distributionRows.Close()
		c.JSON(500, gin.H{"error": "Failed to read muscle distribution"})
		return
	}
	distributionRows.Close()

	totalDistSets := 0
	for _, count := range distributionCounts {
		totalDistSets += count
	}

	distribution := make([]MuscleDistribution, 0, len(distributionCounts))

	for category, count := range distributionCounts {
		percent := 0

		if totalDistSets > 0 {
			percent = int(math.Round(float64(count) * 100 / float64(totalDistSets)))
		}

		distribution = append(distribution, MuscleDistribution{
			Category: category,
			Count:    count,
			Percent:  percent,
		})
	}

	sort.Slice(distribution, func(i, j int) bool {
		if distribution[i].Count == distribution[j].Count {
			return distribution[i].Category < distribution[j].Category
		}
		return distribution[i].Count > distribution[j].Count
	})

	// Keep the existing fields for any older frontend consumers.
	hallOfFame := make([]gin.H, 0)

	fameRows, err := db.Query(`
		SELECT e.name, MAX(l.weight)
		FROM logs l
		JOIN exercises e ON e.id = l.exercise_id
		WHERE l.user_id = $1
		  AND l.weight > 0
		GROUP BY e.id, e.name
		ORDER BY MAX(l.weight) DESC
		LIMIT 10
	`, userID)

	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to load exercise records"})
		return
	}

	for fameRows.Next() {
		var name string
		var weight float64

		if err := fameRows.Scan(&name, &weight); err != nil {
			fameRows.Close()
			c.JSON(500, gin.H{"error": "Failed to read exercise records"})
			return
		}

		hallOfFame = append(hallOfFame, gin.H{
			"name":   name,
			"weight": weight,
		})
	}

	if err := fameRows.Err(); err != nil {
		fameRows.Close()
		c.JSON(500, gin.H{"error": "Failed to read exercise records"})
		return
	}
	fameRows.Close()

	exercises := make([]gin.H, 0)

	exerciseRows, err := db.Query(`
		SELECT DISTINCT e.id, e.name
		FROM logs l
		JOIN exercises e ON e.id = l.exercise_id
		WHERE l.user_id = $1
		ORDER BY e.name ASC
	`, userID)

	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to load exercises"})
		return
	}

	for exerciseRows.Next() {
		var id int
		var name string

		if err := exerciseRows.Scan(&id, &name); err != nil {
			exerciseRows.Close()
			c.JSON(500, gin.H{"error": "Failed to read exercises"})
			return
		}

		exercises = append(exercises, gin.H{
			"id":   id,
			"name": name,
		})
	}

	if err := exerciseRows.Err(); err != nil {
		exerciseRows.Close()
		c.JSON(500, gin.H{"error": "Failed to read exercises"})
		return
	}
	exerciseRows.Close()

	c.JSON(200, gin.H{
		"summary":         summary,
		"monthlyTrend":    monthlyTrend,
		"personalRecords": personalRecords,
		"distribution":    distribution,
		"totalDistSets":   totalDistSets,
		"milestones": gin.H{
			"volume":   totalVolume,
			"sets":     totalSets,
			"workouts": summary.CompletedWorkouts,
		},
		"hallOfFame": hallOfFame,
		"exercises":  exercises,
	})
}

func normalizeMuscleCategory(category string) string {
	original := strings.TrimSpace(category)
	normalized := strings.ToLower(original)

	switch {
	case strings.Contains(normalized, "chest"):
		return "Chest"
	case strings.Contains(normalized, "back"):
		return "Back"
	case strings.Contains(normalized, "leg"),
		strings.Contains(normalized, "quad"),
		strings.Contains(normalized, "hamstring"),
		strings.Contains(normalized, "glute"),
		strings.Contains(normalized, "calf"):
		return "Legs"
	case strings.Contains(normalized, "shoulder"),
		strings.Contains(normalized, "bicep"),
		strings.Contains(normalized, "tricep"),
		strings.Contains(normalized, "arm"):
		return "Shoulders & Arms"
	case original == "":
		return "Other"
	default:
		return original
	}
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
		WHERE user_id = $1
		  AND exercise_id = $2
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

		if err := rows.Scan(&point.Date, &point.Weight); err == nil {
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
		WHERE user_id = $1
		  AND exercise_id = $2
		  AND set_number = $3
		ORDER BY created_at DESC, id DESC
		LIMIT 1
	`, userID, exID, setNum).Scan(&reps, &weight, &isFailure)

	if err != nil {
		c.JSON(200, gin.H{
			"reps":       0,
			"weight":     0,
			"is_failure": false,
		})
		return
	}

	c.JSON(200, gin.H{
		"reps":       reps,
		"weight":     weight,
		"is_failure": isFailure,
	})
}
