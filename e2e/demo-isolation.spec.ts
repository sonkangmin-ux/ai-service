import { expect, test } from "@playwright/test";
import { createEmptyState } from "../lib/domain/empty";
import { GOAL_ID } from "../lib/domain/ids";
import { exportLearningJson } from "../lib/domain/import";

const guestState = exportLearningJson({
  ...createEmptyState(),
  profile: {
    displayName: "기존사용자",
    goalId: GOAL_ID,
    experience: "first",
    sessionMinutes: 15,
    createdAt: "2026-09-01T00:00:00.000Z",
  },
});

test("demo reset does not change existing guest data", async ({ page }) => {
  await page.addInitScript((payload) => {
    localStorage.setItem("learning-compass:guest:v1", payload as string);
    localStorage.setItem("learning-compass:mode", "guest");
  }, guestState);
  await page.goto("/learn");
  await expect(page.getByText("기존사용자")).toBeVisible();
  const before = await page.evaluate(() => localStorage.getItem("learning-compass:guest:v1"));
  await page.goto("/demo");
  await expect(page.getByText("예시 학습 기록으로 체험 중")).toBeVisible();
  await page.goto("/demo/settings");
  await page.getByRole("button", { name: "데모 초기화" }).click();
  await page.goto("/learn");
  const after = await page.evaluate(() => localStorage.getItem("learning-compass:guest:v1"));
  expect(after).toBe(before);
  await expect(page.getByText("기존사용자")).toBeVisible();
});
