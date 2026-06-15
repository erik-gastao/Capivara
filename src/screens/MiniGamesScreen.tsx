import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { ActionButton } from "../components/ActionButton";
import { GameBottomNav } from "../components/GameBottomNav";
import { RootStackParamList } from "../types/game";

type Props = NativeStackScreenProps<RootStackParamList, "MiniGames">;

const games: Array<{
  title: string;
  subtitle: string;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor: string;
  enabled: boolean;
  color: string;
  route: keyof RootStackParamList;
}> = [
  {
    title: "Pegue a comida",
    subtitle: "Pinhas da araucária",
    iconName: "food-apple",
    iconColor: "#F06445",
    enabled: true,
    color: "#BDEBFF",
    route: "CatchFoodGame"
  },
  {
    title: "Memória",
    subtitle: "Cartas iguais",
    iconName: "cards",
    iconColor: "#7D66D6",
    enabled: true,
    color: "#D8C8FF",
    route: "MemoryGame"
  },
  {
    title: "Arremesso",
    subtitle: "Em breve",
    iconName: "basket",
    iconColor: "#B36B24",
    enabled: false,
    color: "#BFF2D4",
    route: "MiniGames"
  }
];

export function MiniGamesScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.phoneFrame}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.notch} />

          <View style={styles.headerRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.goBack()}
              style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]}
            >
              <MaterialCommunityIcons color="#7B451F" name="arrow-left" size={27} />
            </Pressable>
            <View style={styles.woodHeader}>
              <MaterialCommunityIcons color="#78B747" name="leaf" size={22} />
              <Text style={styles.title}>Minijogos</Text>
            </View>
          </View>

          <View style={styles.list}>
            {games.map((game) => (
              <Pressable
                accessibilityRole="button"
                disabled={!game.enabled}
                key={game.title}
                onPress={() => game.enabled && navigation.navigate(game.route as never)}
                style={({ pressed }) => [
                  styles.gameCard,
                  { backgroundColor: game.color },
                  !game.enabled && styles.disabledCard,
                  pressed && styles.pressed
                ]}
              >
                <View style={styles.gameIconBox}>
                  <MaterialCommunityIcons
                    color={game.iconColor}
                    name={game.iconName}
                    size={43}
                  />
                </View>
                <View style={styles.gameText}>
                  <Text style={styles.gameTitle}>{game.title}</Text>
                  <Text style={styles.gameSubtitle}>{game.subtitle}</Text>
                </View>
                <View style={styles.playButton}>
                  <MaterialCommunityIcons color="#FFFFFF" name="play" size={30} />
                </View>
              </Pressable>
            ))}
          </View>

          <ActionButton label="Voltar" onPress={() => navigation.goBack()} variant="soft" />

          <GameBottomNav
            active="games"
            onGames={() => navigation.navigate("MiniGames")}
            onHome={() => navigation.navigate("Game")}
            onProfile={() => navigation.navigate("Profile")}
            onShop={() => navigation.navigate("Shop")}
          />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#202020",
    padding: 6
  },
  phoneFrame: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 34,
    backgroundColor: "#F7E2B8",
    borderWidth: 4,
    borderColor: "#161616"
  },
  container: {
    flexGrow: 1,
    padding: 12,
    paddingTop: 20,
    paddingBottom: 14
  },
  notch: {
    position: "absolute",
    top: 0,
    left: "36%",
    right: "36%",
    height: 22,
    borderBottomLeftRadius: 13,
    borderBottomRightRadius: 13,
    backgroundColor: "#161616"
  },
  headerRow: {
    minHeight: 56,
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 14
  },
  roundButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: "#FFF4D8",
    borderWidth: 2,
    borderColor: "#B87534"
  },
  woodHeader: {
    flex: 1,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    borderRadius: 18,
    backgroundColor: "#8A5428",
    borderWidth: 3,
    borderColor: "#5E351C",
    paddingHorizontal: 12
  },
  title: {
    color: "#FFF5DF",
    fontSize: 30,
    fontWeight: "900",
    marginLeft: 6,
    textAlign: "center",
    textShadowColor: "#5E351C",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 1
  },
  list: {
    gap: 12,
    marginBottom: 14
  },
  gameCard: {
    minHeight: 112,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 22,
    borderWidth: 3,
    borderColor: "#C1843C",
    padding: 12,
    shadowColor: "#6D4322",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5
  },
  disabledCard: {
    opacity: 0.78
  },
  gameIconBox: {
    width: 78,
    height: 78,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#FFF8E7",
    borderWidth: 2,
    borderColor: "#C1843C",
    marginRight: 12
  },
  gameText: {
    flex: 1
  },
  gameTitle: {
    color: "#5B3318",
    fontSize: 22,
    fontWeight: "900"
  },
  gameSubtitle: {
    color: "#7C5732",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 4
  },
  playButton: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 26,
    backgroundColor: "#77B936",
    borderWidth: 3,
    borderColor: "#4F8626"
  },
  pressed: {
    opacity: 0.72
  }
});
