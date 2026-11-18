import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  type KeyboardTypeOptions,
  useWindowDimensions,
  View,
} from 'react-native';

import { AppColors } from '@/constants/colors';
import { MonthProgress } from '@/components/month-progress';
import { usePlanningWeek } from '@/contexts/planning-week-context';
import {
  exercises as baseExercises,
  weekDays,
  type Exercise,
  type WorkoutEntry,
} from '@/constants/mock-data';
import {
  completedItemsStorageKey,
  customExercisesStorageKey,
  planningStorageKey,
} from '@/constants/storage';

function getMonday(date: Date) {
  const monday = new Date(date);
  const day = monday.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  monday.setDate(monday.getDate() + diff);
  monday.setHours(0, 0, 0, 0);

  return monday;
}

const monthNames = [
  'Janvier',
  'Fevrier',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Aout',
  'Septembre',
  'Octobre',
  'Novembre',
  'Decembre',
];

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatShortDate(date: Date) {
  const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return `${String(date.getDate()).padStart(2, '0')} ${shortMonthNames[date.getMonth()]}`;
}

function getMonthWeekIndex(date: Date) {
  return Math.min(3, Math.floor((date.getDate() - 1) / 7));
}

function getAbsoluteMonthWeek(date: Date) {
  return date.getFullYear() * 48 + date.getMonth() * 4 + getMonthWeekIndex(date);
}

function getMonthWeekFromAbsoluteSlot(absoluteSlot: number) {
  const year = Math.floor(absoluteSlot / 48);
  const slotInYear = absoluteSlot - year * 48;
  const month = Math.floor(slotInYear / 4);
  const weekIndex = slotInYear % 4;

  return {
    month,
    weekIndex,
    year,
  };
}

type ExerciseGroup = {
  categories: string[];
  id: string;
  label: string;
};

const exerciseGroups: ExerciseGroup[] = [
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

type StepperInputProps = {
  keyboardType: KeyboardTypeOptions;
  label: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
};

function formatSteppedValue(value: number) {
  const roundedValue = Math.round(value * 100) / 100;

  return Number.isInteger(roundedValue)
    ? String(roundedValue)
    : String(roundedValue).replace('.', ',');
}

function getSteppedValue(currentValue: string, amount: number) {
  const currentNumber = Number(currentValue.replace(',', '.'));
  const nextValue = Math.max(0, (Number.isNaN(currentNumber) ? 0 : currentNumber) + amount);

  return formatSteppedValue(nextValue);
}

function StepperInput({
  keyboardType,
  label,
  onChangeText,
  placeholder,
  value,
}: StepperInputProps) {
  const currentValueRef = useRef(value);
  const holdDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopStepping() {
    if (holdDelayRef.current) {
      clearTimeout(holdDelayRef.current);
      holdDelayRef.current = null;
    }

    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  }

  function step(amount: number) {
    const nextValue = getSteppedValue(currentValueRef.current, amount);

    currentValueRef.current = nextValue;
    onChangeText(nextValue);
  }

  function startStepping(amount: number) {
    stopStepping();
    step(amount);
    holdDelayRef.current = setTimeout(() => {
      holdIntervalRef.current = setInterval(() => step(amount), 80);
    }, 300);
  }

  useEffect(() => {
    currentValueRef.current = value;
  }, [value]);

  useEffect(() => stopStepping, []);

  return (
    <View style={styles.stepperField}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.stepperRow}>
        <Pressable
          accessibilityLabel={`Diminuer ${label}`}
          style={styles.stepperButton}
          onPressIn={() => startStepping(-1)}
          onPressOut={stopStepping}>
          <Text style={styles.stepperButtonText}>-</Text>
        </Pressable>

        <TextInput
          style={styles.stepperInput}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholder={placeholder}
          placeholderTextColor={AppColors.muted}
        />

        <Pressable
          accessibilityLabel={`Augmenter ${label}`}
          style={styles.stepperButton}
          onPressIn={() => startStepping(1)}
          onPressOut={stopStepping}>
          <Text style={styles.stepperButtonText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function PlanningScreen() {
  const router = useRouter();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const initialMonthWeek = useMemo(() => getAbsoluteMonthWeek(new Date()), []);
  const { selectedDay, setSelectedDay, setWeekOffset, weekOffset } = usePlanningWeek();
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});
  const [entries, setEntries] = useState<WorkoutEntry[]>([]);
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<WorkoutEntry | null>(null);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [selectedExerciseGroup, setSelectedExerciseGroup] = useState<ExerciseGroup | null>(null);
  const [exerciseToAdd, setExerciseToAdd] = useState<Exercise | null>(null);
  const [weight, setWeight] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editSets, setEditSets] = useState('');
  const [editReps, setEditReps] = useState('');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isEditingEntry, setIsEditingEntry] = useState(false);
  const [quickPopupTop, setQuickPopupTop] = useState(360);
  const [quickPopupFrame, setQuickPopupFrame] = useState({
    left: 16,
    width: windowWidth - 32,
  });
  const dayRowRefs = useRef<Record<string, View | null>>({});
  const allExercises = useMemo(
    () => [...baseExercises, ...customExercises],
    [customExercises]
  );
  const groupExercises = useMemo(
    () =>
      selectedExerciseGroup
        ? allExercises.filter((exercise) => selectedExerciseGroup.categories.includes(exercise.category))
        : [],
    [allExercises, selectedExerciseGroup]
  );

  const visibleWeek = useMemo(() => {
    const monthWeek = getMonthWeekFromAbsoluteSlot(initialMonthWeek + weekOffset);
    const referenceDate = new Date(
      monthWeek.year,
      monthWeek.month,
      1 + monthWeek.weekIndex * 7
    );
    const monday = getMonday(referenceDate);
    const days = weekDays.map((day, index) => ({
      date: addDays(monday, index),
      day,
    }));

    return {
      days,
      endDate: days[6].date,
      month: monthWeek.month,
      startDate: monday,
      weekIndex: monthWeek.weekIndex,
    };
  }, [initialMonthWeek, weekOffset]);

  useEffect(() => {
    async function loadPlanningEntries() {
      try {
        const [storedEntries, storedCustomExercises, storedCompletedItems] = await Promise.all([
          AsyncStorage.getItem(planningStorageKey),
          AsyncStorage.getItem(customExercisesStorageKey),
          AsyncStorage.getItem(completedItemsStorageKey),
        ]);

        setEntries(storedEntries ? JSON.parse(storedEntries) : []);
        setCustomExercises(storedCustomExercises ? JSON.parse(storedCustomExercises) : []);
        setCompletedItems(storedCompletedItems ? JSON.parse(storedCompletedItems) : {});
      } catch {
        Alert.alert('Erreur', 'Impossible de charger le planning.');
      } finally {
        setIsStorageLoaded(true);
      }
    }

    loadPlanningEntries();
  }, []);

  useFocusEffect(
    useCallback(() => {
      async function loadCustomExercises() {
        try {
          const [storedCustomExercises, storedCompletedItems] = await Promise.all([
            AsyncStorage.getItem(customExercisesStorageKey),
            AsyncStorage.getItem(completedItemsStorageKey),
          ]);

          setCustomExercises(storedCustomExercises ? JSON.parse(storedCustomExercises) : []);
          setCompletedItems(storedCompletedItems ? JSON.parse(storedCompletedItems) : {});
        } catch {
          Alert.alert('Erreur', 'Impossible de charger les exercices.');
        }
      }

      loadCustomExercises();
    }, [])
  );

  useEffect(() => {
    async function savePlanningEntries() {
      if (!isStorageLoaded) {
        return;
      }

      try {
        await AsyncStorage.setItem(planningStorageKey, JSON.stringify(entries));
      } catch {
        Alert.alert('Erreur', "Impossible d'enregistrer le planning.");
      }
    }

    savePlanningEntries();
  }, [entries, isStorageLoaded]);

  function closeAddModal() {
    setIsAddModalVisible(false);
    setSelectedExerciseGroup(null);
    setExerciseToAdd(null);
    setWeight('');
    setSets('');
    setReps('');
  }

  function addExerciseToSelectedDay() {
    if (!exerciseToAdd) {
      return;
    }

    const weightValue = Number(weight.replace(',', '.'));
    const setsValue = Number(sets);
    const repsValue = Number(reps);

    if (
      Number.isNaN(weightValue) ||
      Number.isNaN(setsValue) ||
      Number.isNaN(repsValue) ||
      setsValue <= 0 ||
      repsValue <= 0
    ) {
      Alert.alert('Valeurs incorrectes', 'Entre un poids, un nombre de series et des repetitions valides.');
      return;
    }

    const newEntry: WorkoutEntry = {
      id: `${exerciseToAdd.id}-${selectedDay}-${Date.now()}`,
      exerciseId: exerciseToAdd.id,
      exerciseName: exerciseToAdd.name,
      day: selectedDay,
      date: formatDateKey(
        visibleWeek.days.find((weekDay) => weekDay.day === selectedDay)?.date ??
          visibleWeek.startDate
      ),
      weight: weightValue,
      sets: setsValue,
      reps: repsValue,
    };

    setEntries((currentEntries) => [...currentEntries, newEntry]);
    closeAddModal();
  }

  function openEntryDetails(entry: WorkoutEntry) {
    if (selectedDay !== entry.day) {
      setSelectedDay(entry.day);
      return;
    }

    const quickModalHeight = 108;
    const verticalGap = -1;
    const lowerOffset = 8;
    const sundayLiftOffset = 8;
    const minTop = 92;
    const maxTop = Math.max(minTop, windowHeight - quickModalHeight - 24);
    const dayRow = dayRowRefs.current[entry.day];

    function showEntryDetails(nextPopupTop: number, nextPopupFrame = quickPopupFrame) {
      setSelectedDay(entry.day);
      setSelectedEntry(entry);
      setEditWeight(String(entry.weight));
      setEditSets(String(entry.sets));
      setEditReps(String(entry.reps));
      setIsConfirmingDelete(false);
      setIsEditingEntry(false);
      setQuickPopupTop(Math.max(minTop, Math.min(nextPopupTop, maxTop)));
      setQuickPopupFrame(nextPopupFrame);
    }

    if (!dayRow) {
      showEntryDetails(360);
      return;
    }

    dayRow.measureInWindow((x, y, width, height) => {
      const nextPopupTop =
        entry.day === 'Dimanche'
          ? y - quickModalHeight - verticalGap - sundayLiftOffset
          : y + height + verticalGap + lowerOffset;

      showEntryDetails(nextPopupTop, { left: x, width });
    });
  }

  function closeEntryDetails() {
    setSelectedEntry(null);
    setEditWeight('');
    setEditSets('');
    setEditReps('');
    setIsConfirmingDelete(false);
    setIsEditingEntry(false);
  }

  function saveSelectedEntry() {
    if (!selectedEntry) {
      return;
    }

    const weightValue = Number(editWeight.replace(',', '.'));
    const setsValue = Number(editSets);
    const repsValue = Number(editReps);

    if (
      Number.isNaN(weightValue) ||
      Number.isNaN(setsValue) ||
      Number.isNaN(repsValue) ||
      setsValue <= 0 ||
      repsValue <= 0
    ) {
      Alert.alert('Valeurs incorrectes', 'Entre un poids, un nombre de series et des repetitions valides.');
      return;
    }

    const updatedEntry: WorkoutEntry = {
      ...selectedEntry,
      weight: weightValue,
      sets: setsValue,
      reps: repsValue,
    };

    setEntries((currentEntries) =>
      currentEntries.map((entry) => (entry.id === selectedEntry.id ? updatedEntry : entry))
    );
    setSelectedEntry(updatedEntry);
  }

  function moveSelectedEntry(direction: 'previous' | 'next') {
    if (!selectedEntry) {
      return;
    }

    setEntries((currentEntries) => {
      const dayEntries = currentEntries.filter((entry) => entry.date === selectedEntry.date);
      const selectedIndex = dayEntries.findIndex((entry) => entry.id === selectedEntry.id);
      const targetIndex = direction === 'previous' ? selectedIndex - 1 : selectedIndex + 1;

      if (selectedIndex < 0 || targetIndex < 0 || targetIndex >= dayEntries.length) {
        return currentEntries;
      }

      const reorderedDayEntries = [...dayEntries];
      const [movedEntry] = reorderedDayEntries.splice(selectedIndex, 1);
      reorderedDayEntries.splice(targetIndex, 0, movedEntry);
      const nextDayEntries = [...reorderedDayEntries];

      return currentEntries.map((entry) => {
        if (entry.date !== selectedEntry.date) {
          return entry;
        }

        return nextDayEntries.shift() ?? entry;
      });
    });
  }

  function deleteSelectedEntry() {
    if (!selectedEntry) {
      return;
    }

    setEntries((currentEntries) =>
      currentEntries.filter((entry) => entry.id !== selectedEntry.id)
    );
    closeEntryDetails();
  }

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <MonthProgress
          compact
          month={monthNames[visibleWeek.month]}
          weekIndex={visibleWeek.weekIndex}
        />
      </View>

      <ScrollView contentContainerStyle={styles.weekList}>
        {visibleWeek.days.map(({ date, day }) => {
          const dayDateKey = formatDateKey(date);
          const dayEntries = entries.filter((entry) => entry.date === dayDateKey);
          const isSelectedDay = selectedDay === day;

          return (
            <View
              key={day}
              ref={(node) => {
                dayRowRefs.current[day] = node;
              }}
              style={styles.dayRowFrame}
              collapsable={false}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.dayRow}
                onPress={() => setSelectedDay(day)}>
                <View style={styles.dayLabel}>
                  <Text style={styles.dayName}>{day}</Text>
                  <Text style={styles.dayDate}>{formatShortDate(date)}</Text>
                  {isSelectedDay ? (
                    <TouchableOpacity
                      accessibilityLabel={`Ajouter un exercice le ${day}`}
                      style={styles.dayAddButton}
                      onPress={() => {
                        setSelectedDay(day);
                        setIsAddModalVisible(true);
                      }}>
                      <Text style={styles.dayAddButtonText}>+</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                <View style={styles.exerciseGrid}>
                  {dayEntries.map((entry) => (
                    <TouchableOpacity
                      activeOpacity={selectedDay === entry.day ? 0.2 : 1}
                      key={entry.id}
                      style={[
                        styles.exerciseBlock,
                        completedItems[entry.id] && styles.completedBlock,
                      ]}
                      onPress={() => openEntryDetails(entry)}>
                      <Text
                        adjustsFontSizeToFit
                        minimumFontScale={0.82}
                        style={styles.exerciseName}
                        numberOfLines={3}>
                        {entry.exerciseName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableOpacity>
              {isSelectedDay ? <View pointerEvents="none" style={styles.selectedDayOutline} /> : null}
            </View>
          );
        })}
      </ScrollView>

      <View style={[styles.toolbar, styles.bottomToolbar]}>
        <TouchableOpacity
          accessibilityLabel="Semaine precedente"
          style={styles.iconButton}
          onPress={() => setWeekOffset((current) => current - 1)}>
          <Text style={styles.iconButtonText}>{'<'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/planning-nutrition')}>
          <Text style={styles.addButtonText}>Exercices</Text>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityLabel="Semaine suivante"
          style={styles.iconButton}
          onPress={() => setWeekOffset((current) => current + 1)}>
          <Text style={styles.iconButtonText}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      {selectedEntry !== null && !isEditingEntry ? (
        <Pressable style={styles.quickInlineOverlay} onPress={closeEntryDetails}>
          <Pressable
            style={[
              styles.quickFloatingCard,
              {
                left: quickPopupFrame.left,
                top: quickPopupTop,
                width: quickPopupFrame.width,
              },
            ]}>
            <View style={styles.quickPanelHeader}>
              <Text style={styles.quickPanelTitle} numberOfLines={1}>
                {selectedEntry.exerciseName}
              </Text>
              <Text style={styles.quickPanelDate}>
                {selectedEntry.day}
              </Text>
            </View>

            <View style={styles.quickActionRow}>
              <TouchableOpacity
                style={styles.quickIconButton}
                onPress={() => moveSelectedEntry('previous')}>
                <MaterialIcons name="arrow-back" size={22} color={AppColors.primarySoft} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickEditButton}
                onPress={() => setIsEditingEntry(true)}>
                <Text style={styles.quickEditButtonText}>Modifier</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickIconButton}
                onPress={() => moveSelectedEntry('next')}>
                <MaterialIcons name="arrow-forward" size={22} color={AppColors.primarySoft} />
              </TouchableOpacity>
            </View>

            <View style={styles.quickStatsRow}>
              <Text style={styles.quickStatsText} numberOfLines={1}>
                Series {selectedEntry.sets}
              </Text>
              <Text style={styles.quickStatsText} numberOfLines={1}>
                Poids {selectedEntry.weight}kg
              </Text>
              <Text style={styles.quickStatsText} numberOfLines={1}>
                Reps {selectedEntry.reps}
              </Text>
            </View>
          </Pressable>
        </Pressable>
      ) : null}

      <Modal
        animationType="fade"
        transparent
        visible={isAddModalVisible}
        onRequestClose={closeAddModal}>
        <Pressable style={styles.modalOverlay} onPress={closeAddModal}>
          <Pressable style={styles.modalCard}>
            <Text style={styles.modalTitle}>Ajouter le {selectedDay}</Text>
            <Text style={styles.modalMeta}>
              {exerciseToAdd
                ? exerciseToAdd.name
                : selectedExerciseGroup
                  ? selectedExerciseGroup.label
                  : 'Choisis un groupe musculaire'}
            </Text>

            {!selectedExerciseGroup ? (
              <ScrollView style={styles.exercisePicker}>
                {exerciseGroups.map((group) => (
                  <TouchableOpacity
                    key={group.id}
                    style={styles.exerciseChoice}
                    onPress={() => setSelectedExerciseGroup(group)}>
                    <Text style={styles.exerciseChoiceName}>{group.label}</Text>
                    <Text style={styles.exerciseChoiceCategory}>
                      {allExercises.filter((exercise) => group.categories.includes(exercise.category)).length} exercices
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : !exerciseToAdd ? (
              <ScrollView style={styles.exercisePicker}>
                <TouchableOpacity
                  style={styles.backChoice}
                  onPress={() => setSelectedExerciseGroup(null)}>
                  <Text style={styles.backChoiceText}>Changer de groupe</Text>
                </TouchableOpacity>

                {groupExercises.map((exercise) => (
                  <TouchableOpacity
                    key={exercise.id}
                    style={styles.exerciseChoice}
                    onPress={() => setExerciseToAdd(exercise)}>
                    <Text style={styles.exerciseChoiceName}>{exercise.name}</Text>
                    <Text style={styles.exerciseChoiceCategory}>{exercise.category}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View>
                <TouchableOpacity
                  style={styles.backChoice}
                  onPress={() => setExerciseToAdd(null)}>
                  <Text style={styles.backChoiceText}>Choisir un autre exercice</Text>
                </TouchableOpacity>

                <StepperInput
                  label="Poids kg"
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="decimal-pad"
                  placeholder="0"
                />

                <StepperInput
                  label="Series"
                  value={sets}
                  onChangeText={setSets}
                  keyboardType="number-pad"
                  placeholder="0"
                />

                <StepperInput
                  label="Repetitions"
                  value={reps}
                  onChangeText={setReps}
                  keyboardType="number-pad"
                  placeholder="0"
                />

                <TouchableOpacity style={styles.closeButton} onPress={addExerciseToSelectedDay}>
                  <Text style={styles.closeButtonText}>Ajouter</Text>
                </TouchableOpacity>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={selectedEntry !== null && isEditingEntry}
        onRequestClose={closeEntryDetails}>
        <Pressable style={styles.modalOverlay} onPress={closeEntryDetails}>
          <Pressable style={styles.modalCard}>
            <Text style={styles.modalTitle}>{selectedEntry?.exerciseName}</Text>
            <Text style={styles.modalMeta}>
              {selectedEntry?.day} - {selectedEntry?.date}
            </Text>

            <StepperInput
              label="Poids kg"
              value={editWeight}
              onChangeText={setEditWeight}
              keyboardType="decimal-pad"
              placeholder="0"
            />

            <StepperInput
              label="Series"
              value={editSets}
              onChangeText={setEditSets}
              keyboardType="number-pad"
              placeholder="0"
            />

            <StepperInput
              label="Repetitions"
              value={editReps}
              onChangeText={setEditReps}
              keyboardType="number-pad"
              placeholder="0"
            />

            <TouchableOpacity style={styles.saveButton} onPress={saveSelectedEntry}>
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            </TouchableOpacity>

            {isConfirmingDelete ? (
              <View style={styles.deleteConfirm}>
                <Text style={styles.deleteConfirmText}>Supprimer cet exercice ?</Text>
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => setIsConfirmingDelete(false)}>
                    <Text style={styles.secondaryButtonText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dangerButtonInline} onPress={deleteSelectedEntry}>
                    <Text style={styles.dangerButtonText}>Confirmer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.dangerButton}
                onPress={() => setIsConfirmingDelete(true)}>
                <Text style={styles.dangerButtonText}>Supprimer</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.closeButton} onPress={closeEntryDetails}>
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
    justifyContent: 'flex-end',
    minHeight: 65,
    paddingBottom: 4,
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  toolbar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    width: '100%',
  },
  bottomToolbar: {
    backgroundColor: AppColors.surface,
    borderTopColor: AppColors.border,
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    marginTop: 0,
    paddingHorizontal: 8,
    paddingVertical: 8,
    position: 'absolute',
    right: 0,
    zIndex: 5,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: AppColors.surfaceHigh,
    borderRadius: 6,
    flex: 1,
    height: 44,
    justifyContent: 'center',
  },
  iconButtonText: {
    color: AppColors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: AppColors.accent,
    borderRadius: 6,
    flex: 2,
    height: 44,
    justifyContent: 'center',
  },
  addButtonText: {
    color: AppColors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  weekList: {
    paddingHorizontal: 8,
    paddingVertical: 10,
    paddingBottom: 92,
  },
  dayRowFrame: {
    marginBottom: 7,
    position: 'relative',
  },
  dayRow: {
    backgroundColor: AppColors.surface,
    borderColor: AppColors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 88,
    overflow: 'hidden',
    padding: 10,
  },
  selectedDayOutline: {
    borderColor: AppColors.accentMuted,
    borderRadius: 8,
    borderWidth: 4,
    bottom: -2,
    left: -2,
    position: 'absolute',
    right: -2,
    top: -2,
    zIndex: 2,
  },
  dayLabel: {
    justifyContent: 'center',
    width: 94,
  },
  dayName: {
    color: AppColors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  dayDate: {
    color: AppColors.primarySoft,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  dayAddButton: {
    alignItems: 'center',
    backgroundColor: AppColors.accent,
    borderRadius: 6,
    height: 24,
    justifyContent: 'center',
    marginTop: 6,
    width: 38,
  },
  dayAddButtonText: {
    color: AppColors.text,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 22,
  },
  exerciseGrid: {
    alignContent: 'flex-start',
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  exerciseBlock: {
    alignItems: 'center',
    backgroundColor: AppColors.surfaceHigh,
    borderColor: AppColors.primary,
    borderRadius: 7,
    borderWidth: 1,
    height: 60,
    justifyContent: 'center',
    padding: 4,
    width: 70,
  },
  completedBlock: {
    backgroundColor: '#7D6DDB',
    borderColor: '#C9C2FF',
  },
  exerciseName: {
    color: AppColors.text,
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 11,
    textAlign: 'center',
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
    maxHeight: '82%',
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
    marginBottom: 18,
    marginTop: 4,
  },
  detailRow: {
    alignItems: 'center',
    borderTopColor: AppColors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  detailLabel: {
    color: AppColors.muted,
    fontSize: 14,
    fontWeight: '700',
  },
  detailValue: {
    color: AppColors.text,
    fontSize: 16,
    fontWeight: '800',
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
  saveButton: {
    alignItems: 'center',
    backgroundColor: AppColors.primary,
    borderRadius: 6,
    marginTop: 4,
    paddingVertical: 13,
  },
  saveButtonText: {
    color: AppColors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  editButton: {
    alignItems: 'center',
    backgroundColor: AppColors.accent,
    borderRadius: 6,
    marginTop: 12,
    paddingVertical: 13,
  },
  editButtonText: {
    color: AppColors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  quickInlineOverlay: {
    backgroundColor: AppColors.overlaySoft,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 10,
  },
  quickFloatingCard: {
    backgroundColor: AppColors.surfaceHigh,
    borderColor: AppColors.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 108,
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 10,
    position: 'absolute',
  },
  quickPanelHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickPanelTitle: {
    color: AppColors.text,
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    marginRight: 10,
  },
  quickPanelDate: {
    color: AppColors.accentSoft,
    fontSize: 12,
    fontWeight: '800',
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickIconButton: {
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: 6,
    flex: 1,
    height: 32,
    justifyContent: 'center',
  },
  quickEditButton: {
    alignItems: 'center',
    backgroundColor: AppColors.accent,
    borderRadius: 6,
    flex: 2,
    height: 32,
    justifyContent: 'center',
  },
  quickEditButtonText: {
    color: AppColors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  quickStatsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 18,
    justifyContent: 'center',
  },
  quickStatsText: {
    color: AppColors.muted,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: AppColors.surfaceHigh,
    borderRadius: 6,
    flex: 1,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: AppColors.primarySoft,
    fontSize: 14,
    fontWeight: '800',
  },
  dangerButton: {
    alignItems: 'center',
    backgroundColor: AppColors.dangerSoft,
    borderRadius: 6,
    marginTop: 10,
    paddingVertical: 12,
  },
  dangerButtonInline: {
    alignItems: 'center',
    backgroundColor: AppColors.dangerSoft,
    borderRadius: 6,
    flex: 1,
    paddingVertical: 12,
  },
  dangerButtonText: {
    color: AppColors.danger,
    fontSize: 14,
    fontWeight: '800',
  },
  deleteConfirm: {
    backgroundColor: AppColors.dangerSoft,
    borderColor: AppColors.danger,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 10,
    padding: 12,
  },
  deleteConfirmText: {
    color: AppColors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  exercisePicker: {
    maxHeight: 340,
  },
  backChoice: {
    alignItems: 'center',
    backgroundColor: AppColors.surfaceHigh,
    borderRadius: 6,
    marginBottom: 8,
    paddingVertical: 11,
  },
  backChoiceText: {
    color: AppColors.primarySoft,
    fontSize: 13,
    fontWeight: '900',
  },
  exerciseChoice: {
    borderTopColor: AppColors.border,
    borderTopWidth: 1,
    paddingVertical: 13,
  },
  exerciseChoiceName: {
    color: AppColors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  exerciseChoiceCategory: {
    color: AppColors.muted,
    fontSize: 13,
    marginTop: 3,
  },
  inputLabel: {
    color: AppColors.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 7,
  },
  stepperField: {
    marginBottom: 14,
  },
  stepperRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  stepperButton: {
    alignItems: 'center',
    backgroundColor: AppColors.surfaceHigh,
    borderColor: AppColors.border,
    borderRadius: 6,
    borderWidth: 1,
    flex: 1,
    height: 48,
    justifyContent: 'center',
    minWidth: 78,
  },
  stepperButtonText: {
    color: AppColors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  stepperInput: {
    backgroundColor: AppColors.background,
    borderColor: AppColors.border,
    borderRadius: 6,
    borderWidth: 1,
    color: AppColors.text,
    fontSize: 16,
    paddingHorizontal: 13,
    paddingVertical: 12,
    textAlign: 'center',
    width: 104,
  },
});
