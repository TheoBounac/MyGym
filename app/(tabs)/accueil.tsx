import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { AppColors } from '@/constants/colors';
import { MonthProgress } from '@/components/month-progress';
import {
  bodyWeightHistory,
  type BodyWeightEntry,
  type MealEntry,
  type WorkoutEntry,
} from '@/constants/mock-data';
import {
  bodyWeightStorageKey,
  completedItemsStorageKey,
  nutritionStorageKey,
  planningStorageKey,
} from '@/constants/storage';

const chartHeight = 260;
const chartTrackHeight = 220;
const calorieChartHeight = 220;
const calorieChartTrackHeight = 176;
const defaultChartMinWeight = 40;
const defaultChartMaxWeight = 70;
const nutritionModeColor = '#A1C740';

const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthNames = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

function formatShortDate(date: Date) {
  return `${String(date.getDate()).padStart(2, '0')} ${shortMonthNames[date.getMonth()]}`;
}

function formatWeightDate(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return formatShortDate(date);
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function isValidDateKey(dateKey: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);

  if (!match) {
    return false;
  }

  const [, year, month, day] = match.map(Number);
  const date = new Date(year, month - 1, day);

  return formatDateKey(date) === dateKey;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

function getMonday(date: Date) {
  const monday = new Date(date);
  const day = monday.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;

  monday.setDate(monday.getDate() - daysSinceMonday);
  monday.setHours(0, 0, 0, 0);

  return monday;
}

const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export default function AccueilScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const [displayedDate, setDisplayedDate] = useState(() => new Date());
  const displayedDateKey = useMemo(() => formatDateKey(displayedDate), [displayedDate]);
  const displayedDayLabel = useMemo(() => dayNames[displayedDate.getDay()], [displayedDate]);
  const displayedShortDate = useMemo(() => formatShortDate(displayedDate), [displayedDate]);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [calorieWeekOffset, setCalorieWeekOffset] = useState(0);
  const [isWeightModalVisible, setIsWeightModalVisible] = useState(false);
  const [mealEntries, setMealEntries] = useState<MealEntry[]>([]);
  const [weightDay, setWeightDay] = useState(() => String(new Date().getDate()).padStart(2, '0'));
  const [weightHistory, setWeightHistory] = useState<BodyWeightEntry[]>(bodyWeightHistory);
  const [weightMonth, setWeightMonth] = useState(() => String(new Date().getMonth() + 1).padStart(2, '0'));
  const [weightValue, setWeightValue] = useState('');
  const [weightYear, setWeightYear] = useState(() => String(new Date().getFullYear()));
  const [workoutEntries, setWorkoutEntries] = useState<WorkoutEntry[]>([]);
  const chartWidth = Math.max(230, windowWidth - 98);
  const chartSidePadding = 20;
  const chartUsableWidth = chartWidth - chartSidePadding * 2;
  const calorieChart = useMemo(() => {
    const monday = addDays(getMonday(new Date()), calorieWeekOffset * 7);
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = addDays(monday, index);
      const dateKey = formatDateKey(date);
      const calories = mealEntries
        .filter((entry) => entry.date === dateKey && checkedItems[entry.id])
        .reduce((total, entry) => total + entry.calories, 0);

      return { calories, date, dateKey };
    });
    const maxCalories = Math.ceil(Math.max(500, ...days.map((day) => day.calories)) / 500) * 500;
    const points = days.map((day, index) => ({
      ...day,
      x: chartSidePadding + (index / 6) * chartUsableWidth,
      y: calorieChartTrackHeight - (day.calories / maxCalories) * calorieChartTrackHeight,
    }));
    const referenceDate = days[3].date;

    return {
      maxCalories,
      middleCalories: Math.round(maxCalories / 2),
      month: monthNames[referenceDate.getMonth()],
      points,
      weekIndex: Math.min(3, Math.floor((referenceDate.getDate() - 1) / 7)),
    };
  }, [calorieWeekOffset, chartUsableWidth, checkedItems, mealEntries]);
  const chartMinWeight =
    Math.floor(Math.min(defaultChartMinWeight, ...weightHistory.map((entry) => entry.weight)) / 5) * 5;
  const chartMaxWeight =
    Math.ceil(Math.max(defaultChartMaxWeight, ...weightHistory.map((entry) => entry.weight)) / 5) * 5;
  const chartMiddleWeight = Math.round((chartMinWeight + chartMaxWeight) / 2);
  const weightRange = chartMaxWeight - chartMinWeight;
  const weightPoints = weightHistory.map((entry, index) => {
    const x =
      weightHistory.length === 1
        ? chartWidth / 2
        : chartSidePadding + (index / (weightHistory.length - 1)) * chartUsableWidth;
    const normalizedWeight = (entry.weight - chartMinWeight) / weightRange;
    const y = chartTrackHeight - normalizedWeight * chartTrackHeight;

    return { ...entry, x, y };
  });
  const displayedMeals = mealEntries.filter((entry) => entry.date === displayedDateKey);
  const displayedWorkouts = workoutEntries.filter((entry) => entry.date === displayedDateKey);
  const completedMassGainerCount = displayedMeals.filter(
    (entry) => checkedItems[entry.id] && entry.mealName.toLowerCase() === 'shaker mass gainer'
  ).length;
  const completedProteinShakeCount = displayedMeals.filter(
    (entry) => checkedItems[entry.id] && entry.mealName.toLowerCase() === 'shaker proteine'
  ).length;

  async function toggleChecked(itemId: string) {
    const nextCheckedItems = {
      ...checkedItems,
      [itemId]: !checkedItems[itemId],
    };

    setCheckedItems(nextCheckedItems);

    try {
      await AsyncStorage.setItem(completedItemsStorageKey, JSON.stringify(nextCheckedItems));
    } catch {
      Alert.alert('Erreur', "Impossible d'enregistrer la coche.");
    }
  }

  function openWeightModal() {
    const today = new Date();

    setWeightDay(String(today.getDate()).padStart(2, '0'));
    setWeightMonth(String(today.getMonth() + 1).padStart(2, '0'));
    setWeightYear(String(today.getFullYear()));
    setWeightValue('');
    setIsWeightModalVisible(true);
  }

  async function addWeightMeasurement() {
    const cleanDate = `${weightYear.trim()}-${weightMonth.trim().padStart(2, '0')}-${weightDay
      .trim()
      .padStart(2, '0')}`;
    const measuredWeight = Number(weightValue.replace(',', '.'));

    if (!isValidDateKey(cleanDate)) {
      Alert.alert('Date incorrecte', 'Utilise le format AAAA-MM-JJ.');
      return;
    }

    if (!Number.isFinite(measuredWeight) || measuredWeight < 20 || measuredWeight > 300) {
      Alert.alert('Poids incorrect', 'Entre un poids compris entre 20 et 300 kg.');
      return;
    }

    const newMeasurement: BodyWeightEntry = {
      date: cleanDate,
      id: `weight-${Date.now()}`,
      weight: measuredWeight,
    };
    const nextWeightHistory = [...weightHistory, newMeasurement].sort((left, right) =>
      left.date.localeCompare(right.date)
    );

    try {
      await AsyncStorage.setItem(bodyWeightStorageKey, JSON.stringify(nextWeightHistory));
      setWeightHistory(nextWeightHistory);
      setIsWeightModalVisible(false);
    } catch {
      Alert.alert('Erreur', "Impossible d'enregistrer la mesure.");
    }
  }

  useFocusEffect(
    useCallback(() => {
      async function loadTodayEntries() {
        try {
          const [storedWorkoutEntries, storedMealEntries, storedCheckedItems, storedWeightHistory] =
            await Promise.all([
            AsyncStorage.getItem(planningStorageKey),
            AsyncStorage.getItem(nutritionStorageKey),
            AsyncStorage.getItem(completedItemsStorageKey),
            AsyncStorage.getItem(bodyWeightStorageKey),
          ]);

          setWorkoutEntries(storedWorkoutEntries ? JSON.parse(storedWorkoutEntries) : []);
          setMealEntries(storedMealEntries ? JSON.parse(storedMealEntries) : []);
          setCheckedItems(storedCheckedItems ? JSON.parse(storedCheckedItems) : {});
          setWeightHistory(storedWeightHistory ? JSON.parse(storedWeightHistory) : bodyWeightHistory);
        } catch {
          Alert.alert('Erreur', "Impossible de charger les donnees du jour.");
        }
      }

      loadTodayEntries();
    }, [])
  );

  return (
    <View style={styles.page}>
      <View style={styles.header} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroPanel}>
          <View style={styles.heroHeaderRow}>
            <Pressable
              accessibilityLabel="Jour precedent"
              style={styles.weekNavButton}
              onPress={() => setDisplayedDate((currentDate) => addDays(currentDate, -1))}>
              <Text style={styles.weekNavButtonText}>{'<'}</Text>
            </Pressable>

            <View style={styles.heroTitleBlock}>
              <Text style={styles.heroTitle}>Seance du jour</Text>
              <Text style={styles.heroDate}>
                {displayedDayLabel} {displayedShortDate}
              </Text>
            </View>

            <Pressable
              accessibilityLabel="Jour suivant"
              style={styles.weekNavButton}
              onPress={() => setDisplayedDate((currentDate) => addDays(currentDate, 1))}>
              <Text style={styles.weekNavButtonText}>{'>'}</Text>
            </Pressable>
          </View>

          <View style={styles.todayGrid}>
            <View style={styles.todayCard}>
              <Text style={styles.todayTitle}>Sport</Text>
              {displayedWorkouts.length === 0 ? (
                <Text style={styles.todayEmpty}>Aucune seance prevue.</Text>
              ) : (
                displayedWorkouts.map((entry) => (
                  <Pressable
                    key={entry.id}
                    style={styles.todayItem}
                    onPress={() => toggleChecked(entry.id)}>
                    <View style={[styles.checkbox, checkedItems[entry.id] && styles.checkboxChecked]}>
                      {checkedItems[entry.id] ? <Text style={styles.checkboxMark}>✓</Text> : null}
                    </View>
                    <View style={styles.todayItemText}>
                      <Text style={styles.todayItemName}>{entry.exerciseName}</Text>
                      <Text style={styles.todayItemMeta}>
                        {entry.weight} kg - {entry.sets} series - {entry.reps} reps
                      </Text>
                    </View>
                  </Pressable>
                ))
              )}
            </View>

            <View style={styles.todayCard}>
              <Text style={styles.todayTitle}>Nutrition</Text>
              {displayedMeals.length === 0 ? (
                <Text style={styles.todayEmpty}>Aucun repas prevu.</Text>
              ) : (
                displayedMeals.map((entry) => (
                  <Pressable
                    key={entry.id}
                    style={styles.todayItem}
                    onPress={() => toggleChecked(entry.id)}>
                    <View style={[styles.checkbox, checkedItems[entry.id] && styles.checkboxChecked]}>
                      {checkedItems[entry.id] ? <Text style={styles.checkboxMark}>✓</Text> : null}
                    </View>
                    <View style={styles.todayItemText}>
                      <Text style={styles.todayItemName}>{entry.mealName}</Text>
                      <Text style={styles.todayItemMeta}>
                        {entry.calories} kcal - {entry.protein} g proteines
                      </Text>
                    </View>
                  </Pressable>
                ))
              )}
            </View>
          </View>
        </View>

        <View style={styles.shakerCounterRow}>
          <View style={[styles.shakerCounterCard, styles.massGainerCounter]}>
            <Text style={styles.shakerCounterValue}>{completedMassGainerCount}</Text>
            <Text style={styles.shakerCounterLabel}>Mass gainer</Text>
          </View>

          <View style={[styles.shakerCounterCard, styles.proteinCounter]}>
            <Text style={styles.shakerCounterValue}>{completedProteinShakeCount}</Text>
            <Text style={styles.shakerCounterLabel}>Proteine shake</Text>
          </View>
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.sectionTitle}>Ma courbe des calories</Text>
            <View style={styles.calorieWeekControls}>
              <Pressable
                accessibilityLabel="Semaine précédente"
                style={styles.calorieWeekButton}
                onPress={() => setCalorieWeekOffset((current) => current - 1)}>
                <Text style={styles.calorieWeekButtonText}>{'<'}</Text>
              </Pressable>
              <Pressable
                accessibilityLabel="Semaine suivante"
                style={styles.calorieWeekButton}
                onPress={() => setCalorieWeekOffset((current) => current + 1)}>
                <Text style={styles.calorieWeekButtonText}>{'>'}</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.calorieMonthProgress}>
            <MonthProgress month={calorieChart.month} weekIndex={calorieChart.weekIndex} />
          </View>

          <View style={styles.calorieChartBody}>
            <View style={styles.calorieScale}>
              <Text style={styles.scaleLabel}>{calorieChart.maxCalories}</Text>
              <Text style={styles.scaleLabel}>{calorieChart.middleCalories}</Text>
              <Text style={styles.scaleLabel}>0</Text>
            </View>

            <View style={[styles.calorieLineChart, { width: chartWidth }]}>
              {calorieChart.points.slice(0, -1).map((point, index) => {
                const nextPoint = calorieChart.points[index + 1];
                const deltaX = nextPoint.x - point.x;
                const deltaY = nextPoint.y - point.y;
                const lineLength = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                const angle = `${Math.atan2(deltaY, deltaX)}rad`;

                return (
                  <View
                    key={`${point.dateKey}-${nextPoint.dateKey}`}
                    style={[
                      styles.calorieChartLine,
                      {
                        left: point.x,
                        top: point.y,
                        transform: [{ rotate: angle }],
                        width: lineLength,
                      },
                    ]}
                  />
                );
              })}

              {calorieChart.points.map((point) => (
                <View
                  key={point.dateKey}
                  style={[
                    styles.caloriePointWrap,
                    { left: point.x - 19, top: point.y - 23 },
                  ]}>
                  <Text style={styles.calorieValue}>{point.calories}</Text>
                  <View style={styles.calorieChartPoint} />
                </View>
              ))}

              {calorieChart.points.map((point, index) => (
                <View
                  key={`${point.dateKey}-label`}
                  style={[styles.calorieDateWrap, { left: point.x - 18 }]}>
                  <Text style={styles.calorieDayLabel}>
                    {['L', 'M', 'M', 'J', 'V', 'S', 'D'][index]}
                  </Text>
                  <Text style={styles.calorieDateLabel}>
                    {String(point.date.getDate()).padStart(2, '0')}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.sectionTitle}>Ma courbe du poids</Text>
            <Pressable
              accessibilityLabel="Ajouter une mesure de poids"
              style={styles.chartAddButton}
              onPress={openWeightModal}>
              <Text style={styles.chartAddButtonText}>+</Text>
            </Pressable>
          </View>

          <View style={styles.chartBody}>
            <View style={styles.scale}>
              <Text style={styles.scaleLabel}>{chartMaxWeight}</Text>
              <Text style={styles.scaleLabel}>{chartMiddleWeight}</Text>
              <Text style={styles.scaleLabel}>{chartMinWeight}</Text>
            </View>

            <View style={[styles.lineChart, { width: chartWidth }]}>
              {weightPoints.slice(0, -1).map((point, index) => {
                const nextPoint = weightPoints[index + 1];
                const deltaX = nextPoint.x - point.x;
                const deltaY = nextPoint.y - point.y;
                const lineLength = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                const angle = `${Math.atan2(deltaY, deltaX)}rad`;

                return (
                  <View
                    key={`${point.id}-${nextPoint.id}`}
                    style={[
                      styles.chartLine,
                      {
                        left: point.x,
                        top: point.y,
                        transform: [{ rotate: angle }],
                        width: lineLength,
                      },
                    ]}
                  />
                );
              })}

              {weightPoints.map((point) => (
                <View
                  key={point.id}
                  style={[
                    styles.pointWrap,
                    {
                      left: point.x - 14,
                      top: point.y - 24,
                    },
                  ]}>
                  <Text style={styles.weightLabel}>{point.weight}</Text>
                  <View style={styles.chartPoint} />
                </View>
              ))}

              {weightPoints.map((point) => (
                <View
                  key={`${point.id}-date`}
                  style={[
                    styles.dateLabelWrap,
                    {
                      left: point.x - 22,
                    },
                  ]}>
                  <Text style={styles.dateLabel} numberOfLines={1}>
                    {formatWeightDate(point.date)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={isWeightModalVisible}
        onRequestClose={() => setIsWeightModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setIsWeightModalVisible(false)}>
          <Pressable style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nouvelle mesure</Text>
            <Text style={styles.modalMeta}>Ajoute une valeur à la courbe du poids</Text>

            <Text style={styles.inputLabel}>Date</Text>
            <View style={styles.dateInputRow}>
              <View style={styles.dateField}>
                <Text style={styles.dateFieldLabel}>Jour</Text>
                <TextInput
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="JJ"
                  placeholderTextColor={AppColors.muted}
                  style={[styles.modalInput, styles.dateInput]}
                  value={weightDay}
                  onChangeText={setWeightDay}
                />
              </View>
              <View style={styles.dateField}>
                <Text style={styles.dateFieldLabel}>Mois</Text>
                <TextInput
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="MM"
                  placeholderTextColor={AppColors.muted}
                  style={[styles.modalInput, styles.dateInput]}
                  value={weightMonth}
                  onChangeText={setWeightMonth}
                />
              </View>
              <View style={styles.dateField}>
                <Text style={styles.dateFieldLabel}>Année</Text>
                <TextInput
                  keyboardType="number-pad"
                  maxLength={4}
                  placeholder="AAAA"
                  placeholderTextColor={AppColors.muted}
                  style={[styles.modalInput, styles.dateInput]}
                  value={weightYear}
                  onChangeText={setWeightYear}
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Poids mesuré (kg)</Text>
            <TextInput
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={AppColors.muted}
              style={styles.modalInput}
              value={weightValue}
              onChangeText={setWeightValue}
            />

            <Pressable style={styles.saveWeightButton} onPress={addWeightMeasurement}>
              <Text style={styles.saveWeightButtonText}>Ajouter la mesure</Text>
            </Pressable>
            <Pressable
              style={styles.closeModalButton}
              onPress={() => setIsWeightModalVisible(false)}>
              <Text style={styles.closeModalButtonText}>Fermer</Text>
            </Pressable>
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
    color: AppColors.primarySoft,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
    width: '100%',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  heroPanel: {
    backgroundColor: AppColors.surface,
    borderColor: AppColors.border,
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
  },
  heroHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroTitleBlock: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 10,
  },
  heroTitle: {
    color: AppColors.text,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  heroDate: {
    color: AppColors.primarySoft,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 3,
    textAlign: 'center',
  },
  weekNavButton: {
    alignItems: 'center',
    backgroundColor: AppColors.surfaceHigh,
    borderColor: AppColors.border,
    borderRadius: 6,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 38,
  },
  weekNavButtonText: {
    color: AppColors.text,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 22,
  },
  todayGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  todayCard: {
    backgroundColor: AppColors.surfaceHigh,
    borderColor: AppColors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 118,
    padding: 10,
  },
  todayTitle: {
    color: AppColors.accentSoft,
    fontSize: 14,
    fontWeight: '900',
  },
  todayEmpty: {
    color: AppColors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    marginTop: 8,
  },
  todayItem: {
    alignItems: 'flex-start',
    borderTopColor: AppColors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
  },
  todayItemText: {
    flex: 1,
  },
  checkbox: {
    alignItems: 'center',
    borderColor: AppColors.primarySoft,
    borderRadius: 5,
    borderWidth: 2,
    height: 20,
    justifyContent: 'center',
    marginTop: 1,
    width: 20,
  },
  checkboxChecked: {
    backgroundColor: AppColors.accent,
    borderColor: AppColors.accent,
  },
  checkboxMark: {
    color: AppColors.text,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 16,
  },
  todayItemName: {
    color: AppColors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  todayItemMeta: {
    color: AppColors.muted,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
    marginTop: 3,
  },
  shakerCounterRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  shakerCounterCard: {
    borderColor: AppColors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  massGainerCounter: {
    backgroundColor: '#3FAE6B',
  },
  proteinCounter: {
    backgroundColor: '#C24C5A',
  },
  shakerCounterValue: {
    color: AppColors.text,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  shakerCounterLabel: {
    color: AppColors.text,
    fontSize: 12,
    fontWeight: '900',
    marginTop: 2,
    textAlign: 'center',
  },
  chartCard: {
    backgroundColor: AppColors.surface,
    borderColor: AppColors.border,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 18,
  },
  chartHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calorieMonthProgress: {
    marginTop: 12,
  },
  calorieWeekControls: {
    flexDirection: 'row',
    gap: 6,
  },
  calorieWeekButton: {
    alignItems: 'center',
    backgroundColor: AppColors.surfaceHigh,
    borderColor: AppColors.border,
    borderRadius: 7,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 36,
  },
  calorieWeekButtonText: {
    color: AppColors.text,
    fontSize: 19,
    fontWeight: '900',
    lineHeight: 21,
  },
  calorieChartBody: {
    flexDirection: 'row',
    height: calorieChartHeight,
    marginTop: 16,
  },
  calorieScale: {
    height: calorieChartTrackHeight,
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  calorieLineChart: {
    height: calorieChartHeight,
    position: 'relative',
  },
  calorieChartLine: {
    backgroundColor: AppColors.accent,
    height: 4,
    position: 'absolute',
    transformOrigin: 'left center',
  },
  caloriePointWrap: {
    alignItems: 'center',
    position: 'absolute',
    width: 38,
    zIndex: 2,
  },
  calorieValue: {
    color: AppColors.text,
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 3,
  },
  calorieChartPoint: {
    backgroundColor: AppColors.accent,
    borderColor: AppColors.accentSoft,
    borderRadius: 6,
    borderWidth: 2,
    height: 12,
    width: 12,
  },
  calorieDateWrap: {
    alignItems: 'center',
    bottom: 0,
    position: 'absolute',
    width: 36,
  },
  calorieDayLabel: {
    color: AppColors.text,
    fontSize: 10,
    fontWeight: '900',
  },
  calorieDateLabel: {
    color: AppColors.muted,
    fontSize: 8,
    marginTop: 2,
  },
  chartAddButton: {
    alignItems: 'center',
    backgroundColor: AppColors.primary,
    borderRadius: 8,
    height: 34,
    justifyContent: 'center',
    width: 38,
  },
  chartAddButtonText: {
    color: AppColors.text,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 26,
  },
  sectionTitle: {
    color: AppColors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  chartBody: {
    flexDirection: 'row',
    height: chartHeight,
    marginTop: 16,
  },
  scale: {
    height: chartTrackHeight,
    justifyContent: 'space-between',
    paddingRight: 10,
  },
  scaleLabel: {
    color: AppColors.primarySoft,
    fontSize: 11,
    fontWeight: '700',
  },
  lineChart: {
    height: chartHeight,
    position: 'relative',
  },
  chartLine: {
    backgroundColor: nutritionModeColor,
    height: 4,
    position: 'absolute',
    transformOrigin: 'left center',
  },
  pointWrap: {
    alignItems: 'center',
    position: 'absolute',
    width: 28,
    zIndex: 2,
  },
  weightLabel: {
    color: AppColors.text,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 3,
  },
  chartPoint: {
    backgroundColor: nutritionModeColor,
    borderColor: nutritionModeColor,
    borderRadius: 7,
    borderWidth: 2,
    height: 14,
    width: 14,
  },
  dateLabelWrap: {
    bottom: 0,
    position: 'absolute',
    width: 44,
  },
  dateLabel: {
    color: AppColors.muted,
    fontSize: 10,
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
    borderRadius: 10,
    padding: 20,
    width: '100%',
  },
  modalTitle: {
    color: AppColors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  modalMeta: {
    color: AppColors.primarySoft,
    fontSize: 13,
    marginBottom: 18,
    marginTop: 4,
  },
  inputLabel: {
    color: AppColors.text,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: AppColors.background,
    borderColor: AppColors.border,
    borderRadius: 7,
    borderWidth: 1,
    color: AppColors.text,
    fontSize: 15,
    marginBottom: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateField: {
    flex: 1,
  },
  dateFieldLabel: {
    color: AppColors.muted,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 5,
    textAlign: 'center',
  },
  dateInput: {
    textAlign: 'center',
  },
  saveWeightButton: {
    alignItems: 'center',
    backgroundColor: AppColors.primary,
    borderRadius: 7,
    marginTop: 4,
    paddingVertical: 13,
  },
  saveWeightButtonText: {
    color: AppColors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  closeModalButton: {
    alignItems: 'center',
    backgroundColor: AppColors.surfaceHigh,
    borderRadius: 7,
    marginTop: 12,
    paddingVertical: 13,
  },
  closeModalButtonText: {
    color: AppColors.text,
    fontSize: 15,
    fontWeight: '800',
  },
});
