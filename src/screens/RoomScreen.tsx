import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { ActionButton } from "../components/ActionButton";
import { CapybaraDisplay } from "../components/CapybaraDisplay";
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

type TileConfig = {
  label: string;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  room: RoomName;
  color: string;
  borderColor: string;
  iconColor: string;
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
  Kitchen:  { scene: "kitchen",  action: "feed",  actionLabel: "Alimentar",  icon: "🥕"  },
  Bathroom: { scene: "bathroom", action: "bath",  actionLabel: "Dar banho",  icon: "🫧"  },
  Garden:   { scene: "garden",   action: "play",  actionLabel: "Brincar",    icon: "🏖️" },
  Bedroom:  { scene: "bedroom",  action: "sleep", actionLabel: "Dormir",     icon: "🌙"  }
};

const roomTiles: TileConfig[] = [
  { label: "Alimentar", iconName: "carrot",             room: "Kitchen",  color: "#8DCD3F", borderColor: "#4E8622", iconColor: "#F47B2D" },
  { label: "Brincar",   iconName: "beach",              room: "Garden",   color: "#FFC25E", borderColor: "#B36B24", iconColor: "#3A8FCE" },
  { label: "Dormir",    iconName: "moon-waning-crescent",room: "Bedroom",  color: "#8169D8", borderColor: "#503DA1", iconColor: "#FFE67C" },
  { label: "Banho",     iconName: "shower-head",        room: "Bathroom", color: "#57C0D2", borderColor: "#2C7D91", iconColor: "#D6F7FF" }
];

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

  useEffect(() => {
    loadGameStatus().then(setStatus);
    saveLastRoom(route.name);
  }, [route.name]);

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

        {/* Navegação entre cômodos */}
        <View style={styles.roomTilesRow}>
          {roomTiles.map((tile) => {
            const isActive = route.name === tile.room;
            return (
              <Pressable
                accessibilityRole="button"
                key={tile.label}
                onPress={() => { if (!isActive) navigation.replace(tile.room); }}
                style={({ pressed }) => [
                  styles.roomTile,
                  { backgroundColor: tile.color, borderColor: isActive ? "#FFFFFF" : tile.borderColor },
                  isActive && styles.roomTileActive,
                  !isActive && pressed && styles.pressed
                ]}
              >
                <MaterialCommunityIcons color={tile.iconColor} name={tile.iconName} size={26} />
                <Text style={styles.roomTileLabel}>{tile.label}</Text>
                {isActive && <View style={styles.activeDot} />}
              </Pressable>
            );
          })}
        </View>

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

  /* Barras de status compactas */
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

  /* Tiles de navegação */
  roomTilesRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 4
  },
  roomTile: {
    flex: 1,
    minHeight: 68,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 3,
    paddingVertical: 6,
    paddingHorizontal: 2,
    gap: 2
  },
  roomTileActive: {
    opacity: 0.6
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
    marginTop: 1
  },
  roomTileLabel: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
    textAlign: "center",
    textShadowColor: "rgba(77, 45, 23, 0.42)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1
  },
  pressed: {
    opacity: 0.75
  },

  /* Mensagem de feedback */
  message: {
    color: "#5B3318",
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 22,
    marginBottom: 6,
    textAlign: "center"
  },

  /* Barra inferior do cômodo */
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
  }
});
