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

const SCREEN_WIDTH = Dimensions.get("window").width;
const TOTAL_CONES = 10;
const COINS_PER_CONE = 5;
const TOTAL_COINS_REWARD = TOTAL_CONES * COINS_PER_CONE;
const HAPPINESS_REWARD = 25;
const CONE_DROP_DURATION_MIN = 4500;
const CONE_DROP_DURATION_MAX = 5500;
const CONE_START_Y = 100;
const CONE_END_Y = 380;
const BASKET_Y = 390;
const BASKET_WIDTH = 100;
const BASKET_HEIGHT = 80;
const TREE_CENTER_X = SCREEN_WIDTH / 2;
const TREE_SPAWN_RANGE = 100;
const COLLISION_TOLERANCE_Y = 35;
const COLLISION_TOLERANCE_X = 25;

const forestBackground = require("../../assets/images/capybara-garden.png");
const capybaraImage = require("../../assets/images/capybara-hero.png");

export function CatchFoodGameScreen({ navigation }: Props) {
  const [collectedCount, setCollectedCount] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [showCollectAnim, setShowCollectAnim] = useState(false);
  const [collectAnimX, setCollectAnimX] = useState(0);

  const basketX = useRef(SCREEN_WIDTH / 2 - BASKET_WIDTH / 2);
  const basketAnimX = useRef(new Animated.Value(basketX.current)).current;
  
  const coneX = useRef(0);
  const coneY = useRef(CONE_START_Y);
  const coneAnimY = useRef(new Animated.Value(CONE_START_Y)).current;
  const coneActive = useRef(false);
  const coneAnimation = useRef<Animated.CompositeAnimation | null>(null);
  
  const collectAnimProgress = useRef(new Animated.Value(0)).current;
  const detectionLoopRef = useRef<number | null>(null);
  const rewardAppliedRef = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const newX = Math.max(
          0,
          Math.min(SCREEN_WIDTH - BASKET_WIDTH, basketX.current + gestureState.dx)
        );
        basketX.current = newX;
        basketAnimX.setValue(newX);
      },
      onPanResponderRelease: (_, gestureState) => {
        basketX.current = Math.max(
          0,
          Math.min(SCREEN_WIDTH - BASKET_WIDTH, basketX.current + gestureState.dx)
        );
      }
    })
  ).current;

  useEffect(() => {
    spawnCone(0);

    return () => {
      if (detectionLoopRef.current) {
        cancelAnimationFrame(detectionLoopRef.current);
      }
      if (coneAnimation.current) {
        coneAnimation.current.stop();
      }
    };
  }, []);

  const spawnCone = useCallback((currentCount: number) => {
    if (currentCount >= TOTAL_CONES) {
      return;
    }

    setTimeout(() => {
      const spawnX = TREE_CENTER_X - TREE_SPAWN_RANGE / 2 + Math.random() * TREE_SPAWN_RANGE;
      const duration = CONE_DROP_DURATION_MIN + Math.random() * (CONE_DROP_DURATION_MAX - CONE_DROP_DURATION_MIN);

      coneX.current = spawnX;
      coneY.current = CONE_START_Y;
      coneAnimY.setValue(CONE_START_Y);
      coneActive.current = true;

      coneAnimation.current = Animated.timing(coneAnimY, {
        toValue: CONE_END_Y,
        duration,
        easing: Easing.linear,
        useNativeDriver: true
      });

      coneAnimation.current.start(({ finished }) => {
        if (finished && coneActive.current) {
          coneActive.current = false;
          setTimeout(() => spawnCone(currentCount), 800);
        }
      });

      startCollisionDetection(currentCount);
    }, 400);
  }, []);

  const startCollisionDetection = useCallback((currentCount: number) => {
    const checkCollision = () => {
      if (!coneActive.current) {
        return;
      }

      coneAnimY.addListener(({ value }) => {
        coneY.current = value;
      });

      const coneCenter = coneX.current + 34;
      const basketLeft = basketX.current;
      const basketRight = basketLeft + BASKET_WIDTH;
      const basketCenterY = BASKET_Y + BASKET_HEIGHT / 2;

      const isYCollision = Math.abs(coneY.current - basketCenterY) < COLLISION_TOLERANCE_Y;
      const isXCollision = coneCenter > basketLeft - COLLISION_TOLERANCE_X && 
                           coneCenter < basketRight + COLLISION_TOLERANCE_X;

      if (isYCollision && isXCollision && coneActive.current) {
        coneActive.current = false;
        if (coneAnimation.current) {
          coneAnimation.current.stop();
        }
        collectCone(currentCount);
        return;
      }

      detectionLoopRef.current = requestAnimationFrame(checkCollision);
    };

    detectionLoopRef.current = requestAnimationFrame(checkCollision);
  }, []);

  const collectCone = useCallback((currentCount: number) => {
    setCollectAnimX(coneX.current);
    setShowCollectAnim(true);
    collectAnimProgress.setValue(0);

    Animated.timing(collectAnimProgress, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true
    }).start(({ finished }) => {
      if (!finished) {
        return;
      }

      setShowCollectAnim(false);
      const nextCount = currentCount + 1;
      setCollectedCount(nextCount);

      if (nextCount >= TOTAL_CONES) {
        completeGame();
      } else {
        spawnCone(nextCount);
      }
    });
  }, []);

  const completeGame = useCallback(async () => {
    if (detectionLoopRef.current) {
      cancelAnimationFrame(detectionLoopRef.current);
    }

    setGameComplete(true);

    if (!rewardAppliedRef.current) {
      rewardAppliedRef.current = true;
      const currentStatus = await loadGameStatus();
      const rewardedStatus = addHappinessBonus(
        addCoinsBonus(currentStatus, TOTAL_COINS_REWARD),
        HAPPINESS_REWARD
      );
      await saveGameStatus(rewardedStatus);
    }
  }, []);

  const coinTranslateY = collectAnimProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -40]
  });

  const coinOpacity = collectAnimProgress.interpolate({
    inputRange: [0, 0.1, 0.8, 1],
    outputRange: [0, 1, 1, 0]
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground source={forestBackground} style={styles.background} imageStyle={styles.backgroundImage}>
        <View style={styles.overlay}>
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
              <Text style={styles.hudText}>🌲 {collectedCount} / {TOTAL_CONES} pinhas</Text>
            </View>
          </View>

          <View style={styles.gameArea}>
            <View style={styles.skyGradient}>
              <View style={styles.sun} />
            </View>

            <View style={styles.hillLayer3} />
            <View style={styles.hillLayer2} />
            <View style={styles.hillLayer1} />

            <View style={[styles.backgroundTree, { left: 40, bottom: 200 }]}>
              <View style={styles.bgTreeTrunk} />
              <View style={styles.bgTreeCanopy} />
            </View>

            <View style={[styles.backgroundTree, { right: 50, bottom: 220 }]}>
              <View style={styles.bgTreeTrunk} />
              <View style={styles.bgTreeCanopy} />
            </View>

            <View style={styles.mainAraucaria}>
              <View style={styles.mainTrunk} />
              <View style={styles.mainBranch1} />
              <View style={styles.mainBranch2} />
              <View style={styles.mainBranch3} />
              <View style={styles.mainCanopy} />
              <View style={[styles.mainCanopy, styles.mainCanopyLeft]} />
              <View style={[styles.mainCanopy, styles.mainCanopyRight]} />
            </View>

            {coneActive.current && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.fallingCone,
                  {
                    left: coneX.current,
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

            {showCollectAnim && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.collectAnimation,
                  {
                    left: collectAnimX,
                    top: coneY.current,
                    opacity: coinOpacity,
                    transform: [{ translateY: coinTranslateY }]
                  }
                ]}
              >
                <Text style={styles.coinEmoji}>🪙</Text>
                <Text style={styles.coinText}>+5</Text>
              </Animated.View>
            )}

            <View style={styles.groundLayer} />

            <Image source={capybaraImage} style={styles.capybaraImage} resizeMode="contain" />

            <Animated.View
              {...panResponder.panHandlers}
              style={[
                styles.basket,
                {
                  left: basketAnimX
                }
              ]}
            >
              <View style={styles.basketBody}>
                <View style={styles.basketHandle} />
                <View style={styles.basketWeave} />
              </View>
            </Animated.View>
          </View>

          <View style={styles.messageArea}>
            <Text style={styles.messageText}>
              {gameComplete 
                ? "Todas as pinhas foram coletadas!" 
                : "Arraste a cesta para pegar as pinhas."}
            </Text>
          </View>
        </View>

        {gameComplete && (
          <View style={styles.completionOverlay}>
            <View style={styles.completionCard}>
              <View style={styles.completionHeader}>
                <Text style={styles.completionTitle}>Parabéns! 🎉</Text>
              </View>

              <Text style={styles.completionMessage}>
                Você coletou todas as 10 pinhas da araucária!
              </Text>

              <View style={styles.rewardContainer}>
                <View style={styles.rewardItem}>
                  <MaterialCommunityIcons color="#F5A623" name="gold" size={28} />
                  <Text style={styles.rewardValue}>+50 moedas</Text>
                </View>

                <View style={styles.rewardItem}>
                  <MaterialCommunityIcons color="#E56A78" name="heart" size={28} />
                  <Text style={styles.rewardValue}>+25% 😊</Text>
                </View>
              </View>

              <ActionButton 
                label="Voltar" 
                onPress={() => navigation.navigate("MiniGames")} 
                variant="soft" 
              />
            </View>
          </View>
        )}
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#202020"
  },
  background: {
    flex: 1
  },
  backgroundImage: {
    opacity: 0.25
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(247, 242, 225, 0.85)",
    paddingHorizontal: 10,
    paddingTop: 16,
    paddingBottom: 12
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10
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
  gameArea: {
    flex: 1,
    borderRadius: 28,
    backgroundColor: "#C5E4FF",
    borderWidth: 3,
    borderColor: "#7FA952",
    overflow: "hidden",
    shadowColor: "#6D4322",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6
  },
  skyGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    backgroundColor: "#B8DCFF"
  },
  sun: {
    position: "absolute",
    top: 20,
    right: 40,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFE680",
    shadowColor: "#FFC940",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20
  },
  hillLayer3: {
    position: "absolute",
    left: -40,
    right: -40,
    bottom: 210,
    height: 140,
    borderTopLeftRadius: 140,
    borderTopRightRadius: 140,
    backgroundColor: "#A1D169"
  },
  hillLayer2: {
    position: "absolute",
    left: -20,
    right: -50,
    bottom: 140,
    height: 160,
    borderTopLeftRadius: 160,
    borderTopRightRadius: 100,
    backgroundColor: "#88C456"
  },
  hillLayer1: {
    position: "absolute",
    left: -30,
    right: -20,
    bottom: 80,
    height: 180,
    borderTopLeftRadius: 120,
    borderTopRightRadius: 180,
    backgroundColor: "#75B43F"
  },
  backgroundTree: {
    position: "absolute",
    width: 50,
    alignItems: "center"
  },
  bgTreeTrunk: {
    width: 10,
    height: 60,
    borderRadius: 6,
    backgroundColor: "#6D4322"
  },
  bgTreeCanopy: {
    position: "absolute",
    top: -10,
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#508131",
    borderWidth: 1,
    borderColor: "#3A5F24"
  },
  mainAraucaria: {
    position: "absolute",
    left: "50%",
    bottom: 100,
    width: 160,
    height: 300,
    marginLeft: -80,
    alignItems: "center"
  },
  mainTrunk: {
    position: "absolute",
    bottom: 0,
    width: 32,
    height: 180,
    borderRadius: 16,
    backgroundColor: "#7A4825",
    borderWidth: 2,
    borderColor: "#5E351C"
  },
  mainBranch1: {
    position: "absolute",
    top: 80,
    width: 20,
    height: 70,
    borderRadius: 12,
    backgroundColor: "#7A4825"
  },
  mainBranch2: {
    position: "absolute",
    top: 120,
    left: 30,
    width: 18,
    height: 60,
    borderRadius: 10,
    backgroundColor: "#7A4825",
    transform: [{ rotate: "28deg" }]
  },
  mainBranch3: {
    position: "absolute",
    top: 120,
    right: 30,
    width: 18,
    height: 60,
    borderRadius: 10,
    backgroundColor: "#7A4825",
    transform: [{ rotate: "-28deg" }]
  },
  mainCanopy: {
    position: "absolute",
    top: 30,
    width: 130,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#4A7A2B",
    borderWidth: 2,
    borderColor: "#36591C"
  },
  mainCanopyLeft: {
    top: 110,
    left: 0,
    width: 90,
    height: 38
  },
  mainCanopyRight: {
    top: 110,
    right: 0,
    width: 90,
    height: 38
  },
  fallingCone: {
    position: "absolute",
    top: CONE_START_Y,
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
  groundLayer: {
    position: "absolute",
    left: -20,
    right: -20,
    bottom: 0,
    height: 120,
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
    backgroundColor: "#9DD15F"
  },
  capybaraImage: {
    position: "absolute",
    left: "50%",
    bottom: 10,
    width: 160,
    height: 180,
    marginLeft: -105,
    zIndex: 5
  },
  basket: {
    position: "absolute",
    top: BASKET_Y,
    width: BASKET_WIDTH,
    height: BASKET_HEIGHT,
    zIndex: 20
  },
  basketBody: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
    backgroundColor: "#C98B42",
    borderWidth: 3,
    borderColor: "#8A5428",
    overflow: "hidden"
  },
  basketHandle: {
    position: "absolute",
    left: 18,
    right: 18,
    top: -16,
    height: 22,
    borderRadius: 16,
    borderWidth: 4,
    borderColor: "#8A5428"
  },
  basketWeave: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "45%",
    height: 6,
    backgroundColor: "rgba(122, 67, 29, 0.28)"
  },
  messageArea: {
    minHeight: 76,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
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