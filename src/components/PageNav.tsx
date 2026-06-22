import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { RoomName } from "../types/game";

export type PageInfo = {
  label: string;
  room: RoomName | null;
};

export const ROOM_PAGES: PageInfo[] = [
  { label: "Início",    room: null       },
  { label: "Alimentar", room: "Kitchen"  },
  { label: "Brincar",   room: "Garden"   },
  { label: "Dormir",    room: "Bedroom"  },
  { label: "Banho",     room: "Bathroom" },
];

type Props = {
  currentPage: number;
  onPrev?: () => void;
  onNext?: () => void;
};

export function PageNav({ currentPage, onPrev, onNext }: Props) {
  const label = ROOM_PAGES[currentPage]?.label ?? "";

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Pressable
          accessibilityLabel="Cômodo anterior"
          accessibilityRole="button"
          disabled={!onPrev}
          onPress={onPrev}
          style={[styles.arrow, !onPrev && styles.arrowHidden]}
        >
          <MaterialCommunityIcons color="#8A5428" name="chevron-left" size={32} />
        </Pressable>

        <View style={styles.dotsGroup}>
          {ROOM_PAGES.map((_, i) => (
            <View key={i} style={[styles.dot, i === currentPage && styles.dotActive]} />
          ))}
        </View>

        <Pressable
          accessibilityLabel="Próximo cômodo"
          accessibilityRole="button"
          disabled={!onNext}
          onPress={onNext}
          style={[styles.arrow, !onNext && styles.arrowHidden]}
        >
          <MaterialCommunityIcons color="#8A5428" name="chevron-right" size={32} />
        </Pressable>
      </View>

      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: 8
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  arrow: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "#FFF5D9",
    borderWidth: 2,
    borderColor: "#A96325"
  },
  arrowHidden: {
    opacity: 0
  },
  dotsGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#C49A52",
    opacity: 0.4
  },
  dotActive: {
    opacity: 1,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: "#5D351C"
  },
  label: {
    color: "#5D351C",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 5,
    textAlign: "center"
  }
});
