export type WorkoutEntry = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  day: string;
  date: string;
  weight: number;
  sets: number;
  reps: number;
};

export type Exercise = {
  id: string;
  name: string;
  category: string;
};

export type Meal = {
  id: string;
  name: string;
  category: string;
  calories: number;
  protein: number;
  ingredients?: string;
};

export type MealEntry = {
  id: string;
  mealId: string;
  mealName: string;
  day: string;
  date: string;
  calories: number;
  protein: number;
};

export type BodyWeightEntry = {
  id: string;
  date: string;
  weight: number;
};

export const weekDays = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
  'Dimanche',
];

export const exercises: Exercise[] = [
  { id: 'bench-press', name: 'Developpe couche', category: 'Pectoraux' },
  { id: 'push-up', name: 'Pompes', category: 'Pectoraux' },
  { id: 'squat', name: 'Squat', category: 'Jambes' },
  { id: 'lunge', name: 'Fentes', category: 'Jambes' },
  { id: 'deadlift', name: 'Souleve de terre', category: 'Dos' },
  { id: 'pull-up', name: 'Tractions', category: 'Dos' },
  { id: 'shoulder-press', name: 'Developpe militaire', category: 'Epaules' },
  { id: 'lateral-raise', name: 'Elevations laterales', category: 'Epaules' },
  { id: 'curl', name: 'Curl biceps', category: 'Bras' },
  { id: 'triceps-extension', name: 'Extension triceps', category: 'Bras' },
  { id: 'calf-raise', name: 'Mollets debout', category: 'Mollets' },
  { id: 'plank', name: 'Gainage', category: 'Abdos' },
  { id: 'crunch', name: 'Crunch', category: 'Abdos' },
  { id: 'neck-flexion', name: 'Flexion du cou', category: 'Cou' },
  { id: 'hip-thrust', name: 'Hip thrust', category: 'Fessiers' },
];

export const currentWeekEntries: WorkoutEntry[] = [];

export const workoutHistory: WorkoutEntry[] = [];

export const meals: Meal[] = [
  { id: 'chicken-rice', name: 'Poulet riz', category: 'Dejeuner', calories: 620, protein: 42 },
  { id: 'oatmeal', name: 'Porridge', category: 'Petit dejeuner', calories: 430, protein: 18 },
  { id: 'salmon-pasta', name: 'Saumon pates', category: 'Diner', calories: 710, protein: 38 },
  { id: 'protein-yogurt', name: 'Yaourt proteine', category: 'Collation', calories: 260, protein: 24 },
  { id: 'omelette', name: 'Omelette', category: 'Repas rapide', calories: 390, protein: 28 },
  { id: 'banana-shake', name: 'Shake banane', category: 'Collation', calories: 340, protein: 22 },
  { id: 'mass-gainer-shaker', name: 'Shaker mass gainer', category: 'Collation', calories: 1500, protein: 50 },
  { id: 'protein-shaker', name: 'Shaker proteine', category: 'Collation', calories: 300, protein: 75 },
];

export const profile = {
  firstName: 'Theo',
  height: 174,
  currentWeight: 54,
};

export const bodyWeightHistory: BodyWeightEntry[] = [
  { id: 'w1', date: '2026-02-01', weight: 48 },
  { id: 'w2', date: '2026-03-01', weight: 50 },
  { id: 'w3', date: '2026-05-01', weight: 52 },
  { id: 'w4', date: '2026-06-01', weight: 54 },
];
