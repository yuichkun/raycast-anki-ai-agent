import { Tool } from "@raycast/api";
import { getDeckMappings } from "../storage";
import { checkAnkiConnection, addNote, findNotes, notesInfo } from "../ankiConnect";

type Input = {
  /**
   * The ID of the Anki deck to add the card to. Call get-deck-mappings first to see available deck IDs.
   */
  deckId: number;

  /**
   * The note type (card type) to use: "Basic", "Basic (and reversed card)", or "Cloze"
   */
  noteType: "Basic" | "Basic (and reversed card)" | "Cloze";

  /**
   * Front field of the card (required for Basic cards). This is the question or prompt.
   */
  Front?: string;

  /**
   * Back field of the card (required for Basic cards). This is the answer.
   */
  Back?: string;

  /**
   * Text field (required for Cloze cards). Use cloze deletion syntax like "{{c1::Paris}} is the capital of {{c2::France}}"
   */
  Text?: string;

  /**
   * Optional extra field for additional information
   */
  Extra?: string;

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
    return "❌ Validation error: Invalid deck ID.\n\n**Please call get-deck-mappings first** to see available deck IDs, names, and purposes.";
  }

  // Runtime validation: Validate note type
  const validNoteTypes = ["Basic", "Basic (and reversed card)", "Cloze"];
  if (!validNoteTypes.includes(input.noteType)) {
    return `❌ Validation error: Invalid note type "${input.noteType}".\n\nSupported note types:\n- Basic\n- Basic (and reversed card)\n- Cloze`;
  }

  // Runtime validation: Check required fields based on note type
  if (input.noteType === "Cloze") {
    if (!input.Text || input.Text.trim() === "") {
      return "❌ Validation error: Text field is required for Cloze cards.\n\nExample: \"{{c1::Paris}} is the capital of {{c2::France}}\"";
    }
  } else if (input.noteType === "Basic" || input.noteType === "Basic (and reversed card)") {
    // Basic or Basic (and reversed card)
    if (!input.Front || input.Front.trim() === "") {
      return "❌ Validation error: Front field is required for Basic cards.";
    }
    if (!input.Back || input.Back.trim() === "") {
      return "❌ Validation error: Back field is required for Basic cards.";
    }
  } else {
    // This should never happen due to the type check above, but adding for exhaustiveness
    return `❌ Validation error: Unhandled note type "${input.noteType}".`;
  }

  // Check if Anki is running
  const ankiConnected = await checkAnkiConnection();
  if (!ankiConnected) {
    return "❌ Cannot connect to Anki. Please make sure:\n1. Anki is running\n2. AnkiConnect plugin is installed (code: 2055492159)";
  }

  // Validate deck configuration
  const mappings = await getDeckMappings();
  if (mappings.length === 0) {
    return "❌ No deck mappings configured.\n\nPlease ask the user to run the 'Configure Anki Decks' command to set up their decks first.";
  }

  // Check if the requested deck ID is in the configured mappings
  const deckMapping = mappings.find((m) => m.deckId === input.deckId);
  if (!deckMapping) {
    return `❌ Validation error: Deck ID ${input.deckId} is not configured.\n\n**Please call get-deck-mappings first** to see available deck IDs.`;
  }

  // Build fields object based on note type
  const fields: Record<string, string> = {};

  if (input.noteType === "Cloze") {
    fields.Text = input.Text!; // Safe because validated above
    if (input.Extra) fields.Extra = input.Extra;
  } else {
    fields.Front = input.Front!; // Safe because validated above
    fields.Back = input.Back!; // Safe because validated above
    if (input.Extra) fields.Extra = input.Extra;
  }

  // Parse tags
  const tags = input.tags ? input.tags.split(",").map((t) => t.trim()) : [];

  // Check for duplicates
  const searchFieldValue = input.noteType === "Cloze" ? input.Text : input.Front;
  if (searchFieldValue) {
    try {
      const duplicateIds = await findNotes(`deck:"${deckMapping.deckName}" ${searchFieldValue}`);
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
  }

  // Create the card
  try {
    const noteId = await addNote({
      deckName: deckMapping.deckName,
      modelName: input.noteType,
      fields,
      tags,
    });

    const fieldsText = Object.entries(fields)
      .map(([key, value]) => `  ${key}: ${value}`)
      .join("\n");

    return `✅ Card created successfully!\n\nDeck: ${deckMapping.deckName}\nNote Type: ${input.noteType}\nNote ID: ${noteId}\n\nFields:\n${fieldsText}${tags.length > 0 ? `\n\nTags: ${tags.join(", ")}` : ""}`;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return `❌ Failed to create card: ${errorMessage}\n\nPlease check:\n1. The note type "${input.noteType}" exists in Anki\n2. All required fields are provided\n3. The deck "${deckMapping.deckName}" exists`;
  }
}

/**
 * Confirmation prompt before creating the card
 */
export const confirmation: Tool.Confirmation<Input> = async (input) => {
  // Get deck name for display
  const mappings = await getDeckMappings();
  const deckMapping = mappings.find((m) => m.deckId === input.deckId);
  const deckName = deckMapping ? deckMapping.deckName : `Deck ID ${input.deckId}`;

  const fields: Record<string, string> = {};

  if (input.noteType === "Cloze") {
    if (input.Text) fields.Text = input.Text;
    if (input.Extra) fields.Extra = input.Extra;
  } else {
    if (input.Front) fields.Front = input.Front;
    if (input.Back) fields.Back = input.Back;
    if (input.Extra) fields.Extra = input.Extra;
  }

  const tags = input.tags ? input.tags.split(",").map((t) => t.trim()) : [];

  // Build info array with structured data
  const info: Array<{ name: string; value?: string }> = [
    { name: "Deck", value: deckName },
    { name: "Note Type", value: input.noteType },
  ];

  // Add fields to info
  Object.entries(fields).forEach(([key, value]) => {
    info.push({ name: key, value });
  });

  // Add tags if present
  if (tags.length > 0) {
    info.push({ name: "Tags", value: tags.join(", ") });
  }

  return {
    message: "Create this card in Anki?",
    info,
  };
};
