import { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  ImageSourcePropType,
  StyleSheet,
  View
} from "react-native";

import { CapybaraMood, CapybaraScene } from "../types/game";

type CapybaraDisplayProps = {
  mood: CapybaraMood;
  scene?: CapybaraScene;
  compact?: boolean;
};

const moodText: Record<CapybaraMood, string> = {
  feliz: "Feliz",
  normal: "Calma",
  triste: "Precisa de carinho"
};

const sceneImages: Record<CapybaraScene, ImageSourcePropType> = {
  home: require("../../assets/images/capybara-hero.png"),
  kitchen: require("../../assets/images/capybara-kitchen.png"),
  bathroom: require("../../assets/images/capybara-bathroom.png"),
  garden: require("../../assets/images/capybara-lobby-cartoon.png"),
  bedroom: require("../../assets/images/capybara-bedroom.png")
};

export function CapybaraDisplay({
  mood,
  scene = "home",
  compact = false
}: CapybaraDisplayProps) {
  const bounce = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 450,
      useNativeDriver: true
    }).start();
  }, [fade, scene]);

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
    outputRange: [0, mood === "triste" ? 4 : -8]
  });

  return (
    <View
      style={[styles.container, compact && styles.compactContainer]}
      accessibilityLabel={`Capivara ${moodText[mood]}`}
    >
      <View style={styles.sparkleOne} />
      <View style={styles.sparkleTwo} />
      <Animated.View style={{ opacity: fade, transform: [{ translateY }] }}>
        <Image
          resizeMode="cover"
          source={sceneImages[scene]}
          style={[styles.image, compact && styles.compactImage]}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    borderRadius: 26,
    backgroundColor: "#FFF2D2",
    borderWidth: 3,
    borderColor: "#C1843C",
    marginVertical: 12,
    shadowColor: "#6D4322",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6
  },
  compactContainer: {
    marginBottom: 18
  },
  image: {
    width: "100%",
    height: 370,
    borderRadius: 22
  },
  compactImage: {
    height: 330
  },
  sparkleOne: {
    position: "absolute",
    zIndex: 2,
    width: 12,
    height: 12,
    right: 54,
    top: 64,
    borderRadius: 6,
    backgroundColor: "#FFD76C"
  },
  sparkleTwo: {
    position: "absolute",
    zIndex: 2,
    width: 9,
    height: 9,
    left: 28,
    top: 46,
    borderRadius: 5,
    backgroundColor: "#FFF7B5"
  }
});
