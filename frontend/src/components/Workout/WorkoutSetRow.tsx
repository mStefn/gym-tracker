import { useEffect, useState } from 'react';

import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useWorkoutStore } from '../../store/useWorkoutStore';

interface Props {
  sessionExerciseId: number;
  set: {
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
  };
}

function display(value: number | null) {
  if (value === null) {
    return '-';
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export default function WorkoutSetRow({
  sessionExerciseId,
  set,
}: Props) {
  const { saveSet } = useWorkoutStore();

  const [reps, setReps] = useState(
    set.reps > 0 ? String(set.reps) : ''
  );

  const [weight, setWeight] = useState(
    set.weight > 0 ? String(set.weight) : ''
  );

  const [isFailure, setIsFailure] = useState(set.is_failure);

  const [nextTargetReps, setNextTargetReps] = useState(
    set.next_target?.reps !== null &&
      set.next_target?.reps !== undefined
      ? String(set.next_target.reps)
      : ''
  );

  const [nextTargetWeight, setNextTargetWeight] = useState(
    set.next_target?.weight !== null &&
      set.next_target?.weight !== undefined
      ? String(set.next_target.weight)
      : ''
  );

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setReps(set.reps > 0 ? String(set.reps) : '');
    setWeight(set.weight > 0 ? String(set.weight) : '');
    setIsFailure(set.is_failure);

    setNextTargetReps(
      set.next_target?.reps !== null &&
        set.next_target?.reps !== undefined
        ? String(set.next_target.reps)
        : ''
    );

    setNextTargetWeight(
      set.next_target?.weight !== null &&
        set.next_target?.weight !== undefined
        ? String(set.next_target.weight)
        : ''
    );
  }, [set.completed_at]);

  const handleSave = async () => {
    const repsValue = Number(reps);
    const weightValue = Number(weight);

    if (!Number.isFinite(repsValue) || repsValue < 0) {
      return;
    }

    if (!Number.isFinite(weightValue) || weightValue < 0) {
      return;
    }

    const targetReps =
      nextTargetReps.trim() === ''
        ? null
        : Number(nextTargetReps);

    const targetWeight =
      nextTargetWeight.trim() === ''
        ? null
        : Number(nextTargetWeight);

    if (
      targetReps !== null &&
      (!Number.isFinite(targetReps) || targetReps < 0)
    ) {
      return;
    }

    if (
      targetWeight !== null &&
      (!Number.isFinite(targetWeight) || targetWeight < 0)
    ) {
      return;
    }

    setIsSaving(true);

    await saveSet({
      sessionExerciseId,
      setNumber: set.set_number,
      reps: repsValue,
      weight: weightValue,
      isFailure,
      nextTargetReps: targetReps,
      nextTargetWeight: targetWeight,
    });

    setIsSaving(false);
  };

  return (
    <div className="space-y-4 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-muted text-sm font-black text-foreground">
            {set.set_number}
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-subtle">
              Set {set.set_number}
            </p>

            {set.completed_at && (
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-accent">
                Saved
              </p>
            )}
          </div>
        </div>

        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest text-subtle">
            Previous
          </p>

          <p className="mt-1 text-sm font-bold text-foreground">
            {display(set.previous.reps)} reps
            <span className="px-1 text-subtle">×</span>
            {display(set.previous.weight)} kg
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background/50 p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-subtle">
          Current Target
        </p>

        <p className="mt-1 text-sm font-bold text-foreground">
          {display(set.target.reps)} reps
          <span className="px-1 text-subtle">×</span>
          {display(set.target.weight)} kg
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Reps"
          type="number"
          min="0"
          step="1"
          inputMode="numeric"
          value={reps}
          onChange={(event) => setReps(event.target.value)}
        />

        <Input
          label="Weight (kg)"
          type="number"
          min="0"
          step="0.5"
          inputMode="decimal"
          value={weight}
          onChange={(event) => setWeight(event.target.value)}
        />
      </div>

      <label className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-muted">
        <input
          type="checkbox"
          checked={isFailure}
          onChange={(event) => setIsFailure(event.target.checked)}
          className="h-4 w-4 accent-accent"
        />

        Set to failure
      </label>

      <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-accent">
          Next Session Target
        </p>

        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Input
            label="Target Reps"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={nextTargetReps}
            onChange={(event) =>
              setNextTargetReps(event.target.value)
            }
            placeholder="Optional"
          />

          <Input
            label="Target Weight (kg)"
            type="number"
            min="0"
            step="0.5"
            inputMode="decimal"
            value={nextTargetWeight}
            onChange={(event) =>
              setNextTargetWeight(event.target.value)
            }
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full sm:w-auto"
        >
          {isSaving
            ? 'Saving...'
            : set.completed_at
              ? 'Update Set'
              : 'Save Set'}
        </Button>
      </div>
    </div>
  );
}