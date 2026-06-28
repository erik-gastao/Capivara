import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  ImageBackground,
  PanResponder,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { ActionButton } from "../components/ActionButton";
import { loadGameStatus, saveGameStatus } from "../storage/gameStorage";
import { RootStackParamList } from "../types/game";
import { addCoinsBonus, addHappinessBonus } from "../utils/statusRules";

type Props = NativeStackScreenProps<RootStackParamList, "CatchFoodGame">;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const TOTAL_CONES = 10;
const COINS_PER_CONE = 5;
const TOTAL_COINS_REWARD = TOTAL_CONES * COINS_PER_CONE;
const HAPPINESS_REWARD = 25;
const CONE_DROP_DURATION_MIN = 3000;
const CONE_DROP_DURATION_MAX = 4500;
const REWARD_BONUS_PER_ROUND = 0.25;
const SPEED_STEP_PER_ROUND = 0.08;
const MIN_SPEED_FACTOR = 0.65;

// Cone spawns from tree canopy area (top ~15% of game area)
const CONE_START_Y = 34;
// Game area height is roughly SCREEN_HEIGHT - topRow(76) - messageArea(96) - safeArea padding
const GAME_AREA_HEIGHT = SCREEN_HEIGHT - 76 - 96 - 32;
const CONE_END_Y = GAME_AREA_HEIGHT - 20;

// Basket sits near bottom of game area
const BASKET_Y = GAME_AREA_HEIGHT - 110;
const BASKET_WIDTH = 90;
const BASKET_HEIGHT = 75;
const ARAUCARIA_WIDTH = Math.min(SCREEN_WIDTH * 1.22, 520);
const ARAUCARIA_HEIGHT = Math.min(GAME_AREA_HEIGHT * 0.96, 520);

const CONE_SPAWN_MARGIN = 24;

// Collision — generous so gameplay feels fair
const COLLISION_TOLERANCE_Y = 40;
const COLLISION_TOLERANCE_X = 30;

const CONE_WIDTH = 34;

const gameBackground = require("../../assets/images/capybara-lobby-cartoon.png");
const araucariaImage = require("../../assets/images/araucaria.png");

// Static requires — React Native bundler needs these at build time
const BASKET_IMAGES = [
  require("../../assets/images/cestas-pinhas.png"),
  require("../../assets/images/cesta-pinhas-2un.png"),
  require("../../assets/images/cesta-pinhas-3un.png"),
  require("../../assets/images/cesta-pinhas-4un.png"),
  require("../../assets/images/cesta-pinhas-5un.png"),
];

function getBasketImageIndex(collected: number): number {
  return Math.min(Math.floor(collected / 2), 4);
}

function getRoundRewardMultiplier(round: number): number {
  return 1 + (round - 1) * REWARD_BONUS_PER_ROUND;
}

function getRoundSpeedFactor(round: number): number {
  return Math.max(MIN_SPEED_FACTOR, 1 - (round - 1) * SPEED_STEP_PER_ROUND);
}

function getRoundCoinsReward(round: number): number {
  return Math.round(TOTAL_COINS_REWARD * getRoundRewardMultiplier(round));
}

function getRoundHappinessReward(round: number): number {
  return Math.round(HAPPINESS_REWARD * getRoundRewardMultiplier(round));
}

export function CatchFoodGameScreen({ navigation }: Props) {
  const [collectedCount, setCollectedCount] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [roundNumber, setRoundNumber] = useState(1);
  const [showCollectAnim, setShowCollectAnim] = useState(false);
  const [collectAnimPos, setCollectAnimPos] = useState({ x: 0, y: 0 });
  const [coneVisible, setConeVisible] = useState(false);
  const [coneXState, setConeXState] = useState((SCREEN_WIDTH - CONE_WIDTH) / 2);

  // Basket position — use ref for pan responder (no re-render lag) + animated for smooth render
  const basketXRef = useRef((SCREEN_WIDTH - BASKET_WIDTH) / 2);
  const basketAnimX = useRef(new Animated.Value(basketXRef.current)).current;

  // Cone tracking refs (avoid state updates in rAF loop)
  const coneXRef = useRef((SCREEN_WIDTH - CONE_WIDTH) / 2);
  const coneYRef = useRef(CONE_START_Y);
  const coneAnimY = useRef(new Animated.Value(CONE_START_Y)).current;
  const coneActiveRef = useRef(false);
  const coneAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  const collectAnimProgress = useRef(new Animated.Value(0)).current;
  const rAFRef = useRef<number | null>(null);
  const collisionListenerRef = useRef<string | null>(null);
  const rewardedRoundsRef = useRef<Set<number>>(new Set());
  const collectedRef = useRef(0); // mirror of collectedCount for use inside rAF/callbacks
  const roundRef = useRef(1);

  // ─── Pan Responder ───────────────────────────────────────────────────────────
  // Key fix: track absolute basket position between gestures with lastBasketX
  const lastBasketX = useRef(basketXRef.current);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Capture position at start of each gesture
        lastBasketX.current = basketXRef.current;
      },
      onPanResponderMove: (_, gestureState) => {
        const newX = Math.max(
          0,
          Math.min(SCREEN_WIDTH - BASKET_WIDTH, lastBasketX.current + gestureState.dx)
        );
        basketXRef.current = newX;
        basketAnimX.setValue(newX);
      },
      onPanResponderRelease: (_, gestureState) => {
        const newX = Math.max(
          0,
          Math.min(SCREEN_WIDTH - BASKET_WIDTH, lastBasketX.current + gestureState.dx)
        );
        basketXRef.current = newX;
        lastBasketX.current = newX;
        basketAnimX.setValue(newX);
      }
    })
  ).current;

  // ─── Lifecycle ───────────────────────────────────────────────────────────────
  useEffect(() => {
    spawnCone(0);

    return () => {
      if (rAFRef.current !== null) cancelAnimationFrame(rAFRef.current);
      if (coneAnimRef.current) coneAnimRef.current.stop();
      coneAnimY.removeAllListeners();
    };
  }, []);

  // ─── Spawn Cone ──────────────────────────────────────────────────────────────
  const spawnCone = useCallback((currentCount: number) => {
    if (currentCount >= TOTAL_CONES) return;

    setTimeout(() => {
      const spawnX =
        CONE_SPAWN_MARGIN +
        Math.random() * (SCREEN_WIDTH - CONE_WIDTH - CONE_SPAWN_MARGIN * 2);
      const duration =
        (CONE_DROP_DURATION_MIN +
          Math.random() * (CONE_DROP_DURATION_MAX - CONE_DROP_DURATION_MIN)) *
        getRoundSpeedFactor(roundRef.current);

      coneXRef.current = spawnX;
      coneYRef.current = CONE_START_Y;
      coneAnimY.setValue(CONE_START_Y);
      coneActiveRef.current = true;

      // Update state so cone renders
      setConeXState(spawnX);
      setConeVisible(true);

      coneAnimRef.current = Animated.timing(coneAnimY, {
        toValue: CONE_END_Y,
        duration,
        easing: Easing.linear,
        useNativeDriver: true
      });

      coneAnimRef.current.start(({ finished }) => {
        if (finished && coneActiveRef.current) {
          // Cone reached bottom without being caught
          coneActiveRef.current = false;
          setConeVisible(false);
          if (collisionListenerRef.current !== null) {
            coneAnimY.removeListener(collisionListenerRef.current);
            collisionListenerRef.current = null;
          }
          if (rAFRef.current !== null) {
            cancelAnimationFrame(rAFRef.current);
            rAFRef.current = null;
          }
          setTimeout(() => spawnCone(collectedRef.current), 600);
        }
      });

      startCollisionDetection(currentCount);
    }, 300);
  }, []);

  // ─── Collision Detection ─────────────────────────────────────────────────────
  const startCollisionDetection = useCallback((currentCount: number) => {
    if (rAFRef.current !== null) {
      cancelAnimationFrame(rAFRef.current);
      rAFRef.current = null;
    }

    if (collisionListenerRef.current !== null) {
      coneAnimY.removeListener(collisionListenerRef.current);
      collisionListenerRef.current = null;
    }

    // Subscribe to animated value so coneYRef stays current
    const listenerId = coneAnimY.addListener(({ value }) => {
      coneYRef.current = value;
    });
    collisionListenerRef.current = listenerId;

    const check = () => {
      if (!coneActiveRef.current) {
        coneAnimY.removeListener(listenerId);
        if (collisionListenerRef.current === listenerId) {
          collisionListenerRef.current = null;
        }
        return;
      }

      const coneCenter = coneXRef.current + CONE_WIDTH / 2;
      const basketLeft = basketXRef.current;
      const basketRight = basketLeft + BASKET_WIDTH;
      const basketTopY = BASKET_Y; // top edge of basket

      const yOk = Math.abs(coneYRef.current - basketTopY) < COLLISION_TOLERANCE_Y;
      const xOk =
        coneCenter > basketLeft - COLLISION_TOLERANCE_X &&
        coneCenter < basketRight + COLLISION_TOLERANCE_X;

      if (yOk && xOk) {
        coneAnimY.removeListener(listenerId);
        if (collisionListenerRef.current === listenerId) {
          collisionListenerRef.current = null;
        }
        coneActiveRef.current = false;
        if (coneAnimRef.current) coneAnimRef.current.stop();
        setConeVisible(false);
        collectCone(currentCount);
        return;
      }

      rAFRef.current = requestAnimationFrame(check);
    };

    rAFRef.current = requestAnimationFrame(check);
  }, []);

  // ─── Collect Cone ────────────────────────────────────────────────────────────
  const collectCone = useCallback((currentCount: number) => {
    setCollectAnimPos({ x: coneXRef.current, y: coneYRef.current });
    setShowCollectAnim(true);
    collectAnimProgress.setValue(0);

    Animated.timing(collectAnimProgress, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true
    }).start(({ finished }) => {
      if (!finished) return;

      setShowCollectAnim(false);
      const nextCount = currentCount + 1;
      collectedRef.current = nextCount;
      setCollectedCount(nextCount);

      if (nextCount >= TOTAL_CONES) {
        completeGame();
      } else {
        spawnCone(nextCount);
      }
    });
  }, []);

  // ─── Complete Game ───────────────────────────────────────────────────────────
  const completeGame = useCallback(async () => {
    const completedRound = roundRef.current;

    if (rAFRef.current !== null) {
      cancelAnimationFrame(rAFRef.current);
      rAFRef.current = null;
    }
    if (collisionListenerRef.current !== null) {
      coneAnimY.removeListener(collisionListenerRef.current);
      collisionListenerRef.current = null;
    }
    setGameComplete(true);

    if (!rewardedRoundsRef.current.has(completedRound)) {
      rewardedRoundsRef.current.add(completedRound);
      const currentStatus = await loadGameStatus();
      const rewardedStatus = addHappinessBonus(
        addCoinsBonus(currentStatus, getRoundCoinsReward(completedRound)),
        getRoundHappinessReward(completedRound)
      );
      await saveGameStatus(rewardedStatus);
    }
  }, []);

  const continueGame = useCallback(() => {
    const nextRound = roundRef.current + 1;
    roundRef.current = nextRound;
    collectedRef.current = 0;
    coneActiveRef.current = false;
    coneYRef.current = CONE_START_Y;
    coneAnimY.setValue(CONE_START_Y);

    if (rAFRef.current !== null) {
      cancelAnimationFrame(rAFRef.current);
      rAFRef.current = null;
    }
    if (collisionListenerRef.current !== null) {
      coneAnimY.removeListener(collisionListenerRef.current);
      collisionListenerRef.current = null;
    }
    if (coneAnimRef.current) {
      coneAnimRef.current.stop();
    }

    setRoundNumber(nextRound);
    setCollectedCount(0);
    setConeVisible(false);
    setShowCollectAnim(false);
    setGameComplete(false);
    spawnCone(0);
  }, []);

  // ─── Interpolations ──────────────────────────────────────────────────────────
  const coinTranslateY = collectAnimProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -50]
  });

  const coinOpacity = collectAnimProgress.interpolate({
    inputRange: [0, 0.1, 0.7, 1],
    outputRange: [0, 1, 1, 0]
  });

  const basketImageIndex = getBasketImageIndex(collectedCount);
  const currentRoundCoinsReward = getRoundCoinsReward(roundNumber);
  const currentRoundHappinessReward = getRoundHappinessReward(roundNumber);
  const nextRoundBonusPercent = Math.round((getRoundRewardMultiplier(roundNumber + 1) - 1) * 100);

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top HUD — outside game area */}
      <View style={styles.topRow}>
        <Pressable
          accessibilityLabel="Voltar para minijogos"
          accessibilityRole="button"
          hitSlop={12}
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <MaterialCommunityIcons color="#7B451F" name="arrow-left" size={28} />
        </Pressable>

        <View style={styles.hudPill}>
          <Text style={styles.hudText}>
            Capivara {roundNumber}  -  {collectedCount}/{TOTAL_CONES}
          </Text>
        </View>
      </View>

      {/* Game area — full background image, no overlay */}
      <View style={styles.gameArea} {...panResponder.panHandlers}>
        <ImageBackground
          source={gameBackground}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />

        <View pointerEvents="none" style={styles.araucariaFrame}>
          <Image
            source={araucariaImage}
            style={styles.araucariaShadow}
            resizeMode="contain"
          />
          <Image
            source={araucariaImage}
            style={styles.araucaria}
            resizeMode="contain"
          />
        </View>

        {/* Falling cone */}
        {coneVisible && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.fallingCone,
              {
                left: coneXState,
                transform: [{ translateY: coneAnimY }]
              }
            ]}
          >
            <View style={styles.coneBody}>
              <View style={styles.coneScale} />
              <View style={[styles.coneScale, { top: 18 }]} />
              <View style={[styles.coneScale, { top: 26 }]} />
            </View>
          </Animated.View>
        )}

        {/* Coin collect animation */}
        {showCollectAnim && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.collectAnimation,
              {
                left: collectAnimPos.x,
                top: collectAnimPos.y,
                opacity: coinOpacity,
                transform: [{ translateY: coinTranslateY }]
              }
            ]}
          >
            <Text style={styles.coinEmoji}>🪙</Text>
            <Text style={styles.coinText}>+5</Text>
          </Animated.View>
        )}

        {/* Basket */}
        <Animated.View
          style={[styles.basket, { left: basketAnimX }]}
        >
          <Image
            source={BASKET_IMAGES[basketImageIndex]}
            style={styles.basketImage}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      {/* Message bar */}
      <View style={styles.messageArea}>
        <Text style={styles.messageText}>
          {gameComplete
            ? "Capivara feliz. Bora mais?"
            : "Pegue pinhas para a capivara."}
        </Text>
      </View>

      {/* Completion overlay */}
      {gameComplete && (
        <View style={styles.completionOverlay}>
          <View style={styles.completionCard}>
            <View style={styles.completionHeader}>
              <Text style={styles.completionTitle}>Capivara feliz</Text>
            </View>

            <Text style={styles.completionMessage}>
              Pinha boa. Cesta cheia.
            </Text>

            <View style={styles.rewardContainer}>
              <View style={styles.rewardItem}>
                <MaterialCommunityIcons color="#F5A623" name="gold" size={28} />
                <Text style={styles.rewardValue}>+{currentRoundCoinsReward} moedas</Text>
              </View>

              <View style={styles.rewardItem}>
                <MaterialCommunityIcons color="#E56A78" name="heart" size={28} />
                <Text style={styles.rewardValue}>+{currentRoundHappinessReward}% alegria</Text>
              </View>
            </View>

            <View style={styles.nextRoundNotice}>
              <Text style={styles.nextRoundText}>
                Mais {nextRoundBonusPercent}% na proxima.
              </Text>
            </View>

            <ActionButton
              label="Mais uma rodada"
              onPress={continueGame}
              variant="primary"
            />

            <ActionButton
              label="Voltar"
              onPress={() => navigation.navigate("MiniGames")}
              variant="soft"
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#202020"
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 10,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: "transparent"
  },
  backButton: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 23,
    backgroundColor: "#FFF4D8",
    borderWidth: 2,
    borderColor: "#B87534"
  },
  hudPill: {
    flex: 1,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "rgba(255, 248, 231, 0.97)",
    borderWidth: 3,
    borderColor: "#B87534",
    paddingHorizontal: 14
  },
  hudText: {
    color: "#5C351B",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center"
  },
  // Game area fills all remaining space between topRow and messageArea
  gameArea: {
    flex: 1,
    overflow: "hidden"
  },
  araucariaFrame: {
    position: "absolute",
    top: -24,
    alignSelf: "center",
    width: ARAUCARIA_WIDTH,
    height: ARAUCARIA_HEIGHT,
    zIndex: 4,
    shadowColor: "#12230F",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.42,
    shadowRadius: 18,
    elevation: 10
  },
  araucariaShadow: {
    position: "absolute",
    top: 15,
    left: 12,
    width: "100%",
    height: "100%",
    opacity: 0.32,
    tintColor: "#102412",
    transform: [{ scaleX: 1.02 }, { scaleY: 1.01 }]
  },
  araucaria: {
    width: "100%",
    height: "100%",
    opacity: 0.98
  },
  fallingCone: {
    position: "absolute",
    top: 0,
    width: 68,
    height: 68,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10
  },
  coneBody: {
    width: 32,
    height: 48,
    borderRadius: 20,
    backgroundColor: "#8A5428",
    borderWidth: 2,
    borderColor: "#5E351C",
    transform: [{ rotate: "8deg" }]
  },
  coneScale: {
    position: "absolute",
    left: 7,
    right: 7,
    top: 12,
    height: 3,
    borderRadius: 999,
    backgroundColor: "rgba(255, 220, 180, 0.45)"
  },
  collectAnimation: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 15
  },
  coinEmoji: {
    fontSize: 32
  },
  coinText: {
    color: "#5B3318",
    fontSize: 26,
    fontWeight: "900",
    marginTop: 2
  },
  basket: {
    position: "absolute",
    top: BASKET_Y,
    width: BASKET_WIDTH,
    height: BASKET_HEIGHT,
    zIndex: 20
  },
  basketImage: {
    width: "100%",
    height: "100%"
  },
  messageArea: {
    minHeight: 76,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 10,
    marginBottom: 10,
    marginTop: 8,
    borderRadius: 20,
    backgroundColor: "#FFF8E7",
    borderWidth: 2,
    borderColor: "#C1843C",
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  messageText: {
    color: "#5B3318",
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 27,
    textAlign: "center"
  },
  completionOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
    paddingHorizontal: 20
  },
  completionCard: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 26,
    backgroundColor: "#FFF8E7",
    borderWidth: 3,
    borderColor: "#A96325",
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 12
  },
  completionHeader: {
    borderRadius: 18,
    backgroundColor: "#8A5428",
    borderWidth: 3,
    borderColor: "#5E351C",
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 14
  },
  completionTitle: {
    color: "#FFF5DF",
    fontSize: 32,
    fontWeight: "900",
    textAlign: "center"
  },
  completionMessage: {
    color: "#5B3318",
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 28,
    textAlign: "center",
    marginBottom: 16
  },
  rewardContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12
  },
  rewardItem: {
    flex: 1,
    minHeight: 68,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#FFF0C5",
    borderWidth: 2,
    borderColor: "#C98B42",
    paddingVertical: 10,
    paddingHorizontal: 8
  },
  rewardValue: {
    color: "#5B3318",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 4,
    textAlign: "center"
  },
  nextRoundNotice: {
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#EAF7D9",
    borderWidth: 2,
    borderColor: "#82B854",
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  nextRoundText: {
    color: "#3F6F22",
    fontSize: 19,
    fontWeight: "900",
    lineHeight: 25,
    textAlign: "center"
  },
  pressed: {
    opacity: 0.72
  }
});
