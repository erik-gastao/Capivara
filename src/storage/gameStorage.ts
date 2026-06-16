import AsyncStorage from "@react-native-async-storage/async-storage";

import { CapybaraStatus, RoomName } from "../types/game";
import { initialStatus } from "../utils/statusRules";

const STORAGE_KEY = "@capivara-companheira/status";

// Carrega o progresso salvo no celular. Se não existir, começa com valores iniciais.
export async function loadGameStatus(): Promise<CapybaraStatus> {
  const storedStatus = await AsyncStorage.getItem(STORAGE_KEY);

  if (!storedStatus) {
    return initialStatus;
  }

  try {
    return {
      ...initialStatus,
      ...(JSON.parse(storedStatus) as Partial<CapybaraStatus>)
    };
  } catch {
    return initialStatus;
  }
}

// Salva os status localmente para manter o progresso ao reabrir o app.
export async function saveGameStatus(status: CapybaraStatus) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(status));
}

const LAST_ROOM_KEY = "@capivara-companheira/last-room";

export async function saveLastRoom(room: RoomName | null): Promise<void> {
  if (room === null) {
    await AsyncStorage.removeItem(LAST_ROOM_KEY);
  } else {
    await AsyncStorage.setItem(LAST_ROOM_KEY, room);
  }
}

export async function loadLastRoom(): Promise<RoomName | null> {
  const value = await AsyncStorage.getItem(LAST_ROOM_KEY);
  return (value as RoomName) ?? null;
}
