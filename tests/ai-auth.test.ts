import { pythonFoundations } from "../content/python-foundations";
import { fallbackFeedback } from "../lib/ai/fallback";
import { validateModelFeedback } from "../lib/ai/validate";
import { authEmailRedirect } from "../lib/auth/redirects";
import { originAllowed, safeNextPath } from "../lib/auth/safe-next";
import { DEMO_STORAGE_KEY, GUEST_STORAGE_KEY } from "../lib/domain/ids";
import { parseModelFeedback } from "../lib/domain/schema";
import { describe, expect, it } from "vitest";

describe("model feedback validation", () => {
  const task = pythonFoundations.tasks["v-base"];
  const answer = "price * count 로 3600을 구했습니다";

  it("falls back on unknown criterionId", () => {
    const parsed = parseModelFeedback({
      summary: "요약",
      strengths: [],
      issues: [{ criterionId: "not-real", observation: "x", evidenceQuote: "" }],
      nextHint: "힌트",
      suggestedSupport: "none",
      limitations: [],
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(validateModelFeedback(parsed.data, answer, task.rubric).ok).toBe(false);
  });

  it("falls back when quote is not in the answer", () => {
    const parsed = parseModelFeedback({
      summary: "요약",
      strengths: [],
      issues: [{ criterionId: task.rubric[0].id, observation: "x", evidenceQuote: "없는인용" }],
      nextHint: "힌트",
      suggestedSupport: "none",
      limitations: [],
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(validateModelFeedback(parsed.data, answer, task.rubric).ok).toBe(false);
  });

  it("does not let a model source become live without server assignment", () => {
    const feedback = fallbackFeedback({
      id: "fb1",
      sessionId: "s1",
      answerHash: "abc",
      createdAt: "2026-09-01T00:00:00.000Z",
      task,
    });
    expect(feedback.source).toBe("fallback");
    expect(feedback.source).not.toBe("live");
  });
});

describe("auth helpers", () => {
  it("rejects external next URLs", () => {
    expect(safeNextPath("https://evil.example")).toBe("/learn");
    expect(safeNextPath("//evil.example")).toBe("/learn");
    expect(safeNextPath("/reset-password")).toBe("/reset-password");
  });

  it("builds a same-origin auth callback", () => {
    expect(authEmailRedirect("https://example.netlify.app", "/learn")).toBe(
      "https://example.netlify.app/auth/callback?next=%2Flearn",
    );
    expect(authEmailRedirect("https://example.netlify.app/", "https://evil.example")).toBe(
      "https://example.netlify.app/auth/callback?next=%2Flearn",
    );
  });

  it("checks origin against APP_URL", () => {
    process.env.APP_URL = "http://localhost:3000";
    const ok = new Request("http://localhost:3000/api/feedback", { headers: { origin: "http://localhost:3000" } });
    const loopback = new Request("http://localhost:3000/api/feedback", { headers: { origin: "http://127.0.0.1:3000" } });
    const bad = new Request("http://localhost:3000/api/feedback", { headers: { origin: "https://evil.example" } });
    expect(originAllowed(ok)).toBe(true);
    expect(originAllowed(loopback)).toBe(true);
    expect(originAllowed(bad)).toBe(false);
  });
});

describe("storage keys", () => {
  it("keeps demo and guest keys separate", () => {
    expect(DEMO_STORAGE_KEY).not.toBe(GUEST_STORAGE_KEY);
  });
});
