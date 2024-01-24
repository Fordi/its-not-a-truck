import { nextBestMove } from "./NextBestMove.mjs";

addEventListener("message", async ({ data: [requestId, ...args] }) => {
  const [state] = args;
  try {
    const result = await nextBestMove(state);
    postMessage([requestId, result]);
  } catch (error) {
    postMessage([requestId, null, error]);
  }
});
