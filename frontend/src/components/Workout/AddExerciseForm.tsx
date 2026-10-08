import { useEffect, useState } from 'react';

import { authFetch, API_URL } from '../../api/client';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { useWorkoutStore } from '../../store/useWorkoutStore';

interface ExerciseOption {
  id: number;
  name: string;
  category: string;
}

interface Props {
  onClose: () => void;
}

export default function AddExerciseForm({ onClose }: Props) {
  const { addExercise, isLoading } = useWorkoutStore();

  const [exercises, setExercises] = useState<ExerciseOption[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [targetSets, setTargetSets] = useState('3');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadExercises = async () => {
      try {
        const response = await authFetch(`${API_URL}/exercises`);

        if (!response.ok) {
          throw new Error('Failed to load exercises.');
        }

        setExercises(await response.json());
      } catch (err) {
        console.error('Exercise loading error:', err);
        setError('Could not load exercises.');
      }
    };

    loadExercises();
  }, []);

  const handleAdd = async () => {
    const exercise = exercises.find(
      (item) => String(item.id) === selectedExerciseId
    );

    const sets = Number(targetSets);

    if (!exercise) {
      setError('Select an exercise.');
      return;
    }

    if (!Number.isInteger(sets) || sets < 1) {
      setError('Enter at least 1 set.');
      return;
    }

    setError(null);

    const success = await addExercise({
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      category: exercise.category,
      targetSets: sets,
    });

    if (success) {
      onClose();
    }
  };

  return (
    <Card className="p-5">
      <div className="mb-5">
        <h2 className="text-lg font-black text-foreground">
          Add Exercise
        </h2>

        <p className="mt-1 text-sm text-muted">
          Add an exercise to this workout.
        </p>
      </div>

      {error && (
        <div className="mb-4 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label
            htmlFor="workout-exercise"
            className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-subtle"
          >
            Exercise
          </label>

          <select
            id="workout-exercise"
            value={selectedExerciseId}
            onChange={(event) =>
              setSelectedExerciseId(event.target.value)
            }
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm font-bold text-foreground outline-none focus:border-accent"
          >
            <option value="">Select exercise</option>

            {exercises.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name} — {exercise.category}
              </option>
            ))}
          </select>
        </div>

        <div className="max-w-xs">
          <Input
            label="Target Sets"
            type="number"
            min="1"
            step="1"
            value={targetSets}
            onChange={(event) =>
              setTargetSets(event.target.value)
            }
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>

          <Button
            onClick={handleAdd}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Add Exercise
          </Button>
        </div>
      </div>
    </Card>
  );
}