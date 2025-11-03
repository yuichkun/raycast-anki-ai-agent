import { LocalStorage } from "@raycast/api";

export interface DeckMapping {
  deckId: number;
  deckName: string;
  purpose: string;
  noteType: "Basic" | "Basic (and reversed card)";
  frontTemplate: string;
  backTemplate: string;
  frontExample: string;
  backExample: string;
}

const DECK_MAPPINGS_KEY = "deck-mappings";

/**
 * Get all configured deck mappings
 */
export async function getDeckMappings(): Promise<DeckMapping[]> {
  const data = await LocalStorage.getItem<string>(DECK_MAPPINGS_KEY);
  if (!data) {
    return [];
  }
  return JSON.parse(data) as DeckMapping[];
}

/**
 * Save deck mappings to storage
 */
export async function saveDeckMappings(mappings: DeckMapping[]): Promise<void> {
  await LocalStorage.setItem(DECK_MAPPINGS_KEY, JSON.stringify(mappings));
}

/**
 * Add a new deck mapping
 */
export async function addDeckMapping(mapping: DeckMapping): Promise<void> {
  const mappings = await getDeckMappings();

  // Remove existing mapping for the same deck if any
  const filtered = mappings.filter((m) => m.deckId !== mapping.deckId);

  filtered.push(mapping);
  await saveDeckMappings(filtered);
}

/**
 * Remove a deck mapping by deck ID
 */
export async function removeDeckMapping(deckId: number): Promise<void> {
  const mappings = await getDeckMappings();
  const filtered = mappings.filter((m) => m.deckId !== deckId);
  await saveDeckMappings(filtered);
}

/**
 * Check if a deck is already mapped
 */
export async function isDeckMapped(deckId: number): Promise<boolean> {
  const mappings = await getDeckMappings();
  return mappings.some((m) => m.deckId === deckId);
}
