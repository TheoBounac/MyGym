import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  exercises as baseExercises,
  type Exercise,
  type WorkoutEntry,
} from '@/constants/mock-data';
import { AppColors } from '@/constants/colors';
import {
  customExercisesStorageKey,
  planningStorageKey,
} from '@/constants/storage';
import { MuscleMap } from '@/components/MuscleMap';

type MuscleGroup = {
  categories: string[];
  id: string;
  label: string;
};

const muscleGroups: MuscleGroup[] = [
  { id: 'bras', label: 'Bras', categories: ['Bras'] },
  { id: 'epaules', label: 'Epaules', categories: ['Epaules'] },
  { id: 'pectoraux', label: 'Pectoraux', categories: ['Pectoraux'] },
  { id: 'dos', label: 'Dos', categories: ['Dos'] },
  { id: 'abdos', label: 'Abdos', categories: ['Abdos'] },
  { id: 'cuisses', label: 'Cuisses', categories: ['Jambes'] },
  { id: 'mollets', label: 'Mollets', categories: ['Mollets'] },
  { id: 'cou', label: 'Cou', categories: ['Cou'] },
  { id: 'fessiers', label: 'Fessiers', categories: ['Fessiers'] },
];

export default function ExercicesScreen() {
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [exerciseName, setExerciseName] = useState('');
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [newExerciseGroup, setNewExerciseGroup] = useState<MuscleGroup>(muscleGroups[0]);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutEntry[]>([]);
  const exercises = [...baseExercises, ...customExercises];

  useFocusEffect(
    useCallback(() => {
      async function loadExerciseData() {
        try {
          const [storedEntries, storedCustomExercises] = await Promise.all([
            AsyncStorage.getItem(planningStorageKey),
            AsyncStorage.getItem(customExercisesStorageKey),
          ]);

          setWorkoutHistory(storedEntries ? JSON.parse(storedEntries) : []);
          setCustomExercises(storedCustomExercises ? JSON.parse(storedCustomExercises) : []);
        } catch {
          Alert.alert('Erreur', 'Impossible de charger les exercices.');
        }
      }

      loadExerciseData();
    }, [])
  );

  const selectedHistory = selectedExercise
    ? workoutHistory.filter((entry) => entry.exerciseId === selectedExercise.id)
    : [];
  const selectedMuscleExercises = selectedMuscleGroup
    ? exercises.filter((exercise) => selectedMuscleGroup.categories.includes(exercise.category))
    : [];

  function getExerciseHistoryCount(exerciseId: string) {
    return workoutHistory.filter((entry) => entry.exerciseId === exerciseId).length;
  }

  async function createExercise() {
    const cleanName = exerciseName.trim();

    if (!cleanName) {
      Alert.alert('Nom manquant', "Entre un nom d'exercice.");
      return;
    }

    const newExercise: Exercise = {
      category: newExerciseGroup.categories[0],
      id: `custom-${Date.now()}`,
      name: cleanName,
    };
    const nextCustomExercises = [...customExercises, newExercise];

    try {
      await AsyncStorage.setItem(customExercisesStorageKey, JSON.stringify(nextCustomExercises));
      setCustomExercises(nextCustomExercises);
      setExerciseName('');
      setNewExerciseGroup(muscleGroups[0]);
      setIsCreateModalVisible(false);
      setSelectedMuscleGroup(newExerciseGroup);
    } catch {
      Alert.alert('Erreur', "Impossible d'enregistrer l'exercice.");
    }
  }

  return (
    <View style={styles.page}>
      <View style={styles.header} />

      <ScrollView contentContainerStyle={styles.content}>
        <MuscleMap
          groups={muscleGroups.map((group) => ({
            count: exercises.filter((exercise) => group.categories.includes(exercise.category)).length,
            id: group.id,
            label: group.label,
          }))}
          onSelect={(groupId) => {
            const group = muscleGroups.find((item) => item.id === groupId);

            if (group) {
              setSelectedMuscleGroup(group);
            }
          }}
        />

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.createButton}
          onPress={() => setIsCreateModalVisible(true)}>
          <Text style={styles.createButtonText}>Ajouter un exercice</Text>
        </TouchableOpacity>

      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={isCreateModalVisible}
        onRequestClose={() => setIsCreateModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setIsCreateModalVisible(false)}>
          <Pressable style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nouvel exercice</Text>
            <Text style={styles.modalMeta}>Choisis son groupe musculaire</Text>

            <TextInput
              style={styles.nameInput}
              value={exerciseName}
              onChangeText={setExerciseName}
              placeholder="Nom de l'exercice"
              placeholderTextColor={AppColors.muted}
            />

            <View style={styles.groupGrid}>
              {muscleGroups.map((group) => {
                const isSelected = newExerciseGroup.id === group.id;

                return (
                  <TouchableOpacity
                    key={group.id}
                    style={[styles.groupChoice, isSelected && styles.groupChoiceSelected]}
                    onPress={() => setNewExerciseGroup(group)}>
                    <Text style={[styles.groupChoiceText, isSelected && styles.groupChoiceTextSelected]}>
                      {group.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={createExercise}>
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeButton} onPress={() => setIsCreateModalVisible(false)}>
              <Text style={styles.closeButtonText}>Fermer</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={selectedMuscleGroup !== null && selectedExercise === null}
        onRequestClose={() => setSelectedMuscleGroup(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedMuscleGroup(null)}>
          <Pressable style={styles.modalCard}>
            <Text style={styles.modalTitle}>{selectedMuscleGroup?.label}</Text>

            <ScrollView style={styles.exercisePicker}>
              {selectedMuscleExercises.map((exercise) => (
                <TouchableOpacity
                  key={exercise.id}
                  style={styles.exerciseCard}
                  onPress={() => {
                    setSelectedMuscleGroup(null);
                    setSelectedExercise(exercise);
                  }}>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Text style={styles.exerciseCategory}>{exercise.category}</Text>
                  </View>
                  <Text style={styles.counter}>{getExerciseHistoryCount(exercise.id)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedMuscleGroup(null)}>
              <Text style={styles.closeButtonText}>Fermer</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={selectedExercise !== null}
        onRequestClose={() => setSelectedExercise(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedExercise(null)}>
          <Pressable style={styles.modalCard}>
            <Text style={styles.modalTitle}>{selectedExercise?.name}</Text>
            <Text style={styles.modalMeta}>Historique dans le calendrier</Text>

            {selectedHistory.length === 0 ? (
              <Text style={styles.emptyText}>Aucune entree pour cet exercice.</Text>
            ) : (
              selectedHistory.map((entry) => (
                <View style={styles.historyRow} key={entry.id}>
                  <View>
                    <Text style={styles.historyDate}>
                      {entry.day} - {entry.date}
                    </Text>
                    <Text style={styles.historyDetails}>
                      {entry.weight} kg - {entry.sets} series - {entry.reps} reps
                    </Text>
                  </View>
                </View>
              ))
            )}

            <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedExercise(null)}>
              <Text style={styles.closeButtonText}>Fermer</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: AppColors.planningBackground,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderBottomColor: AppColors.border,
    borderBottomWidth: 1,
    justifyContent: 'center',
    minHeight: 65,
    paddingBottom: 5,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  title: {
    color: AppColors.text,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    width: '100%',
  },
  subtitle: {
    color: AppColors.muted,
    fontSize: 14,
    marginTop: 4,
  },
  content: {
    paddingHorizontal: 10,
    paddingBottom: 12,
    paddingTop: 48,
  },
  createButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: AppColors.accent,
    borderRadius: 8,
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    width: 220,
  },
  createButtonText: {
    color: AppColors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  bodyMap: {
    alignItems: 'center',
    alignSelf: 'center',
    maxWidth: '100%',
    minHeight: 540,
    position: 'relative',
    width: 340,
  },
  bodyLines: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  pointerLine: {
    backgroundColor: AppColors.primary,
    borderRadius: 2,
    height: 2,
    opacity: 0.72,
    position: 'absolute',
  },
  lineBras: {
    left: 92,
    top: 143,
    transform: [{ rotate: '-12deg' }],
    width: 35,
  },
  lineEpaules: {
    left: 219,
    top: 114,
    transform: [{ rotate: '165deg' }],
    width: 38,
  },
  lineDos: {
    left: 92,
    top: 207,
    transform: [{ rotate: '-6deg' }],
    width: 34,
  },
  linePectoraux: {
    left: 220,
    top: 183,
    transform: [{ rotate: '172deg' }],
    width: 36,
  },
  lineAbdos: {
    left: 92,
    top: 284,
    transform: [{ rotate: '8deg' }],
    width: 40,
  },
  lineCuisses: {
    left: 220,
    top: 343,
    transform: [{ rotate: '172deg' }],
    width: 36,
  },
  lineMollets: {
    left: 92,
    top: 439,
    transform: [{ rotate: '-10deg' }],
    width: 44,
  },
  lineCou: {
    left: 220,
    top: 66,
    transform: [{ rotate: '160deg' }],
    width: 40,
  },
  lineFessiers: {
    left: 220,
    top: 285,
    transform: [{ rotate: '170deg' }],
    width: 38,
  },
  bodyFigure: {
    alignItems: 'center',
    height: 500,
    marginTop: 12,
    position: 'relative',
    width: 145,
  },
  head: {
    backgroundColor: AppColors.surface,
    borderColor: AppColors.primarySoft,
    borderRadius: 25,
    borderWidth: 2,
    height: 50,
    width: 50,
  },
  neck: {
    backgroundColor: AppColors.surface,
    height: 20,
    width: 20,
  },
  shoulderBar: {
    backgroundColor: AppColors.primary,
    borderRadius: 18,
    height: 24,
    width: 118,
  },
  torso: {
    backgroundColor: AppColors.surface,
    borderColor: AppColors.primary,
    borderRadius: 28,
    borderWidth: 2,
    height: 150,
    marginTop: -2,
    width: 88,
  },
  abs: {
    backgroundColor: AppColors.surfaceHigh,
    borderColor: AppColors.border,
    borderRadius: 18,
    borderWidth: 1,
    height: 78,
    position: 'absolute',
    top: 132,
    width: 44,
  },
  arm: {
    backgroundColor: AppColors.surfaceHigh,
    borderColor: AppColors.primary,
    borderRadius: 18,
    borderWidth: 1,
    height: 138,
    position: 'absolute',
    top: 77,
    width: 27,
  },
  leftArm: {
    left: 0,
    transform: [{ rotate: '10deg' }],
  },
  rightArm: {
    right: 0,
    transform: [{ rotate: '-10deg' }],
  },
  pelvis: {
    backgroundColor: AppColors.primary,
    borderRadius: 28,
    height: 48,
    marginTop: -4,
    width: 82,
  },
  leg: {
    backgroundColor: AppColors.surface,
    borderColor: AppColors.primary,
    borderRadius: 20,
    borderWidth: 1,
    height: 142,
    position: 'absolute',
    top: 248,
    width: 35,
  },
  leftLeg: {
    left: 35,
  },
  rightLeg: {
    right: 35,
  },
  calf: {
    backgroundColor: AppColors.surfaceHigh,
    borderColor: AppColors.primarySoft,
    borderRadius: 15,
    borderWidth: 1,
    height: 78,
    position: 'absolute',
    top: 386,
    width: 28,
  },
  leftCalf: {
    left: 39,
  },
  rightCalf: {
    right: 39,
  },
  muscleCallout: {
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderColor: AppColors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    minHeight: 42,
    paddingHorizontal: 8,
    position: 'absolute',
    width: 92,
  },
  brasCallout: {
    left: 0,
    top: 112,
  },
  epaulesCallout: {
    right: 0,
    top: 86,
  },
  pectorauxCallout: {
    right: 0,
    top: 158,
  },
  dosCallout: {
    left: 0,
    top: 184,
  },
  abdosCallout: {
    left: 0,
    top: 260,
  },
  fessiersCallout: {
    right: 0,
    top: 260,
  },
  cuissesCallout: {
    right: 0,
    top: 318,
  },
  molletsCallout: {
    left: 0,
    top: 416,
  },
  couCallout: {
    right: 0,
    top: 34,
  },
  muscleLabel: {
    color: AppColors.text,
    flex: 1,
    fontSize: 12,
    fontWeight: '900',
  },
  muscleCount: {
    backgroundColor: AppColors.surfaceHigh,
    borderRadius: 6,
    color: AppColors.accent,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  exercisePicker: {
    marginTop: 12,
    maxHeight: 340,
  },
  exerciseCard: {
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderColor: AppColors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 7,
    minHeight: 62,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  exerciseInfo: {
    flex: 1,
    paddingRight: 10,
  },
  exerciseName: {
    color: AppColors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  exerciseCategory: {
    color: AppColors.primarySoft,
    fontSize: 12,
    marginTop: 3,
  },
  counter: {
    backgroundColor: AppColors.surfaceHigh,
    borderRadius: 6,
    color: AppColors.accent,
    fontSize: 13,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: AppColors.overlay,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 8,
    maxHeight: '78%',
    padding: 20,
    width: '100%',
  },
  modalTitle: {
    color: AppColors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  modalMeta: {
    color: AppColors.primarySoft,
    fontSize: 14,
    marginBottom: 12,
    marginTop: 4,
  },
  nameInput: {
    backgroundColor: AppColors.background,
    borderColor: AppColors.border,
    borderRadius: 6,
    borderWidth: 1,
    color: AppColors.text,
    fontSize: 15,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  groupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  groupChoice: {
    backgroundColor: AppColors.surfaceHigh,
    borderColor: AppColors.border,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  groupChoiceSelected: {
    backgroundColor: AppColors.accent,
    borderColor: AppColors.accent,
  },
  groupChoiceText: {
    color: AppColors.primarySoft,
    fontSize: 12,
    fontWeight: '800',
  },
  groupChoiceTextSelected: {
    color: AppColors.text,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: AppColors.primary,
    borderRadius: 6,
    marginTop: 2,
    paddingVertical: 13,
  },
  saveButtonText: {
    color: AppColors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  emptyText: {
    color: AppColors.muted,
    fontSize: 14,
    paddingVertical: 16,
  },
  historyRow: {
    borderTopColor: AppColors.border,
    borderTopWidth: 1,
    paddingVertical: 13,
  },
  historyDate: {
    color: AppColors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  historyDetails: {
    color: AppColors.muted,
    fontSize: 13,
    marginTop: 4,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: AppColors.surfaceHigh,
    borderRadius: 6,
    marginTop: 14,
    paddingVertical: 13,
  },
  closeButtonText: {
    color: AppColors.text,
    fontSize: 15,
    fontWeight: '800',
  },
});
