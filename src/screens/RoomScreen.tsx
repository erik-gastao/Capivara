import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  ImageBackground,
  ImageSourcePropType,
  SafeAreaView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { ActionButton } from "../components/ActionButton";
import { PageNav, ROOM_PAGES } from "../components/PageNav";
import { capyBody, capyEyes, capyMouth } from "../assets/capySprites";
import { loadGameStatus, saveGameStatus, saveLastRoom } from "../storage/gameStorage";
import {
  CapybaraMood,
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
  background: ImageSourcePropType;
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

const SPRITE_WIDTH = 200;
const SPRITE_HEIGHT = 300;

// Posições das camadas de rosto sobrepostas ao corpo.
// Cada cômodo pode sobrescrever os valores padrão individualmente.
type FaceLayout = {
  eyeTop: number; eyeLeft: number; eyeW: number; eyeH: number;
  mouthTop: number; mouthLeft: number; mouthW: number; mouthH: number;
};

const DEFAULT_FACE: FaceLayout = {
  eyeW: 140, eyeH: 41, eyeTop: 33, eyeLeft: 30,
  mouthW: 150, mouthH: 74, mouthTop: 76, mouthLeft: 25,
};

// Overrides por cômodo — só preencha o que difere do DEFAULT_FACE
const ROOM_FACE: Record<RoomName, FaceLayout> = {
  Kitchen:  { ...DEFAULT_FACE, eyeTop: 145, eyeLeft: 39, eyeW: 122, eyeH: 35, mouthTop: 100, mouthLeft: 32, mouthW: 136, mouthH: 67 },
  Bathroom: { ...DEFAULT_FACE },
  Garden:   { ...DEFAULT_FACE },
  Bedroom:  { ...DEFAULT_FACE },
};

const roomConfigs: Record<RoomName, RoomConfig> = {
  Kitchen:  {
    background:  require("../../assets/images/capybara-kitchen.png"),
    action:      "feed",
    actionLabel: "Alimentar",
    icon:        "🥕"
  },
  Bathroom: {
    background:  require("../../assets/images/capybara-bathroom.png"),
    action:      "bath",
    actionLabel: "Dar banho",
    icon:        "🫧"
  },
  Garden:   {
    background:  require("../../assets/images/capybara-lobby-cartoon.png"),
    action:      "play",
    actionLabel: "Brincar",
    icon:        "🏖️"
  },
  Bedroom:  {
    background:  require("../../assets/images/capybara-bedroom.png"),
    action:      "sleep",
    actionLabel: "Dormir",
    icon:        "🌙"
  }
};

const roomBarConfigs: Record<RoomName, RoomBottomBarConfig> = {
  Kitchen:  {
    left:   { iconName: "medical-bag",        label: "Remédios"                   },
    center: { iconName: "pill",               label: "Remédio",  hasArrows: true  },
    right:  { iconName: "store",              label: "Loja"                       }
  },
  Bathroom: {
    left:   { iconName: "shower-head",        label: "Chuveiro"                   },
    center: { iconName: "hand-wash",          label: "Sabão",    hasArrows: false },
    right:  { iconName: "store",              label: "Loja"                       }
  },
  Garden:   {
    left:   { iconName: "controller-classic", label: "Mini-jogos"                 },
    center: { iconName: "soccer",             label: "Bola",     hasArrows: false },
    right:  { iconName: "store",              label: "Loja"                       }
  },
  Bedroom:  {
    left:   { iconName: "wardrobe",           label: "Guarda-roupa"               },
    center: { iconName: "floor-lamp",         label: "Abajur",   hasArrows: false },
    right:  { iconName: "store",              label: "Loja"                       }
  }
};

function getBodySprite(mood: CapybaraMood, room: RoomName) {
  if (mood === "triste") return capyBody.sad;
  if (room === "Bedroom") return capyBody.sleepHat;
  if (room === "Kitchen") return capyBody.cesta;
  return capyBody.normal;
}

function getEyeSprite(mood: CapybaraMood) {
  if (mood === "triste") return capyEyes.tired;
  return capyEyes.openNormal;
}

function getMouthSprite(mood: CapybaraMood) {
  if (mood === "triste") return capyMouth.sick;
  if (mood === "feliz") return capyMouth.veryHappy;
  return capyMouth.normal;
}

export function RoomScreen({ navigation, route }: Props) {
  const [status, setStatus] = useState<CapybaraStatus>(initialStatus);
  const [message, setMessage] = useState("");
  const bounce = useRef(new Animated.Value(0)).current;

  const config = roomConfigs[route.name];
  const barConfig = roomBarConfigs[route.name];
  const face = ROOM_FACE[route.name];
  const mood = getCapybaraMood(status);

  const pageIndex = ROOM_PAGES.findIndex((p) => p.room === route.name);
  const prevPage = ROOM_PAGES[pageIndex - 1];
  const nextPage = ROOM_PAGES[pageIndex + 1];

  useFocusEffect(
    useCallback(() => {
      loadGameStatus().then(setStatus);
      saveLastRoom(route.name);
    }, [route.name])
  );

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: 1,
          duration: mood === "triste" ? 1300 : 850,
          useNativeDriver: true
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: mood === "triste" ? 1300 : 850,
          useNativeDriver: true
        })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bounce, mood]);

  const translateY = bounce.interpolate({
    inputRange: [0, 1],
    outputRange: [0, mood === "triste" ? 4 : -10]
  });

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
    <ImageBackground
      resizeMode="cover"
      source={config.background}
      style={styles.background}
    >
      <SafeAreaView style={styles.safeArea}>

        {/* Barras de status flutuantes */}
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

        {/* Capy composta por camadas */}
        <View style={styles.spriteArea}>
          <Animated.View style={[styles.spriteContainer, { transform: [{ translateY }] }]}>
            <Image
              resizeMode="contain"
              source={getBodySprite(mood, route.name)}
              style={styles.spriteBase}
            />
            <Image
              resizeMode="contain"
              source={getEyeSprite(mood)}
              style={[styles.absoluteLayer, { top: face.eyeTop, left: face.eyeLeft, width: face.eyeW, height: face.eyeH }]}
            />
            <Image
              resizeMode="contain"
              source={getMouthSprite(mood)}
              style={[styles.absoluteLayer, { top: face.mouthTop, left: face.mouthLeft, width: face.mouthW, height: face.mouthH }]}
            />
          </Animated.View>
        </View>

        {/* Mensagem de feedback */}
        {message ? (
          <View style={styles.messageBubble}>
            <Text style={styles.messageText}>{message}</Text>
          </View>
        ) : null}

        {/* Botão de ação */}
        <View style={styles.actionRow}>
          <ActionButton icon={config.icon} label={config.actionLabel} onPress={handleCareAction} />
        </View>

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
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 8,
    backgroundColor: "transparent"
  },
  statusBarsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    backgroundColor: "rgba(255, 245, 217, 0.80)",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(169, 99, 37, 0.45)",
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 6,
    marginBottom: 6
  },
  vBarWidget: {
    alignItems: "center",
    gap: 3
  },
  vBarTrack: {
    width: 22,
    height: COMPACT_BAR_HEIGHT,
    backgroundColor: "rgba(231, 215, 183, 0.70)",
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
  spriteArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 4
  },
  spriteContainer: {
    width: SPRITE_WIDTH,
    height: SPRITE_HEIGHT
  },
  spriteBase: {
    width: SPRITE_WIDTH,
    height: SPRITE_HEIGHT
  },
  absoluteLayer: {
    position: "absolute"
  },
  messageBubble: {
    alignSelf: "center",
    backgroundColor: "rgba(255, 245, 217, 0.92)",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#C49A52",
    paddingHorizontal: 18,
    paddingVertical: 6,
    marginBottom: 6
  },
  messageText: {
    color: "#5B3318",
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center"
  },
  actionRow: {
    paddingBottom: 6
  },
  roomBar: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: "rgba(248, 230, 188, 0.92)",
    borderTopWidth: 2,
    borderTopColor: "#C1843C"
  },
  barSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 70,
    borderRadius: 18,
    backgroundColor: "rgba(255, 245, 217, 0.88)",
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
