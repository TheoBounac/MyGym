import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { MonthProgress } from '@/components/month-progress';
import { AppColors } from '@/constants/colors';
import { type Meal, type MealEntry, meals, weekDays } from '@/constants/mock-data';
import {
  completedItemsStorageKey,
  customMealsStorageKey,
  nutritionStorageKey,
} from '@/constants/storage';
import { usePlanningWeek } from '@/contexts/planning-week-context';

const nutritionModeColor = '#A1C740';
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
const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getMonday(date: Date) {
  const monday = new Date(date);
  const day = monday.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

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
  return {
    month: Math.floor(slotInYear / 4),
    weekIndex: slotInYear % 4,
    year,
  };
}

export default function PlanningNutritionScreen() {
  const router = useRouter();
  const initialMonthWeek = useMemo(() => getAbsoluteMonthWeek(new Date()), []);
  const { selectedDay, setSelectedDay, setWeekOffset, weekOffset } = usePlanningWeek();
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});
  const [customMeals, setCustomMeals] = useState<Meal[]>([]);
  const [mealEntries, setMealEntries] = useState<MealEntry[]>([]);
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<MealEntry | null>(null);
  const allMeals = useMemo(() => [...meals, ...customMeals], [customMeals]);
  const visibleWeek = useMemo(() => {
    const monthWeek = getMonthWeekFromAbsoluteSlot(initialMonthWeek + weekOffset);
    const referenceDate = new Date(
      monthWeek.year,
      monthWeek.month,
      1 + monthWeek.weekIndex * 7
    );
    const monday = getMonday(referenceDate);
    const days = weekDays.map((day, index) => ({ date: addDays(monday, index), day }));

    return {
      days,
      month: monthWeek.month,
      startDate: monday,
      weekIndex: monthWeek.weekIndex,
    };
  }, [initialMonthWeek, weekOffset]);

  useEffect(() => {
    async function loadMealEntries() {
      try {
        const [storedEntries, storedCustomMeals, storedCompletedItems] = await Promise.all([
          AsyncStorage.getItem(nutritionStorageKey),
          AsyncStorage.getItem(customMealsStorageKey),
          AsyncStorage.getItem(completedItemsStorageKey),
        ]);
        setMealEntries(storedEntries ? JSON.parse(storedEntries) : []);
        setCustomMeals(storedCustomMeals ? JSON.parse(storedCustomMeals) : []);
        setCompletedItems(storedCompletedItems ? JSON.parse(storedCompletedItems) : {});
      } catch {
        Alert.alert('Erreur', 'Impossible de charger la nutrition.');
      } finally {
        setIsStorageLoaded(true);
      }
    }

    loadMealEntries();
  }, []);

  useFocusEffect(
    useCallback(() => {
      async function loadCustomMeals() {
        try {
          const [storedCustomMeals, storedCompletedItems] = await Promise.all([
            AsyncStorage.getItem(customMealsStorageKey),
            AsyncStorage.getItem(completedItemsStorageKey),
          ]);
          setCustomMeals(storedCustomMeals ? JSON.parse(storedCustomMeals) : []);
          setCompletedItems(storedCompletedItems ? JSON.parse(storedCompletedItems) : {});
        } catch {
          Alert.alert('Erreur', 'Impossible de charger les repas.');
        }
      }

      loadCustomMeals();
    }, [])
  );

  useEffect(() => {
    async function saveMealEntries() {
      if (!isStorageLoaded) return;

      try {
        await AsyncStorage.setItem(nutritionStorageKey, JSON.stringify(mealEntries));
      } catch {
        Alert.alert('Erreur', "Impossible d'enregistrer la nutrition.");
      }
    }

    saveMealEntries();
  }, [isStorageLoaded, mealEntries]);

  function addMealToSelectedDay(meal: Meal) {
    const selectedDate =
      visibleWeek.days.find((weekDay) => weekDay.day === selectedDay)?.date ??
      visibleWeek.startDate;
    const newEntry: MealEntry = {
      id: `${meal.id}-${selectedDay}-${Date.now()}`,
      mealId: meal.id,
      mealName: meal.name,
      day: selectedDay,
      date: formatDateKey(selectedDate),
      calories: meal.calories,
      protein: meal.protein,
    };
    setMealEntries((currentEntries) => [...currentEntries, newEntry]);
    setIsAddModalVisible(false);
  }

  function deleteSelectedEntry() {
    if (!selectedEntry) return;

    setMealEntries((currentEntries) =>
      currentEntries.filter((entry) => entry.id !== selectedEntry.id)
    );
    setSelectedEntry(null);
  }

  function openMealDetails(entry: MealEntry) {
    if (selectedDay !== entry.day) {
      setSelectedDay(entry.day);
      return;
    }
    setSelectedEntry(entry);
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

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.mealPlanner}>
          {visibleWeek.days.map(({ date, day }) => {
            const dayDateKey = formatDateKey(date);
            const dayEntries = mealEntries.filter((entry) => entry.date === dayDateKey);
            const isSelectedDay = selectedDay === day;

            return (
              <View key={day} style={styles.dayRowFrame}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.dayRow}
                  onPress={() => setSelectedDay(day)}>
                  <View style={styles.dayLabel}>
                    <Text style={styles.dayName}>{day}</Text>
                    <Text style={styles.dayDate}>{formatShortDate(date)}</Text>
                    {isSelectedDay ? (
                      <TouchableOpacity
                        accessibilityLabel={`Ajouter un plat le ${day}`}
                        style={styles.dayAddButton}
                        onPress={() => {
                          setSelectedDay(day);
                          setIsAddModalVisible(true);
                        }}>
                        <Text style={styles.dayAddButtonText}>+</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  <View style={styles.mealGrid}>
                    {dayEntries.map((entry) => (
                      <TouchableOpacity
                        activeOpacity={selectedDay === entry.day ? 0.2 : 1}
                        key={entry.id}
                        style={[styles.mealBlock, completedItems[entry.id] && styles.completedBlock]}
                        onPress={() => openMealDetails(entry)}>
                        <Text
                          adjustsFontSizeToFit
                          minimumFontScale={0.82}
                          style={styles.mealName}
                          numberOfLines={3}>
                          {entry.mealName}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </TouchableOpacity>
                {isSelectedDay ? <View pointerEvents="none" style={styles.selectedDayOutline} /> : null}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.toolbar, styles.bottomToolbar]}>
        <TouchableOpacity
          accessibilityLabel="Semaine precedente"
          style={styles.iconButton}
          onPress={() => setWeekOffset((current) => current - 1)}>
          <Text style={styles.iconButtonText}>{'<'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/')}>
          <Text style={styles.addButtonText}>Nutrition</Text>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityLabel="Semaine suivante"
          style={styles.iconButton}
          onPress={() => setWeekOffset((current) => current + 1)}>
          <Text style={styles.iconButtonText}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="fade"
        transparent
        visible={isAddModalVisible}
        onRequestClose={() => setIsAddModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setIsAddModalVisible(false)}>
          <Pressable style={styles.modalCard}>
            <Text style={styles.modalTitle}>Ajouter le {selectedDay}</Text>
            <Text style={styles.modalMeta}>Choisis un plat</Text>
            <ScrollView style={styles.mealPicker}>
              {allMeals.map((meal) => (
                <TouchableOpacity
                  key={meal.id}
                  style={styles.mealChoice}
                  onPress={() => addMealToSelectedDay(meal)}>
                  <Text style={styles.mealChoiceName}>{meal.name}</Text>
                  <Text style={styles.mealChoiceCategory}>
                    {meal.category} - {meal.calories} kcal - {meal.protein} g proteines
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={selectedEntry !== null}
        onRequestClose={() => setSelectedEntry(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedEntry(null)}>
          <Pressable style={styles.modalCard}>
            <Text style={styles.modalTitle}>{selectedEntry?.mealName}</Text>
            <Text style={styles.modalMeta}>
              {selectedEntry?.day} - {selectedEntry?.date}
            </Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Calories</Text>
              <Text style={styles.detailValue}>{selectedEntry?.calories} kcal</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Proteines</Text>
              <Text style={styles.detailValue}>{selectedEntry?.protein} g</Text>
            </View>
            <TouchableOpacity style={styles.dangerButton} onPress={deleteSelectedEntry}>
              <Text style={styles.dangerButtonText}>Supprimer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedEntry(null)}>
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
    backgroundColor: nutritionModeColor,
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
  content: {
    paddingBottom: 92,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  mealPlanner: {
    marginBottom: 16,
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
    borderColor: nutritionModeColor,
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
    backgroundColor: nutritionModeColor,
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
  mealGrid: {
    alignContent: 'flex-start',
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  mealBlock: {
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
  mealName: {
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
  mealPicker: {
    maxHeight: 340,
  },
  mealChoice: {
    borderTopColor: AppColors.border,
    borderTopWidth: 1,
    paddingVertical: 13,
  },
  mealChoiceName: {
    color: AppColors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  mealChoiceCategory: {
    color: AppColors.muted,
    fontSize: 13,
    marginTop: 3,
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
  dangerButton: {
    alignItems: 'center',
    backgroundColor: AppColors.dangerSoft,
    borderRadius: 6,
    marginTop: 10,
    paddingVertical: 12,
  },
  dangerButtonText: {
    color: AppColors.danger,
    fontSize: 14,
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
});
