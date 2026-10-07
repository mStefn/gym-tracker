import { create } from 'zustand';

interface WorkoutState {
  isActive: boolean;       // Czy trening aktualnie trwa?
  startTime: Date | null;  // Kiedy się zaczął (do stopera)
  templateName: string;    // Nazwa (np. "Pusty trening" albo "Push Day")
  
  // Akcje
  startWorkout: (templateName?: string) => void;
  finishWorkout: () => void;
  cancelWorkout: () => void;
}

export const useWorkoutStore = create<WorkoutState>((set) => ({
  isActive: false,
  startTime: null,
  templateName: '',

  startWorkout: (templateName = 'Pusty trening') => set({ 
    isActive: true, 
    startTime: new Date(),
    templateName 
  }),
  
  finishWorkout: () => set({ 
    isActive: false, 
    startTime: null,
    templateName: '' 
    // Tutaj w przyszłości dodamy wysyłanie danych do API (Zapisz trening)
  }),
  
  cancelWorkout: () => set({ 
    isActive: false, 
    startTime: null,
    templateName: '' 
  }),
}));