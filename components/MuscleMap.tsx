import { useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

export type MuscleMapGroup = {
  count: number;
  id: string;
  label: string;
};

type MuscleMapProps = {
  groups: MuscleMapGroup[];
  onSelect: (groupId: string) => void;
};

const muscleOrder = ['cou', 'epaules', 'pectoraux', 'dos', 'bras', 'abdos', 'fessiers', 'cuisses', 'mollets'];

const badgePositions: Record<string, object> = {
  cou: { right: 8, top: 45 },
  epaules: { left: 8, top: 78 },
  pectoraux: { right: 8, top: 100 },
  dos: { left: 8, top: 128 },
  bras: { left: 8, top: 174 },
  abdos: { right: 8, top: 154 },
  fessiers: { right: 8, top: 218 },
  cuisses: { left: 8, top: 287 },
  mollets: { right: 8, top: 369 },
};

const purple = '#4D2A73';
const orange = '#FF7A1A';

export function MuscleMap({ groups, onSelect }: MuscleMapProps) {
  const [selectedId, setSelectedId] = useState('pectoraux');
  const scale = useRef(new Animated.Value(1)).current;
  const visibleGroups = muscleOrder
    .map((id) => groups.find((group) => group.id === id))
    .filter((group): group is MuscleMapGroup => Boolean(group));

  function selectMuscle(groupId: string) {
    setSelectedId(groupId);
    scale.stopAnimation();
    scale.setValue(1);
    Animated.sequence([
      Animated.timing(scale, { duration: 60, toValue: 0.985, useNativeDriver: true }),
      Animated.timing(scale, { duration: 90, toValue: 1, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) onSelect(groupId);
    });
  }

  const fill = (id: string) => (selectedId === id ? orange : purple);
  const stroke = (id: string) => (selectedId === id ? '#FFB166' : '#76509D');

  return (
    <View style={styles.container}>
      <View style={styles.stage}>
        <Animated.View style={[styles.silhouette, { transform: [{ scale }] }]}>
          <Svg height="100%" viewBox="0 0 180 360" width="100%">
            <G fill="#17131F" stroke="#60447F" strokeWidth="2">
              <Circle cx="90" cy="27" r="20" />
              <Rect x="81" y="47" width="18" height="19" rx="7" />
              <Path d="M60 72 Q90 57 120 72 L112 170 Q90 188 68 170 Z" />
              <Path d="M59 78 Q43 84 36 121 L28 184 Q28 197 39 199 L51 136 66 99 Z" />
              <Path d="M121 78 Q137 84 144 121 L152 184 Q152 197 141 199 L129 136 114 99 Z" />
              <Path d="M68 168 Q90 183 112 168 L117 207 Q90 222 63 207 Z" />
              <Path d="M63 203 L89 209 82 285 72 349 50 349 57 279 Z" />
              <Path d="M117 203 L91 209 98 285 108 349 130 349 123 279 Z" />
            </G>

            <Path
              d="M82 49 Q90 56 98 49 L98 67 82 67 Z"
              fill={fill('cou')}
              onPress={() => selectMuscle('cou')}
              stroke={stroke('cou')}
            />
            <Path
              d="M51 83 Q62 68 78 75 L72 99 55 104 Z M129 83 Q118 68 102 75 L108 99 125 104 Z"
              fill={fill('epaules')}
              onPress={() => selectMuscle('epaules')}
              stroke={stroke('epaules')}
            />

            <G>
              <Path
                d="M73 78 Q90 69 107 78 L111 151 Q101 168 90 172 79 168 69 151 Z"
                fill={fill('dos')}
                onPress={() => selectMuscle('dos')}
                stroke={stroke('dos')}
              />
              <Path
                d="M68 86 Q78 76 89 84 L89 112 Q77 116 67 105 Z M91 84 Q102 76 112 86 L113 105 Q103 116 91 112 Z"
                fill={fill('pectoraux')}
                onPress={() => selectMuscle('pectoraux')}
                stroke={stroke('pectoraux')}
              />
              <Path
                d="M78 116 Q90 110 102 116 L104 164 Q90 174 76 164 Z"
                fill={fill('abdos')}
                onPress={() => selectMuscle('abdos')}
                stroke={stroke('abdos')}
              />
              <Ellipse
                cx="77"
                cy="193"
                fill={fill('fessiers')}
                onPress={() => selectMuscle('fessiers')}
                rx="15"
                ry="18"
                stroke={stroke('fessiers')}
              />
              <Ellipse
                cx="103"
                cy="193"
                fill={fill('fessiers')}
                onPress={() => selectMuscle('fessiers')}
                rx="15"
                ry="18"
                stroke={stroke('fessiers')}
              />
            </G>

            <Path
              d="M48 101 Q57 95 62 106 L51 145 43 182 33 180 40 123 Z M132 101 Q123 95 118 106 L129 145 137 182 147 180 140 123 Z"
              fill={fill('bras')}
              onPress={() => selectMuscle('bras')}
              stroke={stroke('bras')}
            />
            <Path
              d="M65 213 Q76 207 87 214 L80 278 60 276 Z M115 213 Q104 207 93 214 L100 278 120 276 Z"
              fill={fill('cuisses')}
              onPress={() => selectMuscle('cuisses')}
              stroke={stroke('cuisses')}
            />
            <Path
              d="M59 284 L79 286 70 340 53 340 Z M121 284 L101 286 110 340 127 340 Z"
              fill={fill('mollets')}
              onPress={() => selectMuscle('mollets')}
              stroke={stroke('mollets')}
            />
          </Svg>
        </Animated.View>

        {visibleGroups.map((group) => {
          const selected = group.id === selectedId;
          return (
            <TouchableOpacity
              key={group.id}
              activeOpacity={0.8}
              accessibilityLabel={`${group.label}, ${group.count} exercices`}
              style={[
                styles.badge,
                badgePositions[group.id],
                selected && styles.badgeSelected,
              ]}
              onPress={() => selectMuscle(group.id)}>
              <Text numberOfLines={1} style={[styles.badgeLabel, selected && styles.badgeLabelSelected]}>
                {group.label}
              </Text>
              <Text style={[styles.badgeCount, selected && styles.badgeCountSelected]}>
                {group.count}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center', maxWidth: 370, paddingHorizontal: 12, paddingTop: 12, width: '100%',
  },
  stage: { height: 470, marginTop: 10, position: 'relative' },
  silhouette: { alignSelf: 'center', height: 440, position: 'absolute', top: 6, width: 220 },
  badge: {
    alignItems: 'center', backgroundColor: 'rgba(18, 15, 22, 0.96)', borderColor: '#49365A',
    borderRadius: 9, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between',
    minHeight: 36, paddingHorizontal: 9, position: 'absolute', width: 108,
  },
  badgeSelected: { backgroundColor: '#24170E', borderColor: orange },
  badgeLabel: { color: '#D8D0DF', flex: 1, fontSize: 11, fontWeight: '800' },
  badgeLabelSelected: { color: '#FFFFFF' },
  badgeCount: { color: '#A88BC6', fontSize: 11, fontWeight: '900', marginLeft: 6 },
  badgeCountSelected: { color: orange },
});
