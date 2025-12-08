/**
 * Utility for auto-launching Anki when not running
 * Supports macOS and Windows
 */

import { showToast, Toast } from "@raycast/api";
import { exec } from "child_process";
import { promisify } from "util";
import { checkAnkiConnection } from "./ankiConnect";

const execAsync = promisify(exec);

const LAUNCH_TIMEOUT_MS = 30000; // 30 seconds
const POLL_INTERVAL_MS = 1000; // 1 second

export interface LaunchResult {
  success: boolean;
  error?: string;
}

/**
 * Get platform-specific command to launch Anki
 */
function getAnkiLaunchCommand(): string {
  const platform = process.platform;

  if (platform === "darwin") {
    return "open -a Anki";
  } else if (platform === "win32") {
    // Use PowerShell for reliable Windows execution
    return 'powershell -Command "Start-Process \\"$env:LocalAppData\\Programs\\Anki\\anki.exe\\""';
  }

  throw new Error(`Unsupported platform: ${platform}`);
}

/**
 * Launch Anki application
 */
async function launchAnki(): Promise<void> {
  const command = getAnkiLaunchCommand();
  await execAsync(command);
}

/**
 * Wait for AnkiConnect to become available
 */
async function waitForAnkiConnect(
  timeoutMs: number = LAUNCH_TIMEOUT_MS,
  intervalMs: number = POLL_INTERVAL_MS,
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const connected = await checkAnkiConnection();
    if (connected) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return false;
}

/**
 * Ensure Anki is running and AnkiConnect is available.
 * Launches Anki if not running and waits for connection.
 */
export async function ensureAnkiRunning(): Promise<LaunchResult> {
  // Check if already connected
  const alreadyConnected = await checkAnkiConnection();
  if (alreadyConnected) {
    return { success: true };
  }

  // Show animated toast while launching
  const toast = await showToast({
    style: Toast.Style.Animated,
    title: "Starting Anki...",
    message: "Waiting for AnkiConnect",
  });

  try {
    // Launch Anki
    await launchAnki();

    // Wait for AnkiConnect to become available
    const connected = await waitForAnkiConnect();

    if (connected) {
      toast.style = Toast.Style.Success;
      toast.title = "Anki Connected";
      toast.message = undefined;
      return { success: true };
    } else {
      toast.style = Toast.Style.Failure;
      toast.title = "Connection Timeout";
      toast.message = "AnkiConnect did not respond";
      return {
        success: false,
        error:
          "Anki started but AnkiConnect did not respond. Please ensure the AnkiConnect plugin is installed (code: 2055492159).",
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    toast.style = Toast.Style.Failure;
    toast.title = "Failed to Start Anki";
    toast.message = errorMessage;

    // Platform-specific error guidance
    const platform = process.platform;
    let guidance = "";
    if (platform === "darwin") {
      guidance = "Please ensure Anki is installed in /Applications.";
    } else if (platform === "win32") {
      guidance = "Please ensure Anki is installed at the default location.";
    }

    return {
      success: false,
      error: `Failed to launch Anki: ${errorMessage}. ${guidance}`,
    };
  }
}
