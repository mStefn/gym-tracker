import { useState } from 'react';
import {
  EXERCISE_SCHEMA,
  ExerciseDefinition,
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

  const [equipment, setEquipment] = useState<string>('');
  const [angle, setAngle] = useState<string>('');
  const [variant, setVariant] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCategorySelect = (cat: string) => {
    setCategory(cat);
    setStep(2);
  };

  const handleBaseExerciseSelect = (ex: ExerciseDefinition) => {
    setBaseExercise(ex);

    const hasOptions =
      ex.equipment?.length ||
      ex.angles?.length ||
      ex.variants?.length;

    if (!hasOptions) {
      submitExercise(ex.name, ex.category);
    } else {
      setEquipment(ex.equipment?.[0] || '');
      setAngle(ex.angles?.[0] || '');
      setVariant(ex.variants?.[0] || '');
      setStep(3);
    }
  };

  const buildFinalName = (
    ex: ExerciseDefinition = baseExercise!
  ) => {
    const parts = [];

    if (angle && angle !== 'Flat') {
      parts.push(angle);
    }

    if (equipment && equipment !== 'Bodyweight') {
      parts.push(equipment);
    }

    parts.push(ex.name);

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
      const res = await authFetch(
        `${API_URL}/exercises/find-or-create`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, category: cat }),
        }
      );

      if (!res.ok) {
        throw new Error('Backend Sync Failed');
      }

      const data = await res.json();

      onComplete(data);
    } catch (error) {
      console.error('Wizard Sync Error:', error);
      alert(
        'Connection error. Could not sync exercise with server.'
      );
      setIsSubmitting(false);
    }
  };

  const categories = [
    ...new Set(EXERCISE_SCHEMA.map((e) => e.category)),
  ];

  const exercisesForCategory = EXERCISE_SCHEMA.filter(
    (e) => e.category === category
  );

  const tileBase =
    'w-full rounded-xl border p-4 text-left font-bold transition-all';

  const tileInactive =
    'bg-surface/50 border-border text-muted hover:border-accent/50 hover:bg-surface';

  const tileActive =
    'bg-accent/10 border-accent text-accent shadow-glow';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-md">
      <Card className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden shadow-2xl">
        {/* Modal header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border/60 bg-background/50 p-5">
          {step > 1 ? (
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
              onClick={() => setStep(step === 3 ? 2 : 1)}
            >
              ←
            </button>
          ) : (
            <div className="w-8" />
          )}

          <h3 className="m-0 text-lg font-black uppercase tracking-widest text-foreground">
            {step === 1 && 'Choose Muscle Group'}
            {step === 2 && category}
            {step === 3 && 'Configuration'}
          </h3>

          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-xl text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        {/* Modal body */}
        <div className="flex-grow overflow-y-auto p-5">
          {step === 1 && (
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`${tileBase} ${tileInactive}`}
                  onClick={() => handleCategorySelect(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-3">
              {exercisesForCategory.map((ex) => (
                <button
                  key={ex.name}
                  type="button"
                  className={`${tileBase} ${tileInactive}`}
                  onClick={() => handleBaseExerciseSelect(ex)}
                >
                  {ex.name}
                </button>
              ))}
            </div>
          )}

          {step === 3 && baseExercise && (
            <div className="space-y-6">
              <h2 className="text-center text-2xl font-black text-accent">
                {baseExercise.name}
              </h2>

              {baseExercise.equipment && (
                <div>
                  <label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-muted">
                    Equipment
                  </label>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {baseExercise.equipment.map((eq) => (
                      <button
                        key={eq}
                        type="button"
                        className={`${tileBase} ${
                          equipment === eq
                            ? tileActive
                            : tileInactive
                        } !p-3 !text-sm`}
                        onClick={() => setEquipment(eq)}
                      >
                        {eq}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {baseExercise.angles && (
                <div>
                  <label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-muted">
                    Angle / Bench
                  </label>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {baseExercise.angles.map((ang) => (
                      <button
                        key={ang}
                        type="button"
                        className={`${tileBase} ${
                          angle === ang
                            ? tileActive
                            : tileInactive
                        } !p-3 !text-sm`}
                        onClick={() => setAngle(ang)}
                      >
                        {ang}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 rounded-xl border-2 border-dashed border-border/60 bg-background/30 p-4 text-center">
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

        {/* Modal footer */}
        {step === 3 && (
          <div className="shrink-0 border-t border-border/60 bg-background/50 p-5">
            <Button
              className="w-full"
              onClick={() => submitExercise()}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Saving...'
                : 'Confirm & Add Exercise'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}