import { LocalStorage } from "@raycast/api";

export interface DeckConfiguration {
  deckId: number;
  deckName: string;
  purpose: string;
  noteType: "Basic" | "Basic (and reversed card)";
  frontTemplate: string;
  backTemplate: string;
  frontExample: string;
  backExample: string;
}

const DECK_CONFIGURATIONS_KEY = "deck-configurations";

/**
 * Get all configured deck configurations
 */
export async function getDeckConfigurations(): Promise<DeckConfiguration[]> {
  const data = await LocalStorage.getItem<string>(DECK_CONFIGURATIONS_KEY);
  if (!data) {
    return [];
  }
  return JSON.parse(data) as DeckConfiguration[];
}

/**
 * Save deck configurations to storage
 */
export async function saveDeckConfigurations(configurations: DeckConfiguration[]): Promise<void> {
  await LocalStorage.setItem(DECK_CONFIGURATIONS_KEY, JSON.stringify(configurations));
}

/**
 * Add a new deck configuration
 */
export async function addDeckConfiguration(configuration: DeckConfiguration): Promise<void> {
  const configurations = await getDeckConfigurations();

  // Remove existing configuration for the same deck if any
  const filtered = configurations.filter((c) => c.deckId !== configuration.deckId);

  filtered.push(configuration);
  await saveDeckConfigurations(filtered);
}

/**
 * Remove a deck configuration by deck ID
 */
export async function removeDeckConfiguration(deckId: number): Promise<void> {
  const configurations = await getDeckConfigurations();
  const filtered = configurations.filter((c) => c.deckId !== deckId);
  await saveDeckConfigurations(filtered);
}

/**
 * Check if a deck configuration already exists
 */
export async function isDeckConfigured(deckId: number): Promise<boolean> {
  const configurations = await getDeckConfigurations();
  return configurations.some((c) => c.deckId === deckId);
}
