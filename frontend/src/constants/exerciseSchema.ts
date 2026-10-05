export interface ExerciseDefinition {
  name: string;
  category: string;
  equipment?: string[];
  angles?: string[];
  variants?: string[];
}

export const EXERCISE_SCHEMA: ExerciseDefinition[] = [
  { name: "Bench Press", category: "Chest", equipment: ["Barbell", "Dumbbell", "Machine"], angles: ["Flat", "Incline", "Decline"] },
  // ... reszta Twojej tablicy
];