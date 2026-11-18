import { Tabs, usePathname } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { AppColors } from '@/constants/colors';
import { PlanningWeekProvider } from '@/contexts/planning-week-context';

const nutritionModeColor = '#A1C740';

export default function TabLayout() {
  const pathname = usePathname();
  const isPlanningNutritionMode = pathname.includes('/planning-nutrition');

  return (
    <PlanningWeekProvider>
      <Tabs
        initialRouteName="accueil"
        screenOptions={{
          tabBarActiveTintColor: AppColors.accent,
          tabBarInactiveTintColor: AppColors.muted,
          tabBarStyle: {
            backgroundColor: AppColors.surface,
            borderTopColor: AppColors.border,
          },
          headerShown: false,
          tabBarButton: HapticTab,
        }}>
        <Tabs.Screen
          name="exercices"
          options={{
            title: 'Exercices',
            tabBarIcon: ({ color }) => <MaterialIcons size={27} name="fitness-center" color={color} />,
          }}
        />
        <Tabs.Screen
          name="nutrition"
          options={{
            title: 'Nutrition',
            tabBarIcon: ({ color }) => <MaterialIcons size={27} name="restaurant" color={color} />,
          }}
        />
        <Tabs.Screen
          name="accueil"
          options={{
            title: 'Accueil',
            tabBarButton: (props) => (
              <HapticTab {...props} style={[props.style, styles.homeTabButton]} />
            ),
            tabBarIcon: ({ color }) => <MaterialIcons size={28} name="home" color={color} />,
            tabBarLabel: () => null,
            tabBarLabelStyle: styles.homeTabLabel,
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            title: 'Planning',
            tabBarIcon: ({ color }) => (
              <MaterialIcons
                size={26}
                name="calendar-today"
                color={isPlanningNutritionMode ? nutritionModeColor : color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="planning-nutrition"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="amis"
          options={{
            title: 'Amis',
            tabBarIcon: ({ color }) => <MaterialIcons size={27} name="group" color={color} />,
          }}
        />
      </Tabs>
    </PlanningWeekProvider>
  );
}

const styles = StyleSheet.create({
  homeTabButton: {
    backgroundColor: 'rgba(139, 124, 255, 0.18)',
    borderColor: 'rgba(201, 194, 255, 0.32)',
    borderRadius: 14,
    borderWidth: 1,
    marginHorizontal: 2,
    marginVertical: 5,
  },
  homeTabLabel: {
    fontWeight: '800',
  },
});
