import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { AppColors } from '@/constants/colors';
import { profile, weekDays } from '@/constants/mock-data';

type PlanningMode = 'workouts' | 'nutrition';

const encouragementCount = 24;
const myBadges = ['Prise de masse', 'Prise de force', 'Performance athlétique'];

type Friend = {
  badges: string[];
  gym: string;
  initial: string;
  name: string;
  nutrition: Record<string, string[]>;
  workouts: Record<string, string[]>;
};

const friends: Friend[] = [
  {
    badges: ['Hypertrophie', 'Nutrition'],
    gym: 'Basic Fit Toul',
    initial: 'L',
    name: 'LucasFit',
    workouts: {
      Lundi: ['Développé couché · 4 × 10', 'Élévations latérales · 4 × 12'],
      Mercredi: ['Squat · 4 × 8', 'Fentes · 3 × 12'],
      Vendredi: ['Tractions · 4 × 8', 'Curl biceps · 3 × 12'],
    },
    nutrition: {
      Lundi: ['Porridge · 430 kcal', 'Poulet riz · 620 kcal'],
      Mercredi: ['Omelette · 390 kcal', 'Saumon pâtes · 710 kcal'],
      Vendredi: ['Yaourt protéiné · 260 kcal', 'Poulet riz · 620 kcal'],
    },
  },
  {
    badges: ['Force', 'Squat'],
    gym: 'Fitness Park Nancy',
    initial: 'M',
    name: 'MayaPower',
    workouts: {
      Mardi: ['Squat · 5 × 5', 'Hip thrust · 4 × 8'],
      Jeudi: ['Développé militaire · 5 × 5', 'Tractions · 4 × 6'],
      Samedi: ['Soulevé de terre · 5 × 5', 'Gainage · 4 séries'],
    },
    nutrition: {
      Mardi: ['Porridge · 430 kcal', 'Saumon pâtes · 710 kcal'],
      Jeudi: ['Omelette · 390 kcal', 'Poulet riz · 620 kcal'],
      Samedi: ['Shake banane · 340 kcal', 'Saumon pâtes · 710 kcal'],
    },
  },
  {
    badges: ['Endurance', 'Mobilité'],
    gym: 'Keepcool Laxou',
    initial: 'N',
    name: 'NolanMove',
    workouts: {
      Lundi: ['Fentes · 4 × 15', 'Gainage · 4 séries'],
      Mercredi: ['Pompes · 5 × 15', 'Tractions · 4 × 8'],
      Dimanche: ['Squat · 4 × 15', 'Mollets debout · 4 × 20'],
    },
    nutrition: {
      Lundi: ['Omelette · 390 kcal', 'Poulet riz · 620 kcal'],
      Mercredi: ['Yaourt protéiné · 260 kcal', 'Saumon pâtes · 710 kcal'],
      Dimanche: ['Porridge · 430 kcal', 'Shake banane · 340 kcal'],
    },
  },
  {
    badges: ['Performance', 'Cardio'],
    gym: 'Basic Fit Nancy Centre',
    initial: 'S',
    name: 'SarahRun',
    workouts: {
      Mardi: ['Fentes · 4 × 12', 'Mollets debout · 4 × 18'],
      Jeudi: ['Pompes · 5 × 12', 'Gainage · 5 séries'],
      Samedi: ['Squat · 4 × 12', 'Hip thrust · 4 × 10'],
    },
    nutrition: {
      Mardi: ['Porridge · 430 kcal', 'Yaourt protéiné · 260 kcal'],
      Jeudi: ['Poulet riz · 620 kcal', 'Shake banane · 340 kcal'],
      Samedi: ['Omelette · 390 kcal', 'Saumon pâtes · 710 kcal'],
    },
  },
  {
    badges: ['Prise de masse', 'Dos'],
    gym: 'Basic Fit Dommartin les Toul',
    initial: 'E',
    name: 'EthanBulk',
    workouts: {
      Lundi: ['Tractions · 5 × 8', 'Soulevé de terre · 4 × 6'],
      Mercredi: ['Développé couché · 5 × 8', 'Curl biceps · 4 × 10'],
      Vendredi: ['Squat · 5 × 8', 'Hip thrust · 4 × 10'],
    },
    nutrition: {
      Lundi: ['Shaker mass gainer · 1500 kcal', 'Poulet riz · 620 kcal'],
      Mercredi: ['Porridge · 430 kcal', 'Saumon pâtes · 710 kcal'],
      Vendredi: ['Omelette · 390 kcal', 'Shaker mass gainer · 1500 kcal'],
    },
  },
];

export default function AmisScreen() {
  const [planningMode, setPlanningMode] = useState<PlanningMode>('workouts');
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);

  function openPlanning(friend: Friend) {
    setPlanningMode('workouts');
    setSelectedFriend(friend);
  }

  return (
    <View style={styles.page}>
      <View style={styles.header} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileOuterBorder}>
          <View style={[styles.profileBorderHalf, styles.profileBorderOrange]} />
          <View style={[styles.profileBorderHalf, styles.profileBorderGreen]} />
          <View style={styles.profileInnerBorder}>
            <View style={styles.profileHeader}>
              <View style={[styles.avatar, styles.profileAvatar]}>
                <Text style={styles.avatarText}>{profile.firstName.charAt(0)}</Text>
              </View>

              <View style={styles.friendInfo}>
                <Text style={styles.profileName}>{profile.firstName}</Text>
                <Text style={styles.friendGym}>Basic Fit Dommartin les Toul</Text>
                <View style={styles.badgeWrap}>
                  {myBadges.map((badge) => (
                    <View key={badge} style={styles.badge}>
                      <Text style={styles.badgeText}>{badge}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.encouragementCounter}>
              <Text style={styles.encouragementIcon}>👏</Text>
              <Text style={styles.encouragementValue}>{encouragementCount}</Text>
              <Text style={styles.encouragementLabel}>encouragements reçus</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Mes amis</Text>

        {friends.map((friend) => (
          <View key={friend.name} style={styles.friendCard}>
            <View style={styles.friendHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{friend.initial}</Text>
              </View>

              <View style={styles.friendInfo}>
                <Text style={styles.friendName}>{friend.name}</Text>
                <Text style={styles.friendGym}>{friend.gym}</Text>
                <View style={styles.badgeWrap}>
                  {friend.badges.map((badge) => (
                    <View key={badge} style={styles.badge}>
                      <Text style={styles.badgeText}>{badge}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.encourageButton}>
                <Text style={styles.encourageButtonText}>Encourager</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.planningButton} onPress={() => openPlanning(friend)}>
                <Text style={styles.planningButtonText}>Voir le planning</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={selectedFriend !== null}
        onRequestClose={() => setSelectedFriend(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedFriend(null)}>
          <Pressable style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Planning de {selectedFriend?.name}</Text>
                <Text style={styles.readOnlyLabel}>Lecture seule</Text>
              </View>
            </View>

            <View style={styles.modeSwitch}>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  planningMode === 'workouts' && styles.workoutModeButtonActive,
                ]}
                onPress={() => setPlanningMode('workouts')}>
                <Text
                  style={[
                    styles.modeButtonText,
                    planningMode === 'workouts' && styles.modeButtonTextActive,
                  ]}>
                  Exercices
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  planningMode === 'nutrition' && styles.nutritionModeButtonActive,
                ]}
                onPress={() => setPlanningMode('nutrition')}>
                <Text
                  style={[
                    styles.modeButtonText,
                    planningMode === 'nutrition' && styles.modeButtonTextActive,
                  ]}>
                  Nutrition
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.planningList}>
              {weekDays.map((day) => {
                const entries = selectedFriend?.[planningMode][day] ?? [];

                return (
                  <View key={day} style={styles.dayRow}>
                    <Text style={styles.dayName}>{day}</Text>
                    <View style={styles.dayEntries}>
                      {entries.length === 0 ? (
                        <Text style={styles.emptyDay}>
                          {planningMode === 'workouts' ? 'Repos' : 'Aucun repas prévu'}
                        </Text>
                      ) : (
                        entries.map((entry) => (
                          <View key={entry} style={styles.entryPill}>
                            <Text style={styles.entryText}>{entry}</Text>
                          </View>
                        ))
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedFriend(null)}>
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
    padding: 16,
    paddingBottom: 32,
  },
  profileOuterBorder: {
    borderRadius: 13,
    marginBottom: 22,
    overflow: 'hidden',
    padding: 2,
    position: 'relative',
  },
  profileBorderHalf: {
    bottom: 0,
    position: 'absolute',
    top: 0,
    width: '50%',
  },
  profileBorderOrange: {
    backgroundColor: AppColors.accent,
    left: 0,
  },
  profileBorderGreen: {
    backgroundColor: '#A1C740',
    right: 0,
  },
  profileInnerBorder: {
    backgroundColor: AppColors.surface,
    borderRadius: 11,
    padding: 13,
    zIndex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  profileAvatar: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.accent,
  },
  profileName: {
    color: AppColors.text,
    fontSize: 19,
    fontWeight: '900',
  },
  encouragementCounter: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: AppColors.surfaceHigh,
    borderRadius: 8,
    flexDirection: 'row',
    marginTop: 13,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  encouragementIcon: {
    fontSize: 15,
    marginRight: 6,
  },
  encouragementValue: {
    color: AppColors.accent,
    fontSize: 15,
    fontWeight: '900',
    marginRight: 5,
  },
  encouragementLabel: {
    color: AppColors.muted,
    fontSize: 11,
    fontWeight: '800',
  },
  sectionTitle: {
    color: AppColors.surface,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 14,
  },
  friendCard: {
    backgroundColor: AppColors.surface,
    borderColor: AppColors.border,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
    padding: 13,
  },
  friendHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: AppColors.surfaceHigh,
    borderColor: AppColors.primary,
    borderRadius: 27,
    borderWidth: 2,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  avatarText: {
    color: AppColors.text,
    fontSize: 21,
    fontWeight: '900',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    color: AppColors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  friendGym: {
    color: AppColors.accentSoft,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 7,
    marginTop: 2,
  },
  badgeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    backgroundColor: AppColors.surfaceHigh,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  badgeText: {
    color: AppColors.primarySoft,
    fontSize: 10,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  encourageButton: {
    alignItems: 'center',
    backgroundColor: AppColors.surfaceHigh,
    borderRadius: 7,
    flex: 1,
    paddingVertical: 10,
  },
  encourageButtonText: {
    color: AppColors.accentSoft,
    fontSize: 12,
    fontWeight: '900',
  },
  planningButton: {
    alignItems: 'center',
    backgroundColor: AppColors.primary,
    borderRadius: 7,
    flex: 1.4,
    paddingVertical: 10,
  },
  planningButtonText: {
    color: AppColors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: AppColors.overlay,
    flex: 1,
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 10,
    maxHeight: '90%',
    padding: 18,
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalTitle: {
    color: AppColors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  readOnlyLabel: {
    color: AppColors.muted,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 3,
  },
  modeSwitch: {
    backgroundColor: AppColors.background,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
    marginTop: 15,
    padding: 4,
  },
  modeButton: {
    alignItems: 'center',
    borderRadius: 6,
    flex: 1,
    paddingVertical: 9,
  },
  workoutModeButtonActive: {
    backgroundColor: AppColors.accent,
  },
  nutritionModeButtonActive: {
    backgroundColor: '#A1C740',
  },
  modeButtonText: {
    color: AppColors.muted,
    fontSize: 12,
    fontWeight: '900',
  },
  modeButtonTextActive: {
    color: AppColors.text,
  },
  planningList: {
    maxHeight: 480,
  },
  dayRow: {
    borderTopColor: AppColors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 10,
  },
  dayName: {
    color: AppColors.text,
    fontSize: 12,
    fontWeight: '900',
    paddingTop: 6,
    width: 68,
  },
  dayEntries: {
    flex: 1,
    gap: 6,
  },
  entryPill: {
    backgroundColor: AppColors.surfaceHigh,
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  entryText: {
    color: AppColors.text,
    fontSize: 11,
    fontWeight: '700',
  },
  emptyDay: {
    color: AppColors.muted,
    fontSize: 11,
    fontStyle: 'italic',
    paddingVertical: 7,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: AppColors.surfaceHigh,
    borderRadius: 7,
    marginTop: 14,
    paddingVertical: 12,
  },
  closeButtonText: {
    color: AppColors.text,
    fontSize: 14,
    fontWeight: '900',
  },
});
