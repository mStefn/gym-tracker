# Gym Tracker backend refactor

This bundle replaces the monolithic `handlers.go` with domain-based files and adds active workout sessions.

## Files

- `main.go` - routing and application startup
- `database.go` - PostgreSQL connection, schema and migrations
- `types.go` - small shared JSON compatibility type
- `handlers_auth.go` - login, signup, PIN change
- `handlers_plans.go` - workout plans and plan exercises
- `handlers_exercises.go` - exercise lookup/creation
- `handlers_workout.go` - active workout/session logic
- `handlers_dashboard.go` - dashboard, body weight and basic stats
- `handlers_stats.go` - advanced stats and exercise charts
- `handlers_account.go` - account/admin actions

Keep the existing `auth.go` because it was not included in the supplied handlers and contains the project's JWT/authentication implementation.

## Workout model

A workout is a session. A plan is only a template.

- Starting from a plan copies its exercises into a new session.
- Starting without a plan creates a temporary session with no plan reference.
- Completed sets are stored in `workout_sets` and in the existing `logs` history.
- Re-saving the same set updates it instead of creating duplicate history/XP.
- `user_exercise_targets` stores the next target for each user/exercise/set.
- The previous result shown in a new workout is limited to logs from before that session started.
- Deleting a plan does not delete completed workout history because sessions copy plan exercises.

## Main workout endpoints

- `POST /workouts` - start workout; body can contain `plan_id` and optional `name`
- `GET /workouts/active` - load the user's active workout
- `GET /workouts/:id` - load a specific workout
- `POST /workouts/:id/exercises` - add exercise to an active workout
- `DELETE /workouts/:id/exercises/:session_exercise_id` - remove exercise
- `POST /workouts/:id/sets` - save/update a set and optional next target
- `POST /workouts/:id/finish` - complete workout
- `POST /workouts/:id/cancel` - cancel active workout

## Set payload

```json
{
  "session_exercise_id": 12,
  "set_number": 1,
  "reps": 8,
  "weight": 80,
  "is_failure": false,
  "next_target_reps": 9,
  "next_target_weight": 82.5
}
```

`next_target_reps` and `next_target_weight` are optional. When omitted, the previous target is preserved.
