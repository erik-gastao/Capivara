import { useCallback, useState } from "react";
import {
  ImageBackground,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { StatusBar } from "../components/StatusBar";
import { loadGameStatus, saveGameStatus } from "../storage/gameStorage";
import { CapybaraStatus, RootStackParamList, RoomName } from "../types/game";
import {
  addCoinsBonus,
  addHappinessBonus,
  getCapybaraMood,
  initialStatus
} from "../utils/statusRules";

const lobbyImage = require("../../assets/images/capybara-lobby-cartoon.png");

type Props = NativeStackScreenProps<RootStackParamList, "Game">;

type ActionTileConfig = {
  label: string;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  room: RoomName;
  color: string;
  borderColor: string;
  iconColor: string;
};

const actionTiles: ActionTileConfig[] = [
  {
    label: "Alimentar",
    iconName: "carrot",
    room: "Kitchen",
    color: "#8DCD3F",
    borderColor: "#4E8622",
    iconColor: "#F47B2D"
  },
  {
    label: "Brincar",
    iconName: "beach",
    room: "Garden",
    color: "#FFC25E",
    borderColor: "#B36B24",
    iconColor: "#3A8FCE"
  },
  {
    label: "Dormir",
    iconName: "moon-waning-crescent",
    room: "Bedroom",
    color: "#8169D8",
    borderColor: "#503DA1",
    iconColor: "#FFE67C"
  },
  {
    label: "Banho",
    iconName: "shower-head",
    room: "Bathroom",
    color: "#57C0D2",
    borderColor: "#2C7D91",
    iconColor: "#D6F7FF"
  }
];

const moodLabel = {
  feliz: "Feliz",
  normal: "Calma",
  triste: "Precisa de carinho"
};

export function GameScreen({ navigation, route }: Props) {
  const [status, setStatus] = useState<CapybaraStatus>(initialStatus);
  const [message, setMessage] = useState("Olá! Vamos cuidar da sua capivara?");

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function syncStatus() {
        const storedStatus = await loadGameStatus();
        const bonus = route.params?.happinessBonus;

        if (!isActive) {
          return;
        }

        if (!bonus) {
          setStatus(storedStatus);
          return;
        }

        const updatedStatus = addHappinessBonus(storedStatus, bonus);
        const finalStatus = addCoinsBonus(updatedStatus, 0);
        setStatus(finalStatus);
        setMessage("Muito bem! A capivara ficou mais feliz.");
        await saveGameStatus(finalStatus);
        navigation.setParams({ happinessBonus: undefined });
      }

      syncStatus();

      return () => {
        isActive = false;
      };
    }, [navigation, route.params?.happinessBonus])
  );

  const mood = getCapybaraMood(status);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.phoneFrame}>
        <View style={styles.phone}>

          {/* Barra superior: moedas à esquerda, perfil à direita */}
          <View style={styles.topBar}>
            <View style={styles.coinPill}>
              <MaterialCommunityIcons color="#F5A623" name="gold" size={21} />
              <Text style={styles.coinText}>{status.coins}</Text>
              <View style={styles.plusCircle}>
                <MaterialCommunityIcons color="#FFFFFF" name="plus" size={20} />
              </View>
            </View>

            <Pressable
              accessibilityLabel="Ver perfil"
              accessibilityRole="button"
              onPress={() => navigation.navigate("Profile")}
              style={({ pressed }) => [styles.profileButton, pressed && styles.pressed]}
            >
              <MaterialCommunityIcons color="#FFE8C7" name="account-circle" size={30} />
            </Pressable>
          </View>

          {/* Ações de cuidado: fila horizontal esquerda → direita */}
          <View style={styles.actionsRow}>
            {actionTiles.map((tile) => (
              <Pressable
                accessibilityRole="button"
                key={tile.label}
                onPress={() => navigation.navigate(tile.room)}
                style={({ pressed }) => [
                  styles.actionTile,
                  { backgroundColor: tile.color, borderColor: tile.borderColor },
                  pressed && styles.pressed
                ]}
              >
                <View style={styles.actionGloss} />
                <MaterialCommunityIcons
                  color={tile.iconColor}
                  name={tile.iconName}
                  size={35}
                />
                <Text style={styles.actionLabel}>{tile.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* Cena principal com a capivara */}
          <View style={styles.lobbyFrame}>
            <ImageBackground
              accessibilityLabel="Lobby da capivara em uma sala aconchegante"
              imageStyle={styles.lobbyBackdrop}
              resizeMode="cover"
              source={lobbyImage}
              style={styles.lobbyImage}
            >
              <View style={styles.moodPill}>
                <Text style={styles.moodText}>Humor: {moodLabel[mood]}</Text>
              </View>

              <View style={styles.statusPanel}>
                <StatusBar iconColor="#F47B2D" iconName="carrot" label="Fome" value={status.hunger} color="#8BBB31" />
                <StatusBar iconColor="#E94B61" iconName="heart" label="Felicidade" value={status.happiness} color="#9BC940" />
                <StatusBar iconColor="#F28F2E" iconName="flash" label="Energia" value={status.energy} color="#F2A13A" />
                <StatusBar iconColor="#45BADA" iconName="water" label="Higiene" value={status.hygiene} color="#45BADA" />
              </View>
            </ImageBackground>
          </View>

          <View style={styles.messageBoard}>
            <Text style={styles.message}>{message}</Text>
          </View>

        </View>
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
    backgroundColor: "#161616",
    borderWidth: 4,
    borderColor: "#161616"
  },
  phone: {
    flex: 1,
    borderRadius: 29,
    backgroundColor: "#F8E6BC",
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 8
  },
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
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8
  },
  actionTile: {
    flex: 1,
    minHeight: 82,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    borderWidth: 3,
    paddingHorizontal: 4,
    paddingVertical: 7,
    shadowColor: "#5E351C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6
  },
  actionGloss: {
    position: "absolute",
    left: 8,
    right: 8,
    top: 7,
    height: 18,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.22)"
  },
  pressed: {
    opacity: 0.75
  },
  actionLabel: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 2,
    textAlign: "center",
    textShadowColor: "rgba(77, 45, 23, 0.42)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1
  },
  lobbyFrame: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 24,
    borderWidth: 3,
    borderColor: "#A96325",
    backgroundColor: "#F1CF8C",
    shadowColor: "#6D4322",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 7
  },
  lobbyImage: {
    flex: 1,
    backgroundColor: "#F1CF8C"
  },
  lobbyBackdrop: {
    transform: [{ scale: 1 }]
  },
  moodPill: {
    position: "absolute",
    right: 12,
    top: 12,
    maxWidth: 210,
    borderRadius: 16,
    backgroundColor: "rgba(255, 247, 226, 0.96)",
    borderWidth: 2,
    borderColor: "#B87534",
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  moodText: {
    color: "#5D351C",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center"
  },
  statusPanel: {
    position: "absolute",
    right: 12,
    top: 54,
    width: 168,
    borderRadius: 18,
    backgroundColor: "rgba(255, 247, 226, 0.95)",
    borderWidth: 2,
    borderColor: "#B87534",
    padding: 10,
    shadowColor: "#6D4322",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6
  },
  messageBoard: {
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: 4,
    paddingVertical: 6
  },
  message: {
    color: "#6A3B1E",
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 23,
    textAlign: "center"
  }
});
