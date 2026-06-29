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
const ARAUCARIA_WIDTH = Math.min(SCREEN_WIDTH * 1.8, 780);
const ARAUCARIA_HEIGHT = Math.min(GAME_AREA_HEIGHT * 1.38, 820);

const CONE_SPAWN_MARGIN = 24;

// Collision — generous so gameplay feels fair
const COLLISION_TOLERANCE_Y = 40;
const COLLISION_TOLERANCE_X = 30;

const CONE_WIDTH = 54;
const CONE_HEIGHT = 54;
const MIN_CONE_SPAWN_DISTANCE = Math.min(SCREEN_WIDTH * 0.42, 180);

const gameBackground = require("../../assets/images/capybara-pine-game-bg.png");
const araucariaImage = require("../../assets/images/araucaria-wide.png");
const pineconeImage = require("../../assets/images/pinha-v2.png");

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
  const lastConeSpawnXRef = useRef<number | null>(null);
  const coneYRef = useRef(CONE_START_Y);
  const coneAnimY = useRef(new Animated.Value(CONE_START_Y)).current;
  const coneActiveRef = useRef(false);
  const coneAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  const collectAnimProgress = useRef(new Animated.Value(0)).current;
  const cloudDrift = useRef(new Animated.Value(0)).current;
  const lakeFlow = useRef(new Animated.Value(0)).current;
  const sceneAnimRefs = useRef<Animated.CompositeAnimation[]>([]);
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
    const cloudLoop = Animated.loop(
      Animated.timing(cloudDrift, {
        toValue: 1,
        duration: 24000,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true
      })
    );
    const lakeLoop = Animated.loop(
      Animated.timing(lakeFlow, {
        toValue: 1,
        duration: 4200,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true
      })
    );

    sceneAnimRefs.current = [cloudLoop, lakeLoop];
    cloudLoop.start();
    lakeLoop.start();
    spawnCone(0);

    return () => {
      sceneAnimRefs.current.forEach((animation) => animation.stop());
      if (rAFRef.current !== null) cancelAnimationFrame(rAFRef.current);
      if (coneAnimRef.current) coneAnimRef.current.stop();
      coneAnimY.removeAllListeners();
    };
  }, []);

  // ─── Spawn Cone ──────────────────────────────────────────────────────────────
  const spawnCone = useCallback((currentCount: number) => {
    if (currentCount >= TOTAL_CONES) return;

    setTimeout(() => {
      const minSpawnX = CONE_SPAWN_MARGIN;
      const maxSpawnX = SCREEN_WIDTH - CONE_WIDTH - CONE_SPAWN_MARGIN;
      let spawnX = minSpawnX + Math.random() * (maxSpawnX - minSpawnX);
      const lastSpawnX = lastConeSpawnXRef.current;

      if (lastSpawnX !== null) {
        for (let attempt = 0; attempt < 12; attempt += 1) {
          if (Math.abs(spawnX - lastSpawnX) >= MIN_CONE_SPAWN_DISTANCE) break;
          spawnX = minSpawnX + Math.random() * (maxSpawnX - minSpawnX);
        }

        if (Math.abs(spawnX - lastSpawnX) < MIN_CONE_SPAWN_DISTANCE) {
          spawnX =
            Math.abs(minSpawnX - lastSpawnX) > Math.abs(maxSpawnX - lastSpawnX)
              ? minSpawnX
              : maxSpawnX;
        }
      }

      const duration =
        (CONE_DROP_DURATION_MIN +
          Math.random() * (CONE_DROP_DURATION_MAX - CONE_DROP_DURATION_MIN)) *
        getRoundSpeedFactor(roundRef.current);

      lastConeSpawnXRef.current = spawnX;
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

  const coneSwayX = coneAnimY.interpolate({
    inputRange: [
      CONE_START_Y,
      CONE_START_Y + (CONE_END_Y - CONE_START_Y) * 0.2,
      CONE_START_Y + (CONE_END_Y - CONE_START_Y) * 0.4,
      CONE_START_Y + (CONE_END_Y - CONE_START_Y) * 0.6,
      CONE_START_Y + (CONE_END_Y - CONE_START_Y) * 0.8,
      CONE_END_Y
    ],
    outputRange: [0, -18, 16, -14, 18, 0]
  });

  const coneRotate = coneAnimY.interpolate({
    inputRange: [
      CONE_START_Y,
      CONE_START_Y + (CONE_END_Y - CONE_START_Y) * 0.15,
      CONE_START_Y + (CONE_END_Y - CONE_START_Y) * 0.25,
      CONE_START_Y + (CONE_END_Y - CONE_START_Y) * 0.4,
      CONE_START_Y + (CONE_END_Y - CONE_START_Y) * 0.5,
      CONE_START_Y + (CONE_END_Y - CONE_START_Y) * 0.65,
      CONE_START_Y + (CONE_END_Y - CONE_START_Y) * 0.75,
      CONE_END_Y
    ],
    outputRange: ["-18deg", "22deg", "-24deg", "20deg", "-18deg", "24deg", "-14deg", "6deg"]
  });

  const coneFlipScale = coneAnimY.interpolate({
    inputRange: [
      CONE_START_Y,
      CONE_START_Y + (CONE_END_Y - CONE_START_Y) * 0.2,
      CONE_START_Y + (CONE_END_Y - CONE_START_Y) * 0.4,
      CONE_START_Y + (CONE_END_Y - CONE_START_Y) * 0.6,
      CONE_START_Y + (CONE_END_Y - CONE_START_Y) * 0.8,
      CONE_END_Y
    ],
    outputRange: [1, 0.82, 1.08, 0.86, 1.05, 1]
  });

  const windShift = coneAnimY.interpolate({
    inputRange: [CONE_START_Y, CONE_END_Y],
    outputRange: [-70, 70]
  });

  const windOpacity = coneAnimY.interpolate({
    inputRange: [CONE_START_Y, CONE_START_Y + 60, CONE_END_Y - 70, CONE_END_Y],
    outputRange: [0, 0.7, 0.55, 0]
  });

  const cloudOneX = cloudDrift.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [-18, 26, -18]
  });

  const cloudTwoX = cloudDrift.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [22, -24, 22]
  });

  const cloudFloatY = cloudDrift.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -7, 0]
  });

  const lakeWaveX = lakeFlow.interpolate({
    inputRange: [0, 1],
    outputRange: [-34, 34]
  });

  const lakeWaveOpacity = lakeFlow.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.22, 0.62, 0.22]
  });

  const lakeWaveScale = lakeFlow.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.94, 1.06, 0.94]
  });

  const basketImageIndex = getBasketImageIndex(collectedCount);
  const currentRoundCoinsReward = getRoundCoinsReward(roundNumber);
  const currentRoundHappinessReward = getRoundHappinessReward(roundNumber);

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

        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Animated.View
            style={[
              styles.cloudCluster,
              styles.cloudClusterOne,
              {
                transform: [{ translateX: cloudOneX }, { translateY: cloudFloatY }]
              }
            ]}
          >
            <View style={[styles.cloudPuff, styles.cloudPuffLarge]} />
            <View style={[styles.cloudPuff, styles.cloudPuffMedium, styles.cloudPuffLeft]} />
            <View style={[styles.cloudPuff, styles.cloudPuffSmall, styles.cloudPuffRight]} />
            <View style={styles.cloudBase} />
          </Animated.View>

          <Animated.View
            style={[
              styles.cloudCluster,
              styles.cloudClusterTwo,
              {
                transform: [{ translateX: cloudTwoX }, { translateY: cloudFloatY }]
              }
            ]}
          >
            <View style={[styles.cloudPuff, styles.cloudPuffLarge]} />
            <View style={[styles.cloudPuff, styles.cloudPuffMedium, styles.cloudPuffLeft]} />
            <View style={[styles.cloudPuff, styles.cloudPuffSmall, styles.cloudPuffRight]} />
            <View style={styles.cloudBase} />
          </Animated.View>

          <Animated.View
            style={[
              styles.lakeWave,
              styles.lakeWaveOne,
              {
                opacity: lakeWaveOpacity,
                transform: [{ translateX: lakeWaveX }, { scaleX: lakeWaveScale }]
              }
            ]}
          />
          <Animated.View
            style={[
              styles.lakeWave,
              styles.lakeWaveTwo,
              {
                opacity: lakeWaveOpacity,
                transform: [{ translateX: lakeWaveX }, { scaleX: lakeWaveScale }]
              }
            ]}
          />
          <Animated.View
            style={[
              styles.lakeWave,
              styles.lakeWaveThree,
              {
                opacity: lakeWaveOpacity,
                transform: [{ translateX: lakeWaveX }, { scaleX: lakeWaveScale }]
              }
            ]}
          />
        </View>

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

        {coneVisible && (
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Animated.View
              style={[
                styles.windGust,
                styles.windGustOne,
                {
                  opacity: windOpacity,
                  transform: [{ translateX: windShift }, { rotate: "-8deg" }]
                }
              ]}
            />
            <Animated.View
              style={[
                styles.windGust,
                styles.windGustTwo,
                {
                  opacity: windOpacity,
                  transform: [{ translateX: windShift }, { rotate: "-8deg" }]
                }
              ]}
            />
            <Animated.View
              style={[
                styles.windGust,
                styles.windGustThree,
                {
                  opacity: windOpacity,
                  transform: [{ translateX: windShift }, { rotate: "-8deg" }]
                }
              ]}
            />
          </View>
        )}

        {/* Falling cone */}
        {coneVisible && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.fallingCone,
              {
                left: coneXState,
                transform: [
                  { translateY: coneAnimY },
                  { translateX: coneSwayX },
                  { rotate: coneRotate },
                  { scaleX: coneFlipScale }
                ]
              }
            ]}
          >
            <View style={styles.coneLayer}>
              <Image
                source={pineconeImage}
                style={styles.coneOutline}
                resizeMode="contain"
              />
              <Image
                source={pineconeImage}
                style={styles.coneImage}
                resizeMode="contain"
              />
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
              A proxima rodada vem mais rapida.
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
  cloudCluster: {
    position: "absolute",
    width: 128,
    height: 58,
    opacity: 0.62,
    zIndex: 1
  },
  cloudClusterOne: {
    top: "8%",
    left: "5%"
  },
  cloudClusterTwo: {
    top: "10%",
    right: "8%",
    transform: [{ scale: 0.92 }]
  },
  cloudPuff: {
    position: "absolute",
    bottom: 12,
    backgroundColor: "rgba(255, 255, 255, 0.9)"
  },
  cloudPuffLarge: {
    left: 42,
    width: 54,
    height: 54,
    borderRadius: 27
  },
  cloudPuffMedium: {
    width: 44,
    height: 38,
    borderRadius: 22
  },
  cloudPuffSmall: {
    width: 36,
    height: 30,
    borderRadius: 18
  },
  cloudPuffLeft: {
    left: 18
  },
  cloudPuffRight: {
    right: 12
  },
  cloudBase: {
    position: "absolute",
    left: 10,
    right: 8,
    bottom: 8,
    height: 22,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.86)"
  },
  lakeWave: {
    position: "absolute",
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(236, 255, 246, 0.82)",
    zIndex: 2
  },
  lakeWaveOne: {
    top: "45%",
    left: "30%",
    width: 118
  },
  lakeWaveTwo: {
    top: "51%",
    right: "22%",
    width: 92
  },
  lakeWaveThree: {
    top: "57%",
    left: "18%",
    width: 150
  },
  araucariaFrame: {
    position: "absolute",
    top: -132,
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
  windGust: {
    position: "absolute",
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255, 248, 220, 0.88)",
    shadowColor: "#FFF1A8",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 6,
    elevation: 6
  },
  windGustOne: {
    top: "26%",
    left: -20,
    width: 112
  },
  windGustTwo: {
    top: "42%",
    right: 24,
    width: 86
  },
  windGustThree: {
    top: "58%",
    left: "18%",
    width: 132
  },
  fallingCone: {
    position: "absolute",
    top: 0,
    width: CONE_WIDTH,
    height: CONE_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10
  },
  coneLayer: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center"
  },
  coneOutline: {
    position: "absolute",
    width: "108%",
    height: "108%",
    tintColor: "#FFD56A",
    shadowColor: "#FFD56A",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 8,
    elevation: 9
  },
  coneImage: {
    width: "92%",
    height: "92%"
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
  pressed: {
    opacity: 0.72
  }
});
