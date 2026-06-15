export type CapybaraStatus = {
  coins: number;
  hunger: number;
  happiness: number;
  energy: number;
  hygiene: number;
};

export type CapybaraMood = "feliz" | "normal" | "triste";

export type CareAction = "feed" | "bath" | "play" | "sleep";

export type RoomName = "Kitchen" | "Bathroom" | "Garden" | "Bedroom";

export type CapybaraScene = "home" | "kitchen" | "bathroom" | "garden" | "bedroom";

export type RootStackParamList = {
  Home: undefined;
  Game: { happinessBonus?: number } | undefined;
  MiniGames: undefined;
  CatchFoodGame: undefined;
  MemoryGame: undefined;
  Shop: undefined;
  Profile: undefined;
  Kitchen: undefined;
  Bathroom: undefined;
  Garden: undefined;
  Bedroom: undefined;
};
