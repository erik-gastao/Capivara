import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { GameBottomNav } from "../components/GameBottomNav";
import { RootStackParamList } from "../types/game";

const capybaraHero = require("../../assets/images/capybara-hero.png");

type Props = NativeStackScreenProps<RootStackParamList, "Profile">;

const evolution: Array<{
  label: string;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  active?: boolean;
}> = [
  { label: "Bebê", iconName: "baby-face-outline" },
  { label: "Jovem", iconName: "face-man-profile" },
  { label: "Adulto", iconName: "face-man-profile", active: true },
  { label: "Sábio", iconName: "help" }
];

export function ProfileScreen({ navigation }: Props) {
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

            <View style={styles.namePlate}>
              <Text style={styles.name}>Cacau</Text>
              <MaterialCommunityIcons color="#8A5428" name="pencil" size={21} />
            </View>

            <View style={styles.heartButton}>
              <MaterialCommunityIcons color="#FFE8C7" name="heart" size={29} />
            </View>
          </View>

          <View style={styles.heroArea}>
            <View style={styles.levelCard}>
              <View style={styles.levelTitleRow}>
                <MaterialCommunityIcons color="#F5BD2F" name="star" size={29} />
                <Text style={styles.levelText}>Nível 12</Text>
              </View>
              <View style={styles.levelTrack}>
                <View style={styles.levelFill} />
              </View>
              <Text style={styles.levelPoints}>680 / 1000</Text>
            </View>

            <View style={styles.capybaraStage}>
              <Image
                accessibilityLabel="Capivara Cacau no perfil"
                resizeMode="cover"
                source={capybaraHero}
                style={styles.capybaraImage}
              />
              <View style={styles.rug} />
            </View>
          </View>

          <View style={styles.evolutionPanel}>
            <Text style={styles.sectionTitle}>Evolução</Text>
            <View style={styles.evolutionRow}>
              {evolution.map((stage, index) => (
                <View key={stage.label} style={styles.evolutionItemWrap}>
                  <View style={[styles.evolutionItem, stage.active && styles.activeEvolutionItem]}>
                    <MaterialCommunityIcons
                      color={stage.active ? "#9A5F25" : "#A57745"}
                      name={stage.iconName}
                      size={26}
                    />
                    <Text style={styles.evolutionLabel}>{stage.label}</Text>
                  </View>
                  {index < evolution.length - 1 ? (
                    <Text style={styles.arrow}>→</Text>
                  ) : null}
                </View>
              ))}
            </View>
          </View>

          <View style={styles.tipBox}>
            <Text style={styles.tipText}>
              Continue cuidando bem da sua capivara para desbloquear novas evoluções!
            </Text>
            <MaterialCommunityIcons color="#6DA13A" name="leaf" size={27} />
          </View>

          <GameBottomNav
            active="profile"
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
    marginBottom: 10
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
  namePlate: {
    flex: 1,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    borderRadius: 17,
    backgroundColor: "#FFF6DF",
    borderWidth: 2,
    borderColor: "#C99655"
  },
  name: {
    color: "#6A3B1E",
    fontSize: 30,
    fontWeight: "900",
    marginRight: 10
  },
  heartButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "#B95632",
    borderWidth: 3,
    borderColor: "#713319"
  },
  heroArea: {
    minHeight: 356,
    overflow: "hidden",
    borderRadius: 24,
    backgroundColor: "#FFF0C8",
    borderWidth: 2,
    borderColor: "#D5A057",
    marginBottom: 12
  },
  levelCard: {
    position: "absolute",
    zIndex: 2,
    left: 14,
    top: 18,
    width: 142,
    borderRadius: 16,
    backgroundColor: "#FFF9EA",
    borderWidth: 1,
    borderColor: "#E0BF83",
    padding: 10
  },
  levelTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 6
  },
  levelText: {
    color: "#5D351C",
    fontSize: 14,
    fontWeight: "900",
    marginLeft: 6
  },
  levelTrack: {
    height: 12,
    overflow: "hidden",
    borderRadius: 8,
    backgroundColor: "#EBD9B5",
    borderWidth: 1,
    borderColor: "#B87534"
  },
  levelFill: {
    width: "68%",
    height: "100%",
    borderRadius: 8,
    backgroundColor: "#84BE33"
  },
  levelPoints: {
    color: "#5D351C",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 5,
    textAlign: "center"
  },
  capybaraStage: {
    flex: 1,
    justifyContent: "flex-end",
    paddingTop: 72
  },
  capybaraImage: {
    width: "100%",
    height: 316
  },
  rug: {
    position: "absolute",
    alignSelf: "center",
    bottom: 34,
    width: "58%",
    height: 34,
    borderRadius: 999,
    backgroundColor: "#79B84A",
    borderWidth: 2,
    borderColor: "#4D8428"
  },
  evolutionPanel: {
    borderRadius: 18,
    backgroundColor: "#FFF4D8",
    borderWidth: 2,
    borderColor: "#C99655",
    padding: 10,
    marginBottom: 10
  },
  sectionTitle: {
    color: "#6A3B1E",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 8,
    textAlign: "center"
  },
  evolutionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  evolutionItemWrap: {
    flexDirection: "row",
    alignItems: "center"
  },
  evolutionItem: {
    width: 62,
    minHeight: 72,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "#F5E1B8",
    borderWidth: 1,
    borderColor: "#D4AD71",
    padding: 4
  },
  activeEvolutionItem: {
    backgroundColor: "#FFD982",
    borderWidth: 2,
    borderColor: "#D99B2E"
  },
  evolutionLabel: {
    color: "#6A3B1E",
    fontSize: 10,
    fontWeight: "900",
    marginTop: 3,
    textAlign: "center"
  },
  arrow: {
    color: "#8A5428",
    fontSize: 22,
    fontWeight: "900",
    marginHorizontal: 3
  },
  tipBox: {
    minHeight: 50,
    alignItems: "center",
    flexDirection: "row",
    borderRadius: 14,
    backgroundColor: "#FFF4D8",
    borderWidth: 2,
    borderColor: "#C99655",
    paddingHorizontal: 12,
    marginBottom: 12
  },
  tipText: {
    flex: 1,
    color: "#6A3B1E",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16
  },
  pressed: {
    opacity: 0.72
  }
});
