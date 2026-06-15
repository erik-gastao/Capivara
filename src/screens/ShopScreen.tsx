import { useCallback, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { GameBottomNav } from "../components/GameBottomNav";
import { loadGameStatus } from "../storage/gameStorage";
import { CapybaraStatus, RootStackParamList } from "../types/game";
import { initialStatus } from "../utils/statusRules";

type Props = NativeStackScreenProps<RootStackParamList, "Shop">;

const categories = ["Acessórios", "Comidas", "Decorações", "Especiais"];

const shopItems: Array<{
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor: string;
  name: string;
  price: number;
}> = [
  { iconName: "hat-fedora", iconColor: "#C98B42", name: "Chapéu de Palha", price: 200 },
  { iconName: "glasses", iconColor: "#5D351C", name: "Óculos Redondo", price: 150 },
  { iconName: "tshirt-crew", iconColor: "#5C9E38", name: "Cachecol", price: 180 },
  { iconName: "hat-fedora", iconColor: "#8A4A28", name: "Boina", price: 160 },
  { iconName: "leaf", iconColor: "#65A83E", name: "Tiara de Folhas", price: 150 },
  { iconName: "headphones", iconColor: "#4B4B4B", name: "Fone de Ouvido", price: 200 },
  { iconName: "lifebuoy", iconColor: "#E86C78", name: "Boia Flamingo", price: 250 },
  { iconName: "rug", iconColor: "#A96325", name: "Tapete Capivara", price: 300 },
  { iconName: "lamp", iconColor: "#7DA646", name: "Luminária Folha", price: 220 }
];

export function ShopScreen({ navigation }: Props) {
  const [status, setStatus] = useState<CapybaraStatus>(initialStatus);

  useFocusEffect(
    useCallback(() => {
      loadGameStatus().then(setStatus);
    }, [])
  );

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

            <View style={styles.woodHeader}>
              <MaterialCommunityIcons color="#79B94A" name="leaf" size={22} />
              <Text style={styles.title}>Loja</Text>
            </View>

            <View style={styles.coinPill}>
              <MaterialCommunityIcons color="#F5A623" name="gold" size={19} />
              <Text style={styles.coinText}>{status.coins}</Text>
              <View style={styles.plusCircle}>
                <MaterialCommunityIcons color="#FFFFFF" name="plus" size={18} />
              </View>
            </View>
          </View>

          <View style={styles.tabs}>
            {categories.map((category, index) => (
              <View
                key={category}
                style={[styles.tab, index === 0 && styles.activeTab]}
              >
                <Text style={[styles.tabText, index === 0 && styles.activeTabText]}>
                  {category}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.grid}>
            {shopItems.map((item) => (
              <Pressable
                accessibilityRole="button"
                key={item.name}
                style={({ pressed }) => [styles.itemCard, pressed && styles.pressed]}
              >
                <View style={styles.itemArt}>
                  <MaterialCommunityIcons
                    color={item.iconColor}
                    name={item.iconName}
                    size={42}
                  />
                </View>
                <Text style={styles.itemName}>{item.name}</Text>
                <View style={styles.priceRow}>
                  <MaterialCommunityIcons color="#E6A135" name="gold" size={13} />
                  <Text style={styles.price}>{item.price}</Text>
                </View>
              </Pressable>
            ))}
          </View>

          <GameBottomNav
            active="shop"
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
  woodHeader: {
    flex: 1,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    borderRadius: 18,
    backgroundColor: "#8A5428",
    borderWidth: 3,
    borderColor: "#5E351C",
    paddingHorizontal: 12
  },
  title: {
    color: "#FFF5DF",
    fontSize: 30,
    fontWeight: "900",
    marginLeft: 6,
    textAlign: "center",
    textShadowColor: "#5E351C",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 1
  },
  coinPill: {
    height: 38,
    alignItems: "center",
    flexDirection: "row",
    borderRadius: 20,
    backgroundColor: "#FFF5D9",
    borderWidth: 2,
    borderColor: "#A96325",
    paddingLeft: 6,
    paddingRight: 5
  },
  coinText: {
    color: "#4E2D17",
    fontSize: 16,
    fontWeight: "900",
    marginLeft: 3,
    marginRight: 4
  },
  plusCircle: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "#67AF31"
  },
  tabs: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 10
  },
  tab: {
    flex: 1,
    minHeight: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: "#FFF8E7",
    borderWidth: 1,
    borderColor: "#D6A86A",
    paddingHorizontal: 4
  },
  activeTab: {
    backgroundColor: "#77B936",
    borderColor: "#4F8626"
  },
  tabText: {
    color: "#6A3B1E",
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center"
  },
  activeTabText: {
    color: "#FFFFFF"
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12
  },
  itemCard: {
    width: "31.8%",
    minHeight: 134,
    alignItems: "center",
    borderRadius: 14,
    backgroundColor: "#FFF6DF",
    borderWidth: 2,
    borderColor: "#C99655",
    padding: 7,
    shadowColor: "#6D4322",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.13,
    shadowRadius: 5,
    elevation: 4
  },
  itemArt: {
    width: "100%",
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "#FFE9B7",
    marginBottom: 6
  },
  itemName: {
    minHeight: 31,
    color: "#593419",
    fontSize: 11,
    fontWeight: "900",
    lineHeight: 14,
    textAlign: "center"
  },
  priceRow: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: 2
  },
  price: {
    color: "#8A5428",
    fontSize: 12,
    fontWeight: "900",
    marginLeft: 3
  },
  pressed: {
    opacity: 0.72
  }
});
