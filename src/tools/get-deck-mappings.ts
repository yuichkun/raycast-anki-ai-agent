import { getDeckMappings } from "../storage";

/**
 * Get all configured deck mappings to help select the appropriate deck for card creation
 */
export default async function tool(): Promise<string> {
  const mappings = await getDeckMappings();

  if (mappings.length === 0) {
    return "No deck mappings configured.\n\nPlease ask the user to run the 'Configure Anki Decks' command to set up their decks first.";
  }

  // Return formatted list of decks with IDs, names, and purposes
  const deckList = mappings
    .map((mapping) => {
      return `- **ID: ${mapping.deckId}**\n  Name: ${mapping.deckName}\n  Purpose: ${mapping.purpose}`;
    })
    .join("\n\n");

  return `Available decks:\n\n${deckList}\n\nUse the deck ID when calling add-card.`;
}
