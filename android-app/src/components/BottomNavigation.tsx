// Touch navigation remains available everywhere, even when voice control is active.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AppScreen } from '../voice/commands';
import { colors, type } from '../theme/palette';

type Props = {
  activeScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
};

const destinations: { screen: AppScreen; label: string; mark: string }[] = [
  { screen: 'overview', label: 'Today', mark: 'O' },
  { screen: 'finance', label: 'Money', mark: '₿' },
  { screen: 'health', label: 'Health', mark: '+' },
];

export function BottomNavigation({ activeScreen, onNavigate }: Props) {
  return (
    <View style={styles.navigation}>
      {destinations.map((destination) => {
        const selected = destination.screen === activeScreen;
        return (
          <Pressable
            key={destination.screen}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onNavigate(destination.screen)}
            style={styles.destination}
          >
            <Text style={[styles.mark, selected && styles.selectedMark]}>{destination.mark}</Text>
            <Text style={[styles.label, selected && styles.selectedLabel]}>{destination.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  navigation: {
    minHeight: 66,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    backgroundColor: colors.paper,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    paddingBottom: 4,
  },
  destination: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  mark: { color: colors.muted, fontFamily: type.mono, fontSize: 16, height: 19 },
  selectedMark: { color: colors.red },
  label: { color: colors.muted, fontFamily: type.medium, fontSize: 11 },
  selectedLabel: { color: colors.ink },
});