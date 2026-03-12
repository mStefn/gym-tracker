package main

import (
	"strings"

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

	res, err := db.Exec("INSERT INTO users (name, pin) VALUES (?, ?)", input.Name, string(hashed))
	if err != nil {
		c.JSON(500, gin.H{"error": "Username already exists"})
		return
	}

	id, _ := res.LastInsertId()
	c.JSON(200, gin.H{"id": id, "name": input.Name})
}

// --- WORKOUT & PROGRESS ---
func LogSet(c *gin.Context) {
	var input struct {
		UserID     int     `json:"user_id"`
		ExerciseID int     `json:"exercise_id"`
		SetNumber  int     `json:"set_number"`
		Reps       int     `json:"reps"`
		Weight     float64 `json:"weight"`
		IsFailure  bool    `json:"is_failure"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": "Invalid input"})
		return
	}
	_, err := db.Exec("INSERT INTO logs (user_id, exercise_id, set_number, reps, weight, is_failure) VALUES (?, ?, ?, ?, ?, ?)",
		input.UserID, input.ExerciseID, input.SetNumber, input.Reps, input.Weight, input.IsFailure)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	expGained := int(input.Weight * float64(input.Reps) * 0.1)
	if expGained <= 0 && input.Reps > 0 {
		expGained = input.Reps
	}
	if expGained <= 0 {
		expGained = 1
	}

	db.Exec("UPDATE users SET exp = exp + ? WHERE id = ?", expGained, input.UserID)
	db.Exec("UPDATE users SET level = FLOOR(exp / 1000) + 1 WHERE id = ?", input.UserID)

	c.JSON(200, gin.H{"status": "success"})
}

func GetLastResult(c *gin.Context) {
	userID := c.Param("user_id")
	exID := c.Param("ex_id")
	setNum := c.Param("set")
	var reps int
	var weight float64
	var isFailure bool

	err := db.QueryRow("SELECT reps, weight, COALESCE(is_failure, FALSE) FROM logs WHERE user_id = ? AND exercise_id = ? AND set_number = ? ORDER BY created_at DESC LIMIT 1",
		userID, exID, setNum).Scan(&reps, &weight, &isFailure)
	if err != nil {
		c.JSON(200, gin.H{"reps": 0, "weight": 0, "is_failure": false})
		return
	}
	c.JSON(200, gin.H{"reps": reps, "weight": weight, "is_failure": isFailure})
}

func GetUserStats(c *gin.Context) {
	userID := c.Param("user_id")
	rows, err := db.Query(`
        SELECT l.created_at, e.name, l.weight, l.reps, e.id
        FROM logs l
        JOIN exercises e ON l.exercise_id = e.id
        WHERE l.user_id = ?
        ORDER BY l.created_at ASC`, userID)

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

	var stats []StatRow
	for rows.Next() {
		var s StatRow
		if err := rows.Scan(&s.Date, &s.Exercise, &s.Weight, &s.Reps, &s.ExID); err != nil {
			continue
		}
		stats = append(stats, s)
	}
	if stats == nil {
		stats = []StatRow{}
	}
	c.JSON(200, stats)
}

// --- PRO DASHBOARD HANDLERS ---
func LogBodyWeight(c *gin.Context) {
	var input struct {
		UserID int     `json:"user_id"`
		Weight float64 `json:"weight"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": "Invalid input"})
		return
	}
	_, err := db.Exec("INSERT INTO user_weights (user_id, weight, logged_at) VALUES (?, ?, CURDATE()) ON DUPLICATE KEY UPDATE weight = ?", input.UserID, input.Weight, input.Weight)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to log weight"})
		return
	}
	c.JSON(200, gin.H{"status": "ok"})
}

func GetDashboardData(c *gin.Context) {
	userID := c.Param("user_id")

	var exp, level int
	db.QueryRow("SELECT exp, level FROM users WHERE id = ?", userID).Scan(&exp, &level)
	if level == 0 {
		level = 1
	}
	currentLevelBaseExp := (level - 1) * 1000
	expProgress := exp - currentLevelBaseExp

	var weights []float64
	wRows, _ := db.Query("SELECT weight FROM user_weights WHERE user_id = ? ORDER BY logged_at DESC LIMIT 7", userID)
	for wRows.Next() {
		var w float64
		wRows.Scan(&w)
		weights = append(weights, w)
	}
	wRows.Close()

	// TWARDE USTAWIANIE DOMYŚLNYCH WARTOŚCI NA 100% (ZIELONY)
	readiness := map[string]int{
		"Chest": 100, "Back": 100, "Shoulders": 100, "Biceps": 100,
		"Triceps": 100, "Abs": 100, "Quads": 100, "Hamstrings": 100,
		"Glutes": 100, "Calves": 100,
	}

	rRows, _ := db.Query(`
        SELECT e.name, e.category, TIMESTAMPDIFF(HOUR, MAX(l.created_at), NOW()) 
        FROM logs l 
        JOIN exercises e ON l.exercise_id = e.id 
        WHERE l.user_id = ? 
        GROUP BY e.id`, userID)

	for rRows.Next() {
		var exName, cat string
		var hours int
		if err := rRows.Scan(&exName, &cat, &hours); err == nil {

			// MAPOWANIE PRECYZYJNYCH PARTII MIĘŚNIOWYCH
			detailedCat := cat
			if cat == "Legs" {
				nameLower := strings.ToLower(exName)
				if strings.Contains(nameLower, "calf") || strings.Contains(nameLower, "calves") {
					detailedCat = "Calves"
				} else if strings.Contains(nameLower, "deadlift") || strings.Contains(nameLower, "curl") {
					detailedCat = "Hamstrings"
				} else if strings.Contains(nameLower, "thrust") || strings.Contains(nameLower, "glute") || strings.Contains(nameLower, "abduction") || strings.Contains(nameLower, "adduction") {
					detailedCat = "Glutes"
				} else {
					detailedCat = "Quads" // Squaty, Lunge, prasa
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

			// Szukamy NAJBARDZIEJ zmęczonego ćwiczenia z danej grupy (nadpisuje mniejszą wartość)
			if pct < readiness[detailedCat] {
				readiness[detailedCat] = pct
			}
		}
	}
	rRows.Close()

	var heatmap []string
	hRows, _ := db.Query("SELECT DISTINCT DATE(created_at) FROM logs WHERE user_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 45 DAY)", userID)
	for hRows.Next() {
		var d string
		hRows.Scan(&d)
		heatmap = append(heatmap, d[:10])
	}
	hRows.Close()

	type VolData struct {
		Week  string  `json:"week"`
		Total float64 `json:"total"`
	}
	var volume []VolData
	vRows, _ := db.Query(`SELECT YEARWEEK(created_at, 1), SUM(weight * reps) FROM logs WHERE user_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 28 DAY) GROUP BY YEARWEEK(created_at, 1) ORDER BY YEARWEEK(created_at, 1) ASC`, userID)
	for vRows.Next() {
		var w string
		var t float64
		vRows.Scan(&w, &t)
		volume = append(volume, VolData{Week: w, Total: t})
	}
	vRows.Close()

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

// --- CREATOR & PLANS ---
func GetExercises(c *gin.Context) {
	rows, err := db.Query("SELECT id, name, category FROM exercises ORDER BY category, name ASC")
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to fetch exercises"})
		return
	}
	defer rows.Close()
	list := []map[string]interface{}{}
	for rows.Next() {
		var id int
		var name, cat string
		if err := rows.Scan(&id, &name, &cat); err != nil {
			continue
		}
		list = append(list, map[string]interface{}{"id": id, "name": name, "category": cat})
	}
	c.JSON(200, list)
}

func CreatePlan(c *gin.Context) {
	var input struct {
		Name   string `json:"name"`
		UserID int    `json:"user_id"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": "Invalid input"})
		return
	}
	res, err := db.Exec("INSERT INTO workout_plans (user_id, name) VALUES (?, ?)", input.UserID, input.Name)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to create plan"})
		return
	}
	id, _ := res.LastInsertId()
	c.JSON(200, gin.H{"id": id, "name": input.Name})
}

func AddExerciseToPlan(c *gin.Context) {
	var input struct {
		PlanID       int    `json:"plan_id"`
		ExerciseID   string `json:"exercise_id"` // Przymujemy jako tekst (żeby nie rzucać 400 Bad Request)
		TargetSets   int    `json:"target_sets"`
		ExerciseName string `json:"exercise_name"` // Złapiemy z frontu
		Category     string `json:"category"`      // Złapiemy z frontu
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": "Invalid input"})
		return
	}

	// 1. Upewniamy się, że to ćwiczenie fizycznie istnieje w bazie i wyciągamy poprawne ID (Integer)
	realExerciseID, err := GetOrCreateExerciseDB(input.ExerciseName, input.Category)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to resolve exercise ID"})
		return
	}

	// 2. Wrzucamy do planu prawdziwe liczbowe ID
	_, err = db.Exec("INSERT INTO plan_exercises (plan_id, exercise_id, target_sets) VALUES (?, ?, ?)", input.PlanID, realExerciseID, input.TargetSets)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to add exercise to plan"})
		return
	}
	c.JSON(200, gin.H{"status": "ok"})
}

func GetUserPlans(c *gin.Context) {
	userID := c.Param("user_id")
	rows, err := db.Query("SELECT id, name FROM workout_plans WHERE user_id = ?", userID)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to fetch plans"})
		return
	}
	defer rows.Close()
	list := []map[string]interface{}{}
	for rows.Next() {
		var id int
		var name string
		if err := rows.Scan(&id, &name); err != nil {
			continue
		}
		list = append(list, map[string]interface{}{"id": id, "name": name})
	}
	c.JSON(200, list)
}

func GetPlanExercises(c *gin.Context) {
	planID := c.Param("plan_id")
	rows, err := db.Query(`
        SELECT e.id, e.name, pe.target_sets 
        FROM plan_exercises pe 
        JOIN exercises e ON pe.exercise_id = e.id 
        WHERE pe.plan_id = ?`, planID)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to fetch plan exercises"})
		return
	}
	defer rows.Close()
	list := []map[string]interface{}{}
	for rows.Next() {
		var id, sets int
		var name string
		if err := rows.Scan(&id, &name, &sets); err != nil {
			continue
		}
		list = append(list, map[string]interface{}{"exercise_id": id, "exercise_name": name, "target_sets": sets})
	}
	c.JSON(200, list)
}

func DeletePlan(c *gin.Context) {
	id := c.Param("id")
	result, err := db.Exec("DELETE FROM workout_plans WHERE id = ?", id)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to delete plan"})
		return
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		c.JSON(404, gin.H{"error": "Plan not found"})
		return
	}
	c.JSON(200, gin.H{"status": "deleted"})
}

// --- ADMIN & MANAGEMENT ---
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
		list = append(list, map[string]interface{}{"id": id, "name": name, "is_admin": isAdmin})
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

	newHashed, _ := bcrypt.GenerateFromPassword([]byte(input.NewPin), bcrypt.DefaultCost)
	db.Exec("UPDATE users SET pin = ? WHERE id = ?", string(newHashed), input.UserID)
	c.JSON(200, gin.H{"status": "ok"})
}

func DeleteAccount(c *gin.Context) {
	id := c.Param("id")
	db.Exec("DELETE FROM users WHERE id = ?", id)
	c.JSON(200, gin.H{"status": "deleted"})
}

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
	db.Exec("UPDATE users SET pin = ? WHERE id = ?", string(newHashed), input.UserID)
	c.JSON(200, gin.H{"status": "ok"})
}

func HealthCheck(c *gin.Context) {
	c.JSON(200, gin.H{"status": "healthy"})
}

// --- ADVANCED STATISTICS ---
func GetAdvancedStats(c *gin.Context) {
	userID := c.Param("user_id")

	var totalVolume float64
	var totalSets, totalWorkouts int

	db.QueryRow("SELECT COALESCE(SUM(weight * reps), 0), COUNT(id), COUNT(DISTINCT DATE(created_at)) FROM logs WHERE user_id = ?", userID).Scan(&totalVolume, &totalSets, &totalWorkouts)

	milestones := gin.H{
		"volume":   totalVolume,
		"sets":     totalSets,
		"workouts": totalWorkouts,
	}

	type Fame struct {
		Name   string  `json:"name"`
		Weight float64 `json:"weight"`
	}
	var hallOfFame []Fame
	fRows, _ := db.Query(`SELECT e.name, MAX(l.weight) FROM logs l JOIN exercises e ON l.exercise_id = e.id WHERE l.user_id = ? AND l.weight > 0 GROUP BY e.name ORDER BY MAX(l.weight) DESC LIMIT 10`, userID)
	defer fRows.Close()
	for fRows.Next() {
		var f Fame
		fRows.Scan(&f.Name, &f.Weight)
		hallOfFame = append(hallOfFame, f)
	}

	type Distribution struct {
		Category string `json:"category"`
		Count    int    `json:"count"`
	}
	var dist []Distribution
	dRows, _ := db.Query(`SELECT e.category, COUNT(l.id) FROM logs l JOIN exercises e ON l.exercise_id = e.id WHERE l.user_id = ? GROUP BY e.category ORDER BY COUNT(l.id) DESC`, userID)
	defer dRows.Close()

	totalDistSets := 0
	for dRows.Next() {
		var d Distribution
		dRows.Scan(&d.Category, &d.Count)
		dist = append(dist, d)
		totalDistSets += d.Count
	}

	type UserExercise struct {
		ID   int    `json:"id"`
		Name string `json:"name"`
	}
	var exercises []UserExercise
	eRows, _ := db.Query(`SELECT DISTINCT e.id, e.name FROM logs l JOIN exercises e ON l.exercise_id = e.id WHERE l.user_id = ? ORDER BY e.name ASC`, userID)
	defer eRows.Close()
	for eRows.Next() {
		var ex UserExercise
		eRows.Scan(&ex.ID, &ex.Name)
		exercises = append(exercises, ex)
	}

	c.JSON(200, gin.H{
		"milestones":    milestones,
		"hallOfFame":    hallOfFame,
		"distribution":  dist,
		"totalDistSets": totalDistSets,
		"exercises":     exercises,
	})
}

func GetExerciseDeepDive(c *gin.Context) {
	userID := c.Param("user_id")
	exID := c.Param("ex_id")

	type ChartPoint struct {
		Date   string  `json:"date"`
		Weight float64 `json:"weight"`
	}
	var points []ChartPoint

	rows, err := db.Query(`SELECT DATE(created_at), MAX(weight) FROM logs WHERE user_id = ? AND exercise_id = ? GROUP BY DATE(created_at) ORDER BY DATE(created_at) ASC`, userID, exID)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to fetch exercise data"})
		return
	}
	defer rows.Close()

	for rows.Next() {
		var p ChartPoint
		rows.Scan(&p.Date, &p.Weight)
		points = append(points, p)
	}

	c.JSON(200, points)
}

// --- SETTINGS MANAGEMENT ---
func ClearOwnLogs(c *gin.Context) {
	userID := c.Param("user_id")
	_, err := db.Exec("DELETE FROM logs WHERE user_id = ?", userID)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to clear history"})
		return
	}
	c.JSON(200, gin.H{"status": "cleared"})
}

func DeleteOwnAccount(c *gin.Context) {
	userID := c.Param("user_id")
	_, err := db.Exec("DELETE FROM users WHERE id = ?", userID)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to delete account"})
		return
	}
	c.JSON(200, gin.H{"status": "deleted"})
}

func UpdatePlanName(c *gin.Context) {
	planID := c.Param("id")
	var input struct {
		Name string `json:"name"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": "Invalid input"})
		return
	}
	_, err := db.Exec("UPDATE plans SET name = ? WHERE id = ?", input.Name, planID)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to update plan"})
		return
	}
	c.JSON(200, gin.H{"status": "updated"})
}

func DeletePlanExercises(c *gin.Context) {
	planID := c.Param("plan_id")
	_, err := db.Exec("DELETE FROM plan_exercises WHERE plan_id = ?", planID)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to clear old exercises"})
		return
	}
	c.JSON(200, gin.H{"status": "cleared"})
}
