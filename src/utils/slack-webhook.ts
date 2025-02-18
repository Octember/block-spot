import fetch from "node-fetch";

const SLACK_WEBHOOK_URL =
  "https://hooks.slack.com/services/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";

export async function sendSlackMessage(text: string): Promise<void> {
  try {
    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send Slack message: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error sending Slack message:", error);
  }
}
