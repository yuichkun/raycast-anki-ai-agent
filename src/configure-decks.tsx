import {
  Action,
  ActionPanel,
  Alert,
  confirmAlert,
  Form,
  Icon,
  List,
  showToast,
  Toast,
  useNavigation,
} from "@raycast/api";
import { useEffect, useState } from "react";
import { checkAnkiConnection, getDecks, DeckInfo } from "./ankiConnect";
import { getDeckConfigurations, addDeckConfiguration, removeDeckConfiguration, DeckConfiguration } from "./storage";

export default function ConfigureDecks() {
  const [configurations, setConfigurations] = useState<DeckConfiguration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ankiConnected, setAnkiConnected] = useState(false);

  useEffect(() => {
    loadConfigurations();
  }, []);

  async function loadConfigurations() {
    try {
      setIsLoading(true);

      // Check Anki connection
      const connected = await checkAnkiConnection();
      setAnkiConnected(connected);

      // Load deck configurations
      const storedConfigurations = await getDeckConfigurations();
      setConfigurations(storedConfigurations);
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to load deck configurations",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRemoveConfiguration(deckId: number) {
    const confirmed = await confirmAlert({
      title: "Remove Deck Configuration",
      message: "Are you sure you want to remove this deck configuration?",
      primaryAction: {
        title: "Remove",
        style: Alert.ActionStyle.Destructive,
      },
    });

    if (confirmed) {
      try {
        await removeDeckConfiguration(deckId);
        await showToast({
          style: Toast.Style.Success,
          title: "Deck configuration removed",
        });
        await loadConfigurations();
      } catch (error) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Failed to remove deck configuration",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  }

  if (!ankiConnected) {
    return (
      <List>
        <List.EmptyView
          icon={Icon.Warning}
          title="Cannot connect to Anki"
          description="Make sure Anki is running and AnkiConnect plugin is installed (code: 2055492159)"
        />
      </List>
    );
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search deck configurations...">
      <List.EmptyView
        icon={Icon.Document}
        title="No Deck Configurations"
        description="Add a deck configuration to get started"
        actions={
          <ActionPanel>
            <Action.Push
              title="Add Deck Configuration"
              icon={Icon.Plus}
              target={<AddDeckConfigurationForm onConfigurationAdded={loadConfigurations} />}
            />
          </ActionPanel>
        }
      />

      {configurations.map((configuration) => (
        <List.Item
          key={configuration.deckId}
          title={configuration.deckName}
          subtitle={configuration.purpose}
          icon={Icon.Book}
          accessories={[{ text: `ID: ${configuration.deckId}` }]}
          actions={
            <ActionPanel>
              <Action.Push
                title="Edit Configuration"
                icon={Icon.Pencil}
                target={
                  <EditDeckConfigurationForm
                    configuration={configuration}
                    onConfigurationUpdated={loadConfigurations}
                  />
                }
              />
              <Action.Push
                title="Add Deck Configuration"
                icon={Icon.Plus}
                target={<AddDeckConfigurationForm onConfigurationAdded={loadConfigurations} />}
              />
              <Action
                title="Remove Deck Configuration"
                icon={Icon.Trash}
                style={Action.Style.Destructive}
                onAction={() => handleRemoveConfiguration(configuration.deckId)}
                shortcut={{ modifiers: ["cmd"], key: "backspace" }}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

interface AddDeckConfigurationFormProps {
  onConfigurationAdded: () => Promise<void>;
}

function AddDeckConfigurationForm({ onConfigurationAdded }: AddDeckConfigurationFormProps) {
  const { pop } = useNavigation();
  const [decks, setDecks] = useState<DeckInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [existingConfigurations, setExistingConfigurations] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadDecks();
  }, []);

  async function loadDecks() {
    try {
      setIsLoading(true);

      // Load available decks from Anki
      const availableDecks = await getDecks();
      setDecks(availableDecks);

      // Load existing configurations to filter them out
      const configurations = await getDeckConfigurations();
      setExistingConfigurations(new Set(configurations.map((c) => c.deckId)));
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to load decks",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(values: {
    deckId: string;
    purpose: string;
    noteType: string;
    frontTemplate: string;
    backTemplate: string;
    frontExample: string;
    backExample: string;
  }) {
    if (
      !values.deckId ||
      !values.purpose.trim() ||
      !values.noteType ||
      !values.frontTemplate.trim() ||
      !values.backTemplate.trim() ||
      !values.frontExample.trim() ||
      !values.backExample.trim()
    ) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Invalid input",
        message: "Please fill in all required fields",
      });
      return;
    }

    const deckId = parseInt(values.deckId, 10);
    const deck = decks.find((d) => d.id === deckId);

    if (!deck) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Deck not found",
      });
      return;
    }

    try {
      await addDeckConfiguration({
        deckId: deck.id,
        deckName: deck.name,
        purpose: values.purpose.trim(),
        noteType: values.noteType as "Basic" | "Basic (and reversed card)",
        frontTemplate: values.frontTemplate.trim(),
        backTemplate: values.backTemplate.trim(),
        frontExample: values.frontExample.trim(),
        backExample: values.backExample.trim(),
      });

      await showToast({
        style: Toast.Style.Success,
        title: "Deck configuration added",
      });

      pop();
      await onConfigurationAdded();
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to add deck configuration",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Filter out decks that already have configurations
  const availableDecks = decks.filter((deck) => !existingConfigurations.has(deck.id));

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Add Configuration" icon={Icon.Plus} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Dropdown id="deckId" title="Deck" placeholder="Select a deck">
        {availableDecks.length === 0 ? (
          <Form.Dropdown.Item value="" title="No available decks (all are already configured)" />
        ) : (
          availableDecks.map((deck) => (
            <Form.Dropdown.Item key={deck.id} value={deck.id.toString()} title={deck.name} />
          ))
        )}
      </Form.Dropdown>

      <Form.TextField
        id="purpose"
        title="Purpose"
        placeholder="e.g., for Japanese vocabulary"
        info="Describe what this deck is for to help AI select the right deck"
      />

      <Form.Dropdown id="noteType" title="Note Type" info="Card type to use for this deck">
        <Form.Dropdown.Item value="Basic" title="Basic" />
        <Form.Dropdown.Item value="Basic (and reversed card)" title="Basic (and reversed card)" />
      </Form.Dropdown>

      <Form.TextArea
        id="frontTemplate"
        title="Front Template"
        placeholder="e.g., Japanese word in hiragana with romaji in parentheses"
        info="Describe how the front of the card should be formatted"
      />

      <Form.TextArea
        id="backTemplate"
        title="Back Template"
        placeholder="e.g., English translation with example sentence"
        info="Describe how the back of the card should be formatted"
      />

      <Form.TextArea
        id="frontExample"
        title="Front Example"
        placeholder="e.g., 食べる (taberu)"
        info="Show an example of a front card"
      />

      <Form.TextArea
        id="backExample"
        title="Back Example"
        placeholder="e.g., to eat - Example: 私は朝ごはんを食べます"
        info="Show an example of a back card"
      />
    </Form>
  );
}

interface EditDeckConfigurationFormProps {
  configuration: DeckConfiguration;
  onConfigurationUpdated: () => Promise<void>;
}

function EditDeckConfigurationForm({ configuration, onConfigurationUpdated }: EditDeckConfigurationFormProps) {
  const { pop } = useNavigation();
  const [decks, setDecks] = useState<DeckInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [existingConfigurations, setExistingConfigurations] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadDecks();
  }, []);

  async function loadDecks() {
    try {
      setIsLoading(true);

      const availableDecks = await getDecks();
      setDecks(availableDecks);

      const configurations = await getDeckConfigurations();
      // Exclude current deck from the "already configured" set so it appears in the dropdown
      setExistingConfigurations(
        new Set(configurations.filter((c) => c.deckId !== configuration.deckId).map((c) => c.deckId)),
      );
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to load decks",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(values: {
    deckId: string;
    purpose: string;
    noteType: string;
    frontTemplate: string;
    backTemplate: string;
    frontExample: string;
    backExample: string;
  }) {
    if (
      !values.deckId ||
      !values.purpose.trim() ||
      !values.noteType ||
      !values.frontTemplate.trim() ||
      !values.backTemplate.trim() ||
      !values.frontExample.trim() ||
      !values.backExample.trim()
    ) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Invalid input",
        message: "Please fill in all required fields",
      });
      return;
    }

    const newDeckId = parseInt(values.deckId, 10);
    const deck = decks.find((d) => d.id === newDeckId);

    if (!deck) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Deck not found",
      });
      return;
    }

    try {
      // If deck changed, remove old configuration first
      if (newDeckId !== configuration.deckId) {
        await removeDeckConfiguration(configuration.deckId);
      }

      await addDeckConfiguration({
        deckId: deck.id,
        deckName: deck.name,
        purpose: values.purpose.trim(),
        noteType: values.noteType as "Basic" | "Basic (and reversed card)",
        frontTemplate: values.frontTemplate.trim(),
        backTemplate: values.backTemplate.trim(),
        frontExample: values.frontExample.trim(),
        backExample: values.backExample.trim(),
      });

      await showToast({
        style: Toast.Style.Success,
        title: "Configuration updated",
      });

      pop();
      await onConfigurationUpdated();
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to update configuration",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  const availableDecks = decks.filter((deck) => !existingConfigurations.has(deck.id));

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Update Configuration" icon={Icon.Check} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Dropdown id="deckId" title="Deck" defaultValue={configuration.deckId.toString()}>
        {availableDecks.map((deck) => (
          <Form.Dropdown.Item key={deck.id} value={deck.id.toString()} title={deck.name} />
        ))}
      </Form.Dropdown>

      <Form.TextField
        id="purpose"
        title="Purpose"
        placeholder="e.g., for Japanese vocabulary"
        defaultValue={configuration.purpose}
        info="Describe what this deck is for to help AI select the right deck"
      />

      <Form.Dropdown
        id="noteType"
        title="Note Type"
        defaultValue={configuration.noteType}
        info="Card type to use for this deck"
      >
        <Form.Dropdown.Item value="Basic" title="Basic" />
        <Form.Dropdown.Item value="Basic (and reversed card)" title="Basic (and reversed card)" />
      </Form.Dropdown>

      <Form.TextArea
        id="frontTemplate"
        title="Front Template"
        placeholder="e.g., Japanese word in hiragana with romaji in parentheses"
        defaultValue={configuration.frontTemplate}
        info="Describe how the front of the card should be formatted"
      />

      <Form.TextArea
        id="backTemplate"
        title="Back Template"
        placeholder="e.g., English translation with example sentence"
        defaultValue={configuration.backTemplate}
        info="Describe how the back of the card should be formatted"
      />

      <Form.TextArea
        id="frontExample"
        title="Front Example"
        placeholder="e.g., 食べる (taberu)"
        defaultValue={configuration.frontExample}
        info="Show an example of a front card"
      />

      <Form.TextArea
        id="backExample"
        title="Back Example"
        placeholder="e.g., to eat - Example: 私は朝ごはんを食べます"
        defaultValue={configuration.backExample}
        info="Show an example of a back card"
      />
    </Form>
  );
}
