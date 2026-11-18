import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
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

import { AppColors } from '@/constants/colors';
import { type Meal } from '@/constants/mock-data';
import { customMealsStorageKey } from '@/constants/storage';

type MealCategory = {
  emoji: string;
  id: 'breakfast' | 'lunch' | 'snack' | 'dinner';
  label: string;
};

const mealCategories: MealCategory[] = [
  { emoji: '🌅', id: 'breakfast', label: 'Petit déjeuner' },
  { emoji: '☀️', id: 'lunch', label: 'Midi' },
  { emoji: '🌇', id: 'dinner', label: 'Soir' },
  { emoji: '🥤', id: 'snack', label: 'Collation' },
];

function getCategoryId(category: string): MealCategory['id'] {
  const normalizedCategory = category.trim().toLocaleLowerCase('fr-FR');

  if (normalizedCategory.includes('petit')) {
    return 'breakfast';
  }
  if (normalizedCategory.includes('collation') || normalizedCategory.includes('goûter')) {
    return 'snack';
  }
  if (normalizedCategory.includes('dîner') || normalizedCategory.includes('diner') || normalizedCategory.includes('soir')) {
    return 'dinner';
  }

  return 'lunch';
}

export default function NutritionScreen() {
  const [customMeals, setCustomMeals] = useState<Meal[]>([]);
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [listCategory, setListCategory] = useState<MealCategory | null>(null);
  const [mealCalories, setMealCalories] = useState('');
  const [mealCategory, setMealCategory] = useState<MealCategory>(mealCategories[0]);
  const [mealIngredients, setMealIngredients] = useState('');
  const [mealName, setMealName] = useState('');
  const [mealProtein, setMealProtein] = useState('');
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);

  useFocusEffect(
    useCallback(() => {
      async function loadMeals() {
        try {
          const storedMeals = await AsyncStorage.getItem(customMealsStorageKey);
          setCustomMeals(storedMeals ? JSON.parse(storedMeals) : []);
        } catch {
          Alert.alert('Erreur', 'Impossible de charger les plats.');
        }
      }

      loadMeals();
    }, [])
  );

  const listedMeals = listCategory
    ? customMeals.filter((meal) => getCategoryId(meal.category) === listCategory.id)
    : [];

  function closeEditor() {
    setIsEditorVisible(false);
    setMealCalories('');
    setMealCategory(mealCategories[0]);
    setMealIngredients('');
    setMealName('');
    setMealProtein('');
    setSelectedMeal(null);
  }

  function openCreateMeal(category: MealCategory) {
    setMealCalories('');
    setMealCategory(category);
    setMealIngredients('');
    setMealName('');
    setMealProtein('');
    setSelectedMeal(null);
    setIsEditorVisible(true);
  }

  function openEditMeal(meal: Meal) {
    const category = mealCategories.find((item) => item.id === getCategoryId(meal.category));

    setListCategory(null);
    setMealCalories(String(meal.calories));
    setMealCategory(category ?? mealCategories[0]);
    setMealIngredients(meal.ingredients ?? '');
    setMealName(meal.name);
    setMealProtein(String(meal.protein));
    setSelectedMeal(meal);
    setIsEditorVisible(true);
  }

  async function saveMeal() {
    const cleanName = mealName.trim();
    const calories = Number(mealCalories.replace(',', '.'));
    const protein = Number(mealProtein.replace(',', '.'));

    if (!cleanName) {
      Alert.alert('Nom manquant', 'Entre un nom de plat.');
      return;
    }

    if (Number.isNaN(calories) || Number.isNaN(protein) || calories < 0 || protein < 0) {
      Alert.alert('Valeurs incorrectes', 'Entre des calories et protéines valides.');
      return;
    }

    const meal: Meal = {
      calories,
      category: mealCategory.label,
      id: selectedMeal?.id ?? `custom-meal-${Date.now()}`,
      ingredients: mealIngredients.trim(),
      name: cleanName,
      protein,
    };
    const nextMeals = selectedMeal
      ? customMeals.map((storedMeal) => (storedMeal.id === selectedMeal.id ? meal : storedMeal))
      : [...customMeals, meal];

    try {
      await AsyncStorage.setItem(customMealsStorageKey, JSON.stringify(nextMeals));
      setCustomMeals(nextMeals);
      closeEditor();
    } catch {
      Alert.alert('Erreur', "Impossible d'enregistrer le plat.");
    }
  }

  return (
    <View style={styles.page}>
      <View style={styles.header} />

      <ScrollView contentContainerStyle={styles.content}>
        {mealCategories.map((category) => {
          const mealCount = customMeals.filter(
            (meal) => getCategoryId(meal.category) === category.id
          ).length;

          return (
            <View
              key={category.id}
              style={[styles.categoryCard, category.id === 'snack' && styles.collationCard]}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryTitleRow}>
                  <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                  <Text style={styles.categoryTitle}>{category.label}</Text>
                </View>
                <Text style={styles.mealCount}>
                  {mealCount} {mealCount > 1 ? 'plats enregistrés' : 'plat enregistré'}
                </Text>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.listButton}
                  onPress={() => setListCategory(category)}>
                  <Text style={styles.listButtonText}>Voir mes plats</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.addButton}
                  onPress={() => openCreateMeal(category)}>
                  <Text style={styles.addButtonText}>Ajouter un plat</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={listCategory !== null}
        onRequestClose={() => setListCategory(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setListCategory(null)}>
          <Pressable style={[styles.modalCard, styles.listModalCard]}>
            <Text style={styles.modalTitle}>Mes plats · {listCategory?.label}</Text>
            <Text style={styles.modalMeta}>Calories, protéines et ingrédients</Text>

            <ScrollView style={styles.mealList}>
              {listedMeals.length === 0 ? (
                <Text style={styles.emptyText}>Aucun plat enregistré dans cette catégorie.</Text>
              ) : (
                listedMeals.map((meal) => (
                  <View key={meal.id} style={styles.mealCard}>
                    <Text style={styles.mealName}>{meal.name}</Text>
                    <Text style={styles.mealMacros}>
                      {meal.calories} kcal · {meal.protein} g de protéines
                    </Text>
                    {meal.ingredients?.trim() ? (
                      <>
                        <Text style={styles.ingredientLabel}>Ingrédients</Text>
                        <Text style={styles.ingredients}>{meal.ingredients.trim()}</Text>
                      </>
                    ) : null}
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => openEditMeal(meal)}>
                      <Text style={styles.editButtonText}>Modifier</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity style={styles.closeButton} onPress={() => setListCategory(null)}>
              <Text style={styles.closeButtonText}>Fermer</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={isEditorVisible}
        onRequestClose={closeEditor}>
        <Pressable style={styles.modalOverlay} onPress={closeEditor}>
          <Pressable style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {selectedMeal ? 'Modifier le plat' : 'Ajouter un plat'}
            </Text>
            <Text style={styles.modalMeta}>{mealCategory.label}</Text>

            <TextInput
              style={styles.input}
              value={mealName}
              onChangeText={setMealName}
              placeholder="Nom du plat"
              placeholderTextColor={AppColors.muted}
            />

            <View style={styles.numberInputRow}>
              <View style={styles.numberField}>
                <TextInput
                  style={[styles.input, styles.numberInput]}
                  value={mealCalories}
                  onChangeText={setMealCalories}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={AppColors.muted}
                />
                <Text style={styles.inputLabel}>kcal</Text>
              </View>
              <View style={styles.numberField}>
                <TextInput
                  style={[styles.input, styles.numberInput]}
                  value={mealProtein}
                  onChangeText={setMealProtein}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={AppColors.muted}
                />
                <Text style={styles.inputLabel}>protéines (g)</Text>
              </View>
            </View>

            <TextInput
              multiline
              numberOfLines={4}
              style={[styles.input, styles.ingredientsInput]}
              value={mealIngredients}
              onChangeText={setMealIngredients}
              placeholder="Ingrédients (ex. poulet, riz, tomates...)"
              placeholderTextColor={AppColors.muted}
              textAlignVertical="top"
            />

            <TouchableOpacity style={styles.saveButton} onPress={saveMeal}>
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={closeEditor}>
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
    backgroundColor: AppColors.surface,
    borderBottomColor: AppColors.border,
    borderBottomWidth: 1,
    minHeight: 65,
  },
  content: {
    flexGrow: 1,
    gap: 12,
    padding: 12,
    paddingBottom: 32,
  },
  categoryCard: {
    backgroundColor: AppColors.surface,
    borderColor: AppColors.border,
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
  },
  collationCard: {
    marginTop: 'auto',
  },
  categoryHeader: {
    marginBottom: 14,
  },
  categoryTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  categoryEmoji: {
    fontSize: 22,
  },
  categoryTitle: {
    color: AppColors.text,
    fontSize: 19,
    fontWeight: '900',
  },
  mealCount: {
    color: AppColors.muted,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  listButton: {
    alignItems: 'center',
    backgroundColor: AppColors.surfaceHigh,
    borderColor: AppColors.border,
    borderRadius: 7,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 8,
  },
  listButtonText: {
    color: AppColors.primarySoft,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: AppColors.primary,
    borderRadius: 7,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 8,
  },
  addButtonText: {
    color: AppColors.text,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: AppColors.overlay,
    flex: 1,
    justifyContent: 'center',
    padding: 22,
  },
  modalCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 10,
    maxHeight: '84%',
    padding: 18,
    width: '100%',
  },
  listModalCard: {
    maxHeight: '88%',
  },
  modalTitle: {
    color: AppColors.text,
    fontSize: 21,
    fontWeight: '900',
  },
  modalMeta: {
    color: AppColors.primarySoft,
    fontSize: 13,
    marginBottom: 14,
    marginTop: 4,
  },
  mealList: {
    maxHeight: 450,
  },
  mealCard: {
    backgroundColor: AppColors.background,
    borderColor: AppColors.border,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 9,
    padding: 12,
  },
  mealName: {
    color: AppColors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  mealMacros: {
    color: AppColors.primarySoft,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  ingredientLabel: {
    color: AppColors.muted,
    fontSize: 11,
    fontWeight: '900',
    marginTop: 10,
    textTransform: 'uppercase',
  },
  ingredients: {
    color: AppColors.text,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  editButton: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: AppColors.surfaceHigh,
    borderRadius: 6,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  editButtonText: {
    color: AppColors.primarySoft,
    fontSize: 12,
    fontWeight: '900',
  },
  emptyText: {
    color: AppColors.muted,
    fontSize: 14,
    paddingVertical: 18,
    textAlign: 'center',
  },
  input: {
    backgroundColor: AppColors.background,
    borderColor: AppColors.border,
    borderRadius: 7,
    borderWidth: 1,
    color: AppColors.text,
    fontSize: 15,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  numberInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  numberField: {
    flex: 1,
  },
  numberInput: {
    marginBottom: 4,
    textAlign: 'center',
  },
  inputLabel: {
    color: AppColors.muted,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  ingredientsInput: {
    minHeight: 92,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: AppColors.primary,
    borderRadius: 7,
    paddingVertical: 13,
  },
  saveButtonText: {
    color: AppColors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: AppColors.surfaceHigh,
    borderRadius: 7,
    marginTop: 12,
    paddingVertical: 13,
  },
  closeButtonText: {
    color: AppColors.text,
    fontSize: 15,
    fontWeight: '800',
  },
});
