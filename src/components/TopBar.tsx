import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type TopBarProps = {
  coins: number;
  onProfile: () => void;
};

export function TopBar({ coins, onProfile }: TopBarProps) {
  return (
    <View style={styles.topBar}>
      <View style={styles.coinPill}>
        <MaterialCommunityIcons color="#F5A623" name="gold" size={21} />
        <Text style={styles.coinText}>{coins}</Text>
        <View style={styles.plusCircle}>
          <MaterialCommunityIcons color="#FFFFFF" name="plus" size={20} />
        </View>
      </View>

      <Pressable
        accessibilityLabel="Ver perfil"
        accessibilityRole="button"
        onPress={onProfile}
        style={({ pressed }) => [styles.profileButton, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons color="#FFE8C7" name="account-circle" size={30} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8
  },
  coinPill: {
    height: 42,
    minWidth: 110,
    alignItems: "center",
    flexDirection: "row",
    borderRadius: 22,
    backgroundColor: "#FFF5D9",
    borderWidth: 2,
    borderColor: "#A96325",
    paddingLeft: 7,
    paddingRight: 5
  },
  coinText: {
    color: "#4E2D17",
    fontSize: 18,
    fontWeight: "900",
    marginLeft: 4,
    marginRight: 5
  },
  plusCircle: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: "#67AF31"
  },
  profileButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "#8A5428",
    borderWidth: 3,
    borderColor: "#5E351C",
    shadowColor: "#5D2D18",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  pressed: {
    opacity: 0.75
  }
});
