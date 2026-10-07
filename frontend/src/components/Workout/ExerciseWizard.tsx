import { useState } from 'react';
import { EXERCISE_SCHEMA, ExerciseDefinition } from '../../constants/exerciseSchema';
import { authFetch, API_URL } from '../../api/client';
import { theme } from '../../constants/theme';
import { Button } from '../ui/Button';

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

  // Bazowe klasy dla kafelków wyboru
  const tileBase = "p-4 rounded-xl border font-bold transition-all text-left w-full";
  const tileInactive = "bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:border-[#ccff00]/50 hover:bg-zinc-800";
  const tileActive = `bg-[#ccff00]/10 border-[#ccff00] ${theme.text.accent} ${theme.fx.glowLime}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`${theme.bg.card} w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-2xl`}>
        
        {/* Nagłówek Modalny */}
        <div className="flex justify-between items-center p-5 border-b border-zinc-800/60 shrink-0 bg-zinc-950/50">
          {step > 1 ? (
            <button 
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-800 text-zinc-400 transition-colors" 
              onClick={() => setStep(step === 3 ? 2 : 1)}
            >
              ←
            </button>
          ) : (
            <div className="w-8" />
          )}
          
          <h3 className="m-0 text-lg font-black uppercase tracking-widest text-white">
            {step === 1 && 'Wybierz partię'}
            {step === 2 && category}
            {step === 3 && 'Konfiguracja'}
          </h3>
          
          <button 
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-800 text-zinc-400 transition-colors text-xl" 
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        {/* Ciało Modalne */}
        <div className="p-5 overflow-y-auto flex-grow custom-scrollbar">
          
          {step === 1 && (
            <div className="grid grid-cols-2 gap-3">
              {categories.map(cat => (
                <button key={cat} className={`${tileBase} ${tileInactive}`} onClick={() => handleCategorySelect(cat)}>
                  {cat}
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-3">
              {exercisesForCategory.map(ex => (
                <button key={ex.name} className={`${tileBase} ${tileInactive}`} onClick={() => handleBaseExerciseSelect(ex)}>
                  {ex.name}
                </button>
              ))}
            </div>
          )}

          {step === 3 && baseExercise && (
            <div className="space-y-6">
              <h2 className={`text-2xl font-black text-center ${theme.text.accent}`}>{baseExercise.name}</h2>
              
              {baseExercise.equipment && (
                <div>
                  <label className={theme.input.label}>Sprzęt</label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {baseExercise.equipment.map(eq => (
                      <button 
                        key={eq} 
                        className={`${tileBase} ${equipment === eq ? tileActive : tileInactive} !p-3 !text-sm`} 
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
                  <label className={theme.input.label}>Kąt / Ławka</label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {baseExercise.angles.map(ang => (
                      <button 
                        key={ang} 
                        className={`${tileBase} ${angle === ang ? tileActive : tileInactive} !p-3 !text-sm`} 
                        onClick={() => setAngle(ang)}
                      >
                        {ang}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 p-4 border-2 border-dashed border-zinc-800/60 rounded-xl text-center bg-zinc-950/30">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Finalna nazwa ćwiczenia</div>
                <div className="text-lg font-black text-white">{buildFinalName()}</div>
              </div>
            </div>
          )}
        </div>

        {/* Stopka (Tylko w Kroku 3) */}
        {step === 3 && (
          <div className="p-5 border-t border-zinc-800/60 shrink-0 bg-zinc-950/50">
            <Button 
              className="w-full" 
              onClick={() => submitExercise()} 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Zapisywanie...' : 'Zatwierdź i Dodaj'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}