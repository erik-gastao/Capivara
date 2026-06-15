import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";

import { CatchFoodGameScreen } from "./src/screens/CatchFoodGameScreen";
import { GameScreen } from "./src/screens/GameScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { MemoryGameScreen } from "./src/screens/MemoryGameScreen";
import { MiniGamesScreen } from "./src/screens/MiniGamesScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { RoomScreen } from "./src/screens/RoomScreen";
import { ShopScreen } from "./src/screens/ShopScreen";
import { RootStackParamList } from "./src/types/game";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#F8F3E8" }
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
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
}
