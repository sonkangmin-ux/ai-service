import { pythonFoundations } from "../content/python-foundations";
import { createDemoState } from "../lib/demo/seed";
import { createEmptyState } from "../lib/domain/empty";
import { describe, expect, it } from "vitest";

describe("demo isolation", () => {
  it("does not share the demo seed with an empty user state", () => {
    const demo = createDemoState();
    const user = createEmptyState();
    expect(demo.activeSession?.taskId).toBe("l-base");
    expect(user.activeSession).toBeUndefined();
    expect(demo.progress.find((item) => item.skillId === "v")?.status).toBe("verified");
    expect(user.progress).toEqual([]);
    expect(pythonFoundations.tasks["l-base"]).toBeTruthy();
  });
});
