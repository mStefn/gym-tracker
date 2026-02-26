package main

// User represents the gym-goer profile
type User struct {
	ID     int    `json:"id"`
	Name   string `json:"name"`
	Pin    string `json:"pin"`
	HasPin bool   `json:"has_pin"`
}

// WorkoutPlan represents a routine assigned to a user
type WorkoutPlan struct {
	ID     int    `json:"id"`
	UserID int    `json:"user_id"`
	Name   string `json:"name"`
}

// Exercise represents a movement in the database
type Exercise struct {
	ID         int    `json:"id"`
	Name       string `json:"name"`
	TargetSets int    `json:"sets"`
}

// Log represents a single recorded set
type Log struct {
	ID         int     `json:"id"`
	UserID     int     `json:"user_id"`
	ExerciseID int     `json:"exercise_id"`
	SetNumber  int     `json:"set_number"`
	Reps       int     `json:"reps"`
	Weight     float64 `json:"weight"`
}
