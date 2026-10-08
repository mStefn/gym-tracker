import { create } from 'zustand';
import { authFetch, API_URL } from '../api/client';

export interface WorkoutSet {
  set_number: number;
  reps: number;
  weight: number;
  is_failure: boolean;
  completed_at: string | null;
  previous: {
    reps: number | null;
    weight: number | null;
    is_failure: boolean;
  };
  target: {
    reps: number | null;
    weight: number | null;
  };
  next_target: {
    reps: number | null;
    weight: number | null;
  } | null;
}

export interface WorkoutExercise {
  id: number;
  exercise_id: number;
  exercise_name: string;
  category: string;
  target_sets: number;
  position: number;
  sets: WorkoutSet[];
}

export interface WorkoutSession {
  id: number;
  name: string;
  plan_id: number | null;
  status: 'active' | 'completed' | 'cancelled';
  started_at: string;
  completed_at: string | null;
  exercises: WorkoutExercise[];
}

interface StartWorkoutInput {
  planId?: number;
  name?: string;
}

interface AddExerciseInput {
  exerciseId?: number;
  exerciseName: string;
  category: string;
  targetSets: number;
}

interface SaveSetInput {
  sessionExerciseId: number;
  setNumber: number;
  reps: number;
  weight: number;
  isFailure: boolean;
  nextTargetReps: number | null;
  nextTargetWeight: number | null;
}

interface WorkoutState {
  workout: WorkoutSession | null;
  isRestoring: boolean;
  isLoading: boolean;
  error: string | null;

  startWorkout: (input: StartWorkoutInput) => Promise<boolean>;
  restoreActiveWorkout: () => Promise<void>;
  refreshWorkout: () => Promise<void>;

  addExercise: (input: AddExerciseInput) => Promise<boolean>;
  removeExercise: (sessionExerciseId: number) => Promise<boolean>;
  saveSet: (input: SaveSetInput) => Promise<boolean>;

  finishWorkout: () => Promise<boolean>;
  cancelWorkout: () => Promise<boolean>;

  clearError: () => void;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  workout: null,
  isRestoring: false,
  isLoading: false,
  error: null,

  startWorkout: async ({ planId, name }) => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const response = await authFetch(`${API_URL}/workouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_id: planId ?? null,
          name: name ?? '',
        }),
      });

      if (!response.ok) {
        if (response.status === 409) {
          await get().restoreActiveWorkout();
        }

        let message = 'Failed to start workout.';

        try {
          const data = await response.json();

          if (typeof data.error === 'string') {
            message = data.error;
          }
        } catch {
          // Ignore invalid error response.
        }

        set({
          error: message,
          isLoading: false,
        });

        return false;
      }

      const data = (await response.json()) as WorkoutSession;

      set({
        workout: data,
        isLoading: false,
        error: null,
      });

      await get().refreshWorkout();

      return true;
    } catch (err) {
      console.error('Workout start error:', err);

      set({
        isLoading: false,
        error: 'Could not start workout.',
      });

      return false;
    }
  },

  restoreActiveWorkout: async () => {
    set({
      isRestoring: true,
      error: null,
    });

    try {
      const response = await authFetch(`${API_URL}/workouts/active`);

      if (!response.ok) {
        throw new Error('Failed to load active workout.');
      }

      const data = await response.json();

      set({
        workout: data.workout ?? data,
        isRestoring: false,
        error: null,
      });
    } catch (err) {
      console.error('Active workout loading error:', err);

      set({
        workout: null,
        isRestoring: false,
        error: 'Could not restore active workout.',
      });
    }
  },

  refreshWorkout: async () => {
    const workout = get().workout;

    if (!workout?.id) {
      return;
    }

    try {
      const response = await authFetch(
        `${API_URL}/workouts/${workout.id}`
      );

      if (!response.ok) {
        throw new Error('Failed to refresh workout.');
      }

      const data = (await response.json()) as WorkoutSession;

      set({
        workout: data,
      });
    } catch (err) {
      console.error('Workout refresh error:', err);

      set({
        error: 'Could not refresh workout.',
      });
    }
  },

  addExercise: async ({
    exerciseId,
    exerciseName,
    category,
    targetSets,
  }) => {
    const workout = get().workout;

    if (!workout) {
      set({ error: 'No active workout.' });
      return false;
    }

    set({
      isLoading: true,
      error: null,
    });

    try {
      const response = await authFetch(
        `${API_URL}/workouts/${workout.id}/exercises`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            exercise_id: exerciseId ?? 0,
            exercise_name: exerciseName,
            category,
            target_sets: targetSets,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to add exercise.');
      }

      await get().refreshWorkout();

      set({
        isLoading: false,
        error: null,
      });

      return true;
    } catch (err) {
      console.error('Workout exercise add error:', err);

      set({
        isLoading: false,
        error: 'Could not add exercise.',
      });

      return false;
    }
  },

  removeExercise: async (sessionExerciseId) => {
    const workout = get().workout;

    if (!workout) {
      set({ error: 'No active workout.' });
      return false;
    }

    set({
      isLoading: true,
      error: null,
    });

    try {
      const response = await authFetch(
        `${API_URL}/workouts/${workout.id}/exercises/${sessionExerciseId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to remove exercise.');
      }

      await get().refreshWorkout();

      set({
        isLoading: false,
        error: null,
      });

      return true;
    } catch (err) {
      console.error('Workout exercise removal error:', err);

      set({
        isLoading: false,
        error: 'Could not remove exercise.',
      });

      return false;
    }
  },

  saveSet: async ({
    sessionExerciseId,
    setNumber,
    reps,
    weight,
    isFailure,
    nextTargetReps,
    nextTargetWeight,
  }) => {
    const workout = get().workout;

    if (!workout) {
      set({ error: 'No active workout.' });
      return false;
    }

    try {
      const response = await authFetch(
        `${API_URL}/workouts/${workout.id}/sets`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_exercise_id: sessionExerciseId,
            set_number: setNumber,
            reps,
            weight,
            is_failure: isFailure,
            next_target_reps: nextTargetReps,
            next_target_weight: nextTargetWeight,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save set.');
      }

      await get().refreshWorkout();

      return true;
    } catch (err) {
      console.error('Workout set save error:', err);

      set({
        error: 'Could not save set.',
      });

      return false;
    }
  },

  finishWorkout: async () => {
    const workout = get().workout;

    if (!workout) {
      return false;
    }

    set({
      isLoading: true,
      error: null,
    });

    try {
      const response = await authFetch(
        `${API_URL}/workouts/${workout.id}/finish`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to finish workout.');
      }

      set({
        workout: null,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (err) {
      console.error('Workout finish error:', err);

      set({
        isLoading: false,
        error: 'Could not finish workout.',
      });

      return false;
    }
  },

  cancelWorkout: async () => {
    const workout = get().workout;

    if (!workout) {
      return false;
    }

    set({
      isLoading: true,
      error: null,
    });

    try {
      const response = await authFetch(
        `${API_URL}/workouts/${workout.id}/cancel`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to cancel workout.');
      }

      set({
        workout: null,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (err) {
      console.error('Workout cancellation error:', err);

      set({
        isLoading: false,
        error: 'Could not cancel workout.',
      });

      return false;
    }
  },

  clearError: () => {
    set({
      error: null,
    });
  },
}));