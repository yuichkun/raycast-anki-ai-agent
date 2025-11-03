import { Tool } from "@raycast/api";
import { getDeckMappings } from "../storage";
import { checkAnkiConnection, addNote, findNotes, notesInfo } from "../ankiConnect";

type Input = {
  /**
   * The ID of the Anki deck to add the card to. MUST call get-deck-configurations first to see available deck IDs and card format requirements.
   */
  deckId: number;

  /**
   * Front field of the card (required). Format this according to the deck's front template from get-deck-configurations.
   */
  Front: string;

  /**
   * Back field of the card (required). Format this according to the deck's back template from get-deck-configurations.
   */
  Back: string;

  /**
   * Optional comma-separated tags to add to the card
   */
  tags?: string;
};

/**
 * Add a new card to Anki
 */
export default async function tool(input: Input): Promise<string> {
  // Runtime validation: Validate deck ID
  if (typeof input.deckId !== "number" || input.deckId <= 0) {
    return "❌ Validation error: Invalid deck ID.\n\n**Please call get-deck-configurations first** to see available deck IDs and card format requirements.";
  }

  // Runtime validation: Check required fields
  if (!input.Front || input.Front.trim() === "") {
    return "❌ Validation error: Front field is required.";
  }
  if (!input.Back || input.Back.trim() === "") {
    return "❌ Validation error: Back field is required.";
  }

  // Check if Anki is running
  const ankiConnected = await checkAnkiConnection();
  if (!ankiConnected) {
    return "❌ Cannot connect to Anki. Please make sure:\n1. Anki is running\n2. AnkiConnect plugin is installed (code: 2055492159)";
  }

  // Validate deck configuration
  const mappings = await getDeckMappings();
  if (mappings.length === 0) {
    return "❌ No deck configurations found.\n\nPlease ask the user to run the 'Configure Anki Decks' command to set up their decks first.";
  }

  // Check if the requested deck ID is in the configured mappings
  const deckMapping = mappings.find((m) => m.deckId === input.deckId);
  if (!deckMapping) {
    return `❌ Validation error: Deck ID ${input.deckId} is not configured.\n\n**Please call get-deck-configurations first** to see available deck IDs.`;
  }

  // Build fields object
  const fields: Record<string, string> = {
    Front: input.Front.trim(),
    Back: input.Back.trim(),
  };

  // Parse tags
  const tags = input.tags ? input.tags.split(",").map((t) => t.trim()) : [];

  // Check for duplicates
  try {
    const duplicateIds = await findNotes(`deck:"${deckMapping.deckName}" ${input.Front}`);
    if (duplicateIds.length > 0) {
      const duplicateInfo = await notesInfo(duplicateIds);
      const existingCards = duplicateInfo
        .map((note) => {
          const fieldsText = Object.entries(note.fields)
            .map(([key, value]) => `  ${key}: ${value.value}`)
            .join("\n");
          return `Card ID ${note.noteId}:\n${fieldsText}`;
        })
        .join("\n\n");

      return `⚠️  Found ${duplicateIds.length} potentially duplicate card(s):\n\n${existingCards}\n\nPlease review these cards in Anki before creating a new one.`;
    }
  } catch (error) {
    // If duplicate check fails, continue with creation
    console.error("Duplicate check failed:", error);
  }

  // Create the card using deck's configured note type
  try {
    const noteId = await addNote({
      deckName: deckMapping.deckName,
      modelName: deckMapping.noteType,
      fields,
      tags,
    });

    const fieldsText = Object.entries(fields)
      .map(([key, value]) => `  ${key}: ${value}`)
      .join("\n");

    return `✅ Card created successfully!\n\nDeck: ${deckMapping.deckName}\nNote Type: ${deckMapping.noteType}\nNote ID: ${noteId}\n\nFields:\n${fieldsText}${tags.length > 0 ? `\n\nTags: ${tags.join(", ")}` : ""}`;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return `❌ Failed to create card: ${errorMessage}\n\nPlease check:\n1. The note type "${deckMapping.noteType}" exists in Anki\n2. All required fields are provided\n3. The deck "${deckMapping.deckName}" exists`;
  }
}

/**
 * Confirmation prompt before creating the card
 */
export const confirmation: Tool.Confirmation<Input> = async (input) => {
  // Get deck configuration for display
  const mappings = await getDeckMappings();
  const deckMapping = mappings.find((m) => m.deckId === input.deckId);
  const deckName = deckMapping ? deckMapping.deckName : `Deck ID ${input.deckId}`;
  const noteType = deckMapping ? deckMapping.noteType : "Unknown";

  const tags = input.tags ? input.tags.split(",").map((t) => t.trim()) : [];

  // Build info array with structured data
  const info: Array<{ name: string; value?: string }> = [
    { name: "Deck", value: deckName },
    { name: "Note Type", value: noteType },
    { name: "Front", value: input.Front },
    { name: "Back", value: input.Back },
  ];

  // Add tags if present
  if (tags.length > 0) {
    info.push({ name: "Tags", value: tags.join(", ") });
  }

  return {
    message: "Create this card in Anki?",
    info,
  };
};
