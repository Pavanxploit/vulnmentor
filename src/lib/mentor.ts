const prompts = [
  "Which server-side decision is this lab testing? Write the expected rule in one sentence.",
  "Compare the expected rule with the evidence you collected. Which field or event records the decision?",
  "Look at the secure implementation. Which check enforces the rule, and what would you record to verify it?",
];
export async function mentorNudge(
  lab: string,
  attempts: number,
  hintLevel: number,
) {
  const level = Math.min(2, Math.max(hintLevel, Math.floor(attempts / 3)));
  const key = process.env.OPENAI_API_KEY;
  if (key && level > 0) {
    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          authorization: "Bearer " + key,
          "content-type": "application/json",
        },
        signal: AbortSignal.timeout(5000),
        body: JSON.stringify({
          model: process.env.VULNMENTOR_MENTOR_MODEL || "gpt-4.1-mini",
          store: false,
          max_output_tokens: 32,
          instructions:
            "Choose one coaching prompt for this learner. Return only its integer index.",
          input: JSON.stringify({
            lab,
            attempts,
            hintLevel,
            choices: prompts.slice(0, level + 1),
          }),
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const answer = data.output
          ?.flatMap(
            (part: { content?: { text?: string }[] }) => part.content || [],
          )
          .find((part: { text?: string }) => typeof part.text === "string")
          ?.text?.trim();
        if (/^[0-2]$/.test(answer || "") && Number(answer) <= level)
          return prompts[Number(answer)];
      }
    } catch {
      /* Offline guidance stays available during provider outages. */
    }
  }
  return prompts[level];
}
