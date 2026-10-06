import { useState } from 'react';
const styles: Record<string, string> = {};
import { EXERCISE_SCHEMA, ExerciseDefinition } from '../../constants/exerciseSchema';
import { authFetch, API_URL } from '../../api/client';

interface ExerciseWizardProps {
  onClose: () => void;
  onComplete: (exercise: any) => void;
}

export function ExerciseWizard({ onClose, onComplete }: ExerciseWizardProps) {
  // Stan aplikacji - zarządza krokami i wyborami użytkownika
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [category, setCategory] = useState<string | null>(null);
  const [baseExercise, setBaseExercise] = useState<ExerciseDefinition | null>(null);
  
  const [equipment, setEquipment] = useState<string>('');
  const [angle, setAngle] = useState<string>('');
  const [variant, setVariant] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // KROK 1: Wybór kategorii
  const handleCategorySelect = (cat: string) => {
    setCategory(cat);
    setStep(2);
  };

  // KROK 2: Wybór ćwiczenia
  const handleBaseExerciseSelect = (ex: ExerciseDefinition) => {
    setBaseExercise(ex);
    
    const hasOptions = (ex.equipment?.length) || (ex.angles?.length) || (ex.variants?.length);
    
    if (!hasOptions) {
      // Jeśli brak opcji (np. Push-Up), od razu zapisujemy
      submitExercise(ex.name, ex.category);
    } else {
      // Ustawiamy domyślne opcje na pierwsze z listy i przechodzimy do kroku 3
      setEquipment(ex.equipment?.[0] || '');
      setAngle(ex.angles?.[0] || '');
      setVariant(ex.variants?.[0] || '');
      setStep(3);
    }
  };

  // Generator finalnej nazwy (np. "Incline Barbell Bench Press")
  const buildFinalName = (ex: ExerciseDefinition = baseExercise!) => {
    const parts = [];
    if (angle && angle !== 'Flat') parts.push(angle);
    if (equipment && equipment !== 'Bodyweight') parts.push(equipment);
    parts.push(ex.name);
    if (variant && variant !== 'Standard') parts.push(`- ${variant}`);
    return parts.join(' ').replace(/\s+/g, ' ').trim();
  };

  // Zapis do API
  const submitExercise = async (name: string = buildFinalName(), cat: string = category!) => {
    setIsSubmitting(true);
    try {
      const res = await authFetch(`${API_URL}/exercises/find-or-create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category: cat })
      });
      
      if (!res.ok) throw new Error('Backend Sync Failed');
      const data = await res.json();
      
      onComplete(data);
    } catch (error) {
      console.error('Wizard Sync Error:', error);
      alert('Connection error. Could not sync exercise with server.');
      setIsSubmitting(false);
    }
  };

  // Zmienne pomocnicze do renderowania
  const categories = [...new Set(EXERCISE_SCHEMA.map(e => e.category))];
  const exercisesForCategory = EXERCISE_SCHEMA.filter(e => e.category === category);

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        
        {/* Nagłówek Modalny */}
        <div className={styles.header}>
          {step > 1 ? (
            <button className={styles.iconButton} onClick={() => setStep(step === 3 ? 2 : 1)}>←</button>
          ) : (
            <div style={{ width: 28 }} />
          )}
          
          <h3 className={styles.title}>
            {step === 1 && 'Select Muscle Group'}
            {step === 2 && category}
            {step === 3 && 'Configure'}
          </h3>
          
          <button className={styles.iconButton} onClick={onClose}>&times;</button>
        </div>

        {/* Ciało Modalne */}
        <div className={styles.body}>
          {step === 1 && (
            <div className={styles.tileGrid}>
              {categories.map(cat => (
                <button key={cat} className={styles.tile} onClick={() => handleCategorySelect(cat)}>
                  {cat}
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className={styles.tileGrid}>
              {exercisesForCategory.map(ex => (
                <button key={ex.name} className={styles.tile} onClick={() => handleBaseExerciseSelect(ex)}>
                  {ex.name}
                </button>
              ))}
            </div>
          )}

          {step === 3 && baseExercise && (
            <div className={styles.configContainer}>
              <h2 className={styles.configTitle}>{baseExercise.name}</h2>
              
              {baseExercise.equipment && (
                <div className={styles.inputGroup}>
                  <label className={styles.fieldLabel}>Equipment</label>
                  <div className={styles.tileGrid}>
                    {baseExercise.equipment.map(eq => (
                      <button key={eq} className={`${styles.tile} ${equipment === eq ? styles.activeTile : ''}`} onClick={() => setEquipment(eq)}>
                        {eq}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {baseExercise.angles && (
                <div className={styles.inputGroup}>
                  <label className={styles.fieldLabel}>Angle</label>
                  <div className={styles.tileGrid}>
                    {baseExercise.angles.map(ang => (
                      <button key={ang} className={`${styles.tile} ${angle === ang ? styles.activeTile : ''}`} onClick={() => setAngle(ang)}>
                        {ang}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.previewCard}>
                <div className={styles.fieldLabel}>FINAL NAME</div>
                <div className={styles.finalName}>{buildFinalName()}</div>
              </div>
            </div>
          )}
        </div>

        {/* Stopka (Tylko w Kroku 3) */}
        {step === 3 && (
          <div className={styles.footer}>
            <button 
              className={styles.saveBtn} 
              onClick={() => submitExercise()} 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Syncing...' : 'Confirm & Add'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}