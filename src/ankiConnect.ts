/**
 * AnkiConnect client for communicating with Anki desktop application
 */

const ANKI_CONNECT_URL = "http://127.0.0.1:8765";

export interface AnkiConnectResponse<T> {
  result: T | null;
  error: string | null;
}

export interface DeckInfo {
  name: string;
  id: number;
}

/**
 * Send a request to AnkiConnect
 */
async function invokeAnkiConnect<T>(action: string, params?: Record<string, unknown>): Promise<T> {
  const response = await fetch(ANKI_CONNECT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action,
      version: 6,
      params: params || {},
    }),
  });

  if (!response.ok) {
    throw new Error(`AnkiConnect request failed: ${response.statusText}`);
  }

  const data = (await response.json()) as AnkiConnectResponse<T>;

  if (data.error) {
    throw new Error(data.error);
  }

  if (data.result === null) {
    throw new Error("AnkiConnect returned null result");
  }

  return data.result;
}

/**
 * Check if Anki is running and AnkiConnect is available
 */
export async function checkAnkiConnection(): Promise<boolean> {
  try {
    await invokeAnkiConnect("version");
    return true;
  } catch {
    return false;
  }
}

/**
 * Get all deck names and IDs from Anki
 */
export async function getDeckNamesAndIds(): Promise<Record<string, number>> {
  return await invokeAnkiConnect<Record<string, number>>("deckNamesAndIds");
}

/**
 * Get all available decks as an array
 */
export async function getDecks(): Promise<DeckInfo[]> {
  const deckMap = await getDeckNamesAndIds();
  return Object.entries(deckMap).map(([name, id]) => ({
    name,
    id,
  }));
}

/**
 * Add a note to Anki
 */
export async function addNote(params: {
  deckName: string;
  modelName: string;
  fields: Record<string, string>;
  tags?: string[];
}): Promise<number> {
  return await invokeAnkiConnect<number>("addNote", {
    note: {
      deckName: params.deckName,
      modelName: params.modelName,
      fields: params.fields,
      tags: params.tags || [],
      options: {
        allowDuplicate: false,
      },
    },
  });
}

/**
 * Find notes by query
 */
export async function findNotes(query: string): Promise<number[]> {
  return await invokeAnkiConnect<number[]>("findNotes", { query });
}

/**
 * Get information about notes
 */
export async function notesInfo(noteIds: number[]): Promise<
  Array<{
    noteId: number;
    modelName: string;
    tags: string[];
    fields: Record<string, { value: string; order: number }>;
  }>
> {
  return await invokeAnkiConnect("notesInfo", { notes: noteIds });
}

/**
 * Update fields of an existing note
 */
export async function updateNoteFields(noteId: number, fields: Record<string, string>): Promise<void> {
  await invokeAnkiConnect("updateNoteFields", {
    note: {
      id: noteId,
      fields,
    },
  });
}

/**
 * Get available model (note type) names
 */
export async function getModelNames(): Promise<string[]> {
  return await invokeAnkiConnect<string[]>("modelNames");
}

/**
 * Get field names for a specific model
 */
export async function getModelFieldNames(modelName: string): Promise<string[]> {
  return await invokeAnkiConnect<string[]>("modelFieldNames", { modelName });
}
