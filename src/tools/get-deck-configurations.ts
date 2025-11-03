import { getDeckMappings } from "../storage";

/**
 * Get all configured deck settings including note types, card templates, and examples.
 * MUST be called before add-card to retrieve the deck ID and understand card format requirements.
 */
export default async function tool(): Promise<string> {
  const mappings = await getDeckMappings();

  if (mappings.length === 0) {
    return "No deck configurations found.\n\nPlease ask the user to run the 'Configure Anki Decks' command to set up their decks first.";
  }

  // Return formatted list of decks with complete configuration
  const deckList = mappings
    .map((mapping) => {
      return `### Deck ID: ${mapping.deckId}
**Name:** ${mapping.deckName}
**Purpose:** ${mapping.purpose}
**Note Type:** ${mapping.noteType}

**Front Template:** ${mapping.frontTemplate}
**Front Example:** ${mapping.frontExample}

**Back Template:** ${mapping.backTemplate}
**Back Example:** ${mapping.backExample}`;
    })
    .join("\n\n---\n\n");

  return `Available deck configurations:\n\n${deckList}\n\n**Instructions:** Select the appropriate deck ID based on the user's content and the deck's purpose. Use the templates and examples as guidelines for formatting card fields.`;
}
