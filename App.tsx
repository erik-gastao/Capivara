import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { Platform, StyleSheet, View } from "react-native";

import { CatchFoodGameScreen } from "./src/screens/CatchFoodGameScreen";
import { GameScreen } from "./src/screens/GameScreen";
import { MemoryGameScreen } from "./src/screens/MemoryGameScreen";
import { MiniGamesScreen } from "./src/screens/MiniGamesScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { RoomScreen } from "./src/screens/RoomScreen";
import { ShopScreen } from "./src/screens/ShopScreen";
import { RootStackParamList } from "./src/types/game";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const nav = (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        initialRouteName="Game"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#F8F3E8" }
        }}
      >
        <Stack.Screen name="Game" component={GameScreen} />
        <Stack.Screen name="MiniGames" component={MiniGamesScreen} />
        <Stack.Screen name="CatchFoodGame" component={CatchFoodGameScreen} />
        <Stack.Screen name="MemoryGame" component={MemoryGameScreen} />
        <Stack.Screen name="Shop" component={ShopScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Kitchen" component={RoomScreen} />
        <Stack.Screen name="Bathroom" component={RoomScreen} />
        <Stack.Screen name="Garden" component={RoomScreen} />
        <Stack.Screen name="Bedroom" component={RoomScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );

  if (Platform.OS !== "web") return nav;

  return (
    <View style={styles.webOuter}>
      <View style={styles.webPhone}>{nav}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  webOuter: {
    flex: 1,
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
  },
  webPhone: {
    width: 390,
    height: 844,
    overflow: "hidden",
    borderRadius: 44,
  },
});
