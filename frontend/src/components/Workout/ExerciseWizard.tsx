import { useState } from 'react';
import {
  EXERCISE_SCHEMA,
  type ExerciseDefinition,
} from '../../constants/exerciseSchema';
import { authFetch, API_URL } from '../../api/client';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface ExerciseWizardProps {
  onClose: () => void;
  onComplete: (exercise: any) => void;
}

export function ExerciseWizard({
  onClose,
  onComplete,
}: ExerciseWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [category, setCategory] = useState<string | null>(null);
  const [baseExercise, setBaseExercise] =
    useState<ExerciseDefinition | null>(null);

  const [equipment, setEquipment] = useState('');
  const [angle, setAngle] = useState('');
  const [variant, setVariant] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCategorySelect = (selectedCategory: string) => {
    setCategory(selectedCategory);
    setStep(2);
  };

  const handleBaseExerciseSelect = (exercise: ExerciseDefinition) => {
    setBaseExercise(exercise);

    const hasOptions =
      Boolean(exercise.equipment?.length) ||
      Boolean(exercise.angles?.length) ||
      Boolean(exercise.variants?.length);

    if (!hasOptions) {
      submitExercise(exercise.name, exercise.category);
      return;
    }

    setEquipment(exercise.equipment?.[0] || '');
    setAngle(exercise.angles?.[0] || '');
    setVariant(exercise.variants?.[0] || '');
    setStep(3);
  };

  const buildFinalName = (
    exercise: ExerciseDefinition = baseExercise!
  ) => {
    const parts: string[] = [];

    if (angle && angle !== 'Flat') {
      parts.push(angle);
    }

    if (equipment && equipment !== 'Bodyweight') {
      parts.push(equipment);
    }

    parts.push(exercise.name);

    if (variant && variant !== 'Standard') {
      parts.push(`- ${variant}`);
    }

    return parts.join(' ').replace(/\s+/g, ' ').trim();
  };

  const submitExercise = async (
    name: string = buildFinalName(),
    cat: string = category!
  ) => {
    setIsSubmitting(true);

    try {
      const response = await authFetch(
        `${API_URL}/exercises/find-or-create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            category: cat,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Backend synchronization failed.');
      }

      const data = await response.json();
      onComplete(data);
    } catch (error) {
      console.error('Wizard sync error:', error);
      alert(
        'Connection error. Could not sync exercise with server.'
      );
      setIsSubmitting(false);
    }
  };

  const categories = [
    ...new Set(EXERCISE_SCHEMA.map((exercise) => exercise.category)),
  ];

  const exercisesForCategory = EXERCISE_SCHEMA.filter(
    (exercise) => exercise.category === category
  );

  const tileBase =
    'w-full rounded-xl border p-4 text-left font-bold transition-all';

  const tileInactive =
    'border-border bg-surface/50 text-muted hover:border-accent/50 hover:bg-surface';

  const tileActive =
    'border-accent bg-accent/10 text-accent shadow-glow';

  const goBack = () => {
    if (step === 3) {
      setStep(2);
      return;
    }

    setStep(1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-md">
      <Card className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-border/60 bg-background/50 p-5">
          {step > 1 ? (
            <button
              type="button"
              onClick={goBack}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
            >
              ←
            </button>
          ) : (
            <div className="w-8" />
          )}

          <h3 className="text-lg font-black uppercase tracking-widest text-foreground">
            {step === 1 && 'Choose Muscle Group'}
            {step === 2 && category}
            {step === 3 && 'Configure Exercise'}
          </h3>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-xl text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
          >
            &times;
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-5">
          {step === 1 && (
            <div className="grid grid-cols-2 gap-3">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`${tileBase} ${tileInactive}`}
                  onClick={() => handleCategorySelect(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-3">
              {exercisesForCategory.map((exercise) => (
                <button
                  key={exercise.name}
                  type="button"
                  className={`${tileBase} ${tileInactive}`}
                  onClick={() => handleBaseExerciseSelect(exercise)}
                >
                  {exercise.name}
                </button>
              ))}
            </div>
          )}

          {step === 3 && baseExercise && (
            <div className="space-y-6">
              <h2 className="text-center text-2xl font-black text-accent">
                {baseExercise.name}
              </h2>

              {baseExercise.equipment?.length ? (
                <div>
                  <label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-muted">
                    Equipment
                  </label>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {baseExercise.equipment.map((item) => (
                      <button
                        key={item}
                        type="button"
                        className={`${tileBase} ${
                          equipment === item
                            ? tileActive
                            : tileInactive
                        } !p-3 !text-sm`}
                        onClick={() => setEquipment(item)}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {baseExercise.angles?.length ? (
                <div>
                  <label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-muted">
                    Angle / Bench
                  </label>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {baseExercise.angles.map((item) => (
                      <button
                        key={item}
                        type="button"
                        className={`${tileBase} ${
                          angle === item
                            ? tileActive
                            : tileInactive
                        } !p-3 !text-sm`}
                        onClick={() => setAngle(item)}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {baseExercise.variants?.length ? (
                <div>
                  <label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-muted">
                    Variant
                  </label>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {baseExercise.variants.map((item) => (
                      <button
                        key={item}
                        type="button"
                        className={`${tileBase} ${
                          variant === item
                            ? tileActive
                            : tileInactive
                        } !p-3 !text-sm`}
                        onClick={() => setVariant(item)}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="rounded-xl border-2 border-dashed border-border/60 bg-background/30 p-4 text-center">
                <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-subtle">
                  Final Exercise Name
                </div>

                <div className="text-lg font-black text-foreground">
                  {buildFinalName()}
                </div>
              </div>
            </div>
          )}
        </div>

        {step === 3 && (
          <div className="shrink-0 border-t border-border/60 bg-background/50 p-5">
            <Button
              onClick={() => submitExercise()}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Confirm & Add Exercise'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}