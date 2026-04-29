const LINE_API = "https://api.line.me/v2/bot/message";

function headers() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
  };
}

function recipientIds(): string[] {
  return (process.env.LINE_PARENT_USER_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
}

export async function sendToParents(messages: object[]) {
  const to = recipientIds();
  if (to.length === 0) {
    console.warn("LINE_PARENT_USER_IDS が未設定です");
    return;
  }

  const endpoint = to.length === 1 ? `${LINE_API}/push` : `${LINE_API}/multicast`;
  const body = to.length === 1
    ? { to: to[0], messages }
    : { to, messages };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LINE API error: ${res.status} ${err}`);
  }
}

export function textMessage(text: string) {
  return { type: "text", text };
}

export function flexMessage(altText: string, contents: object) {
  return { type: "flex", altText, contents };
}
