import { StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/colors';

const activeWeekColor = '#6D5ACF';
const inactiveWeekColor = '#C9C2FF';

type MonthProgressProps = {
  compact?: boolean;
  month: string;
  weekIndex: number;
};

export function MonthProgress({ compact = false, month, weekIndex }: MonthProgressProps) {
  return (
    <View style={styles.container}>
      <Text style={[styles.month, compact && styles.monthCompact]}>{month}</Text>
      <View
        accessibilityLabel={`${month}, semaine ${weekIndex + 1} sur 4`}
        accessibilityRole="progressbar"
        accessibilityValue={{ max: 4, min: 1, now: weekIndex + 1 }}
        style={[styles.progress, compact && styles.progressCompact]}>
        {Array.from({ length: 4 }, (_, index) => (
          <View
            key={index}
            style={[
              styles.segment,
              compact && styles.segmentCompact,
              { backgroundColor: index === weekIndex ? activeWeekColor : inactiveWeekColor },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  month: {
    color: AppColors.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  monthCompact: {
    fontSize: 16,
    lineHeight: 18,
  },
  progress: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    maxWidth: 220,
    width: '62%',
  },
  progressCompact: {
    marginTop: 4,
  },
  segment: {
    borderRadius: 999,
    flex: 1,
    height: 4,
  },
  segmentCompact: {
    height: 3,
  },
});
