import { useCallback, useEffect, useRef, useState } from "react";
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

import { PageNav, ROOM_PAGES } from "../components/PageNav";
import { loadGameStatus, loadLastRoom, saveGameStatus } from "../storage/gameStorage";
import { CapybaraStatus, RootStackParamList } from "../types/game";
import {
  addCoinsBonus,
  addHappinessBonus,
  initialStatus
} from "../utils/statusRules";

const lobbyImage = require("../../assets/images/capybara-lobby-cartoon.png");

const BAR_TRACK_HEIGHT = 72;
const PAGE_INDEX = 0;

type Props = NativeStackScreenProps<RootStackParamList, "Game">;

type StatusBarConfig = {
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor: string;
  label: string;
  value: number;
  fillColor: string;
};

export function GameScreen({ navigation, route }: Props) {
  const [status, setStatus] = useState<CapybaraStatus>(initialStatus);
  const hasRestoredRoom = useRef(false);

  useEffect(() => {
    if (hasRestoredRoom.current) return;
    hasRestoredRoom.current = true;
    loadLastRoom().then((room) => {
      if (room) navigation.navigate(room);
    });
  }, [navigation]);

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
        await saveGameStatus(finalStatus);
        navigation.setParams({ happinessBonus: undefined });
      }

      syncStatus();

      return () => {
        isActive = false;
      };
    }, [navigation, route.params?.happinessBonus])
  );

  const statusBars: StatusBarConfig[] = [
    { iconName: "carrot", iconColor: "#F47B2D", label: "Fome",    value: status.hunger,    fillColor: "#8BBB31" },
    { iconName: "heart",  iconColor: "#E94B61", label: "Alegria", value: status.happiness, fillColor: "#F06292" },
    { iconName: "flash",  iconColor: "#F28F2E", label: "Energia", value: status.energy,    fillColor: "#FFC107" },
    { iconName: "water",  iconColor: "#45BADA", label: "Higiene", value: status.hygiene,   fillColor: "#45BADA" },
  ];

  const nextRoom = ROOM_PAGES[PAGE_INDEX + 1]?.room;

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

          {/* Barras de status verticais */}
          <View style={styles.statusBarsRow}>
            {statusBars.map((bar) => {
              const fillColor = bar.value < 30 ? "#E94B61" : bar.fillColor;
              const fillHeight = (bar.value / 100) * BAR_TRACK_HEIGHT;
              return (
                <View key={bar.label} style={styles.vBarWidget}>
                  <MaterialCommunityIcons color={bar.iconColor} name={bar.iconName} size={24} />
                  <View style={styles.vBarTrack}>
                    <View style={[styles.vBarFill, { height: fillHeight, backgroundColor: fillColor }]} />
                  </View>
                  <Text style={styles.vBarLabel}>{bar.label}</Text>
                </View>
              );
            })}
          </View>

          {/* Paginação de cômodos */}
          <PageNav
            currentPage={PAGE_INDEX}
            onNext={nextRoom ? () => navigation.navigate(nextRoom) : undefined}
          />

          {/* Cena principal com a capivara */}
          <View style={styles.lobbyFrame}>
            <ImageBackground
              accessibilityLabel="Lobby da capivara em uma sala aconchegante"
              imageStyle={styles.lobbyBackdrop}
              resizeMode="cover"
              source={lobbyImage}
              style={styles.lobbyImage}
            >
              {null}
            </ImageBackground>
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
  pressed: {
    opacity: 0.75
  },
  statusBarsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    backgroundColor: "#FFF5D9",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#A96325",
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 8,
    marginBottom: 8
  },
  vBarWidget: {
    alignItems: "center",
    gap: 4
  },
  vBarTrack: {
    width: 30,
    height: BAR_TRACK_HEIGHT,
    backgroundColor: "#E7D7B7",
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#C49A52",
    overflow: "hidden",
    justifyContent: "flex-end"
  },
  vBarFill: {
    width: "100%"
  },
  vBarLabel: {
    color: "#4E2D17",
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center"
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
  }
});
