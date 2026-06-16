import { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { ActionButton } from "../components/ActionButton";
import { CapybaraDisplay } from "../components/CapybaraDisplay";
import { PageNav, ROOM_PAGES } from "../components/PageNav";
import { loadGameStatus, saveGameStatus, saveLastRoom } from "../storage/gameStorage";
import {
  CapybaraScene,
  CapybaraStatus,
  CareAction,
  RootStackParamList,
  RoomName
} from "../types/game";
import {
  actionMessages,
  applyCareAction,
  getCapybaraMood,
  initialStatus
} from "../utils/statusRules";

type Props = NativeStackScreenProps<RootStackParamList, RoomName>;

type RoomConfig = {
  scene: CapybaraScene;
  action: CareAction;
  actionLabel: string;
  icon: string;
};

type BarItem = {
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
};

type RoomBottomBarConfig = {
  left: BarItem;
  center: BarItem & { hasArrows: boolean };
  right: BarItem;
};

const COMPACT_BAR_HEIGHT = 44;

const roomConfigs: Record<RoomName, RoomConfig> = {
  Kitchen:  { scene: "kitchen",  action: "feed",  actionLabel: "Alimentar", icon: "🥕"  },
  Bathroom: { scene: "bathroom", action: "bath",  actionLabel: "Dar banho", icon: "🫧"  },
  Garden:   { scene: "garden",   action: "play",  actionLabel: "Brincar",   icon: "🏖️" },
  Bedroom:  { scene: "bedroom",  action: "sleep", actionLabel: "Dormir",    icon: "🌙"  }
};

const roomBarConfigs: Record<RoomName, RoomBottomBarConfig> = {
  Kitchen:  {
    left:   { iconName: "medical-bag",        label: "Remédios"     },
    center: { iconName: "pill",               label: "Remédio",  hasArrows: true  },
    right:  { iconName: "store",              label: "Loja"         }
  },
  Bathroom: {
    left:   { iconName: "shower-head",        label: "Chuveiro"     },
    center: { iconName: "hand-wash",          label: "Sabão",    hasArrows: false },
    right:  { iconName: "store",              label: "Loja"         }
  },
  Garden:   {
    left:   { iconName: "controller-classic", label: "Mini-jogos"   },
    center: { iconName: "soccer",             label: "Bola",     hasArrows: false },
    right:  { iconName: "store",              label: "Loja"         }
  },
  Bedroom:  {
    left:   { iconName: "wardrobe",           label: "Guarda-roupa" },
    center: { iconName: "floor-lamp",         label: "Abajur",   hasArrows: false },
    right:  { iconName: "store",              label: "Loja"         }
  }
};

export function RoomScreen({ navigation, route }: Props) {
  const [status, setStatus] = useState<CapybaraStatus>(initialStatus);
  const [message, setMessage] = useState("");
  const config = roomConfigs[route.name];
  const barConfig = roomBarConfigs[route.name];
  const mood = getCapybaraMood(status);

  const pageIndex = ROOM_PAGES.findIndex((p) => p.room === route.name);
  const prevPage = ROOM_PAGES[pageIndex - 1];
  const nextPage = ROOM_PAGES[pageIndex + 1];

  useEffect(() => {
    loadGameStatus().then(setStatus);
    saveLastRoom(route.name);
  }, [route.name]);

  function handlePrev() {
    if (!prevPage) return;
    if (prevPage.room === null) {
      navigation.goBack();
    } else {
      navigation.replace(prevPage.room);
    }
  }

  function handleNext() {
    if (!nextPage?.room) return;
    navigation.replace(nextPage.room);
  }

  function handleCareAction() {
    const updatedStatus = applyCareAction(status, config.action);
    setStatus(updatedStatus);
    setMessage(actionMessages[config.action]);
    saveGameStatus(updatedStatus);
  }

  const statusBars = [
    { iconName: "carrot" as keyof typeof MaterialCommunityIcons.glyphMap, iconColor: "#F47B2D", label: "Fome",    value: status.hunger,    fillColor: "#8BBB31" },
    { iconName: "heart"  as keyof typeof MaterialCommunityIcons.glyphMap, iconColor: "#E94B61", label: "Alegria", value: status.happiness, fillColor: "#F06292" },
    { iconName: "flash"  as keyof typeof MaterialCommunityIcons.glyphMap, iconColor: "#F28F2E", label: "Energia", value: status.energy,    fillColor: "#FFC107" },
    { iconName: "water"  as keyof typeof MaterialCommunityIcons.glyphMap, iconColor: "#45BADA", label: "Higiene", value: status.hygiene,   fillColor: "#45BADA" },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} style={styles.scroll}>

        {/* Barras de status compactas */}
        <View style={styles.statusBarsRow}>
          {statusBars.map((bar) => {
            const fillColor = bar.value < 30 ? "#E94B61" : bar.fillColor;
            const fillHeight = (bar.value / 100) * COMPACT_BAR_HEIGHT;
            return (
              <View key={bar.label} style={styles.vBarWidget}>
                <MaterialCommunityIcons color={bar.iconColor} name={bar.iconName} size={18} />
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
          currentPage={pageIndex}
          onPrev={prevPage ? handlePrev : undefined}
          onNext={nextPage ? handleNext : undefined}
        />

        <CapybaraDisplay mood={mood} scene={config.scene} compact />

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <ActionButton icon={config.icon} label={config.actionLabel} onPress={handleCareAction} />

      </ScrollView>

      {/* Barra inferior do cômodo */}
      <View style={styles.roomBar}>
        <View style={styles.barSlot}>
          <MaterialCommunityIcons color="#8A5428" name={barConfig.left.iconName} size={30} />
          <Text style={styles.barLabel}>{barConfig.left.label}</Text>
        </View>

        <View style={[styles.barSlot, styles.barSlotCenter]}>
          {barConfig.center.hasArrows ? (
            <View style={styles.selectorRow}>
              <MaterialCommunityIcons color="#C49A52" name="chevron-left" size={26} />
              <MaterialCommunityIcons color="#5D351C" name={barConfig.center.iconName} size={36} />
              <MaterialCommunityIcons color="#C49A52" name="chevron-right" size={26} />
            </View>
          ) : (
            <MaterialCommunityIcons color="#5D351C" name={barConfig.center.iconName} size={38} />
          )}
          <Text style={styles.barLabel}>{barConfig.center.label}</Text>
        </View>

        <View style={styles.barSlot}>
          <MaterialCommunityIcons color="#8A5428" name={barConfig.right.iconName} size={30} />
          <Text style={styles.barLabel}>{barConfig.right.label}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7E2B8"
  },
  scroll: {
    flex: 1
  },
  container: {
    padding: 10,
    paddingBottom: 16
  },
  statusBarsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    backgroundColor: "#FFF5D9",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#A96325",
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 6,
    marginBottom: 8
  },
  vBarWidget: {
    alignItems: "center",
    gap: 3
  },
  vBarTrack: {
    width: 22,
    height: COMPACT_BAR_HEIGHT,
    backgroundColor: "#E7D7B7",
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#C49A52",
    overflow: "hidden",
    justifyContent: "flex-end"
  },
  vBarFill: {
    width: "100%"
  },
  vBarLabel: {
    color: "#4E2D17",
    fontSize: 10,
    fontWeight: "900",
    textAlign: "center"
  },
  message: {
    color: "#5B3318",
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 22,
    marginBottom: 6,
    textAlign: "center"
  },
  roomBar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#F8E6BC",
    borderTopWidth: 2,
    borderTopColor: "#C1843C"
  },
  barSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 74,
    borderRadius: 18,
    backgroundColor: "#FFF5D9",
    borderWidth: 2,
    borderColor: "#A96325",
    gap: 4
  },
  barSlotCenter: {
    flex: 1.4
  },
  barLabel: {
    color: "#5D351C",
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center"
  },
  selectorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2
  },
  pressed: {
    opacity: 0.75
  }
});
