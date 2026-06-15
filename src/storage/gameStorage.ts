import AsyncStorage from "@react-native-async-storage/async-storage";

import { CapybaraStatus } from "../types/game";
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
