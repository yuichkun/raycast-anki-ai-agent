import { getDeckConfigurations } from "../storage";

/**
 * Get all configured deck settings including note types, card templates, and examples.
 * MUST be called before add-card to retrieve the deck ID and understand card format requirements.
 */
export default async function tool(): Promise<string> {
  const configurations = await getDeckConfigurations();

  if (configurations.length === 0) {
    return JSON.stringify(
      {
        error:
          "No deck configurations found. Please ask the user to run the 'Configure Anki Decks' command to set up their decks first.",
      },
      null,
      2,
    );
  }

  // Return structured JSON with all deck configurations
  const result = {
    decks: configurations.map((configuration) => ({
      deckId: configuration.deckId,
      deckName: configuration.deckName,
      purpose: configuration.purpose,
      noteType: configuration.noteType,
      frontTemplate: configuration.frontTemplate,
      frontExample: configuration.frontExample,
      backTemplate: configuration.backTemplate,
      backExample: configuration.backExample,
    })),
    instructions:
      "Select the appropriate deck ID based on the user's content and the deck's purpose. Use the templates and examples as guidelines for formatting card fields.",
  };

  return JSON.stringify(result, null, 2);
}
