import { describe, it, expect } from "vitest";
import { DEFAULT_REACTION_EMOJIS, ReactionPicker } from "../ReactionPicker";

describe("ReactionPicker", () => {
  it("exports default reaction emojis array with standard options", () => {
    expect(DEFAULT_REACTION_EMOJIS).toBeDefined();
    expect(Array.isArray(DEFAULT_REACTION_EMOJIS)).toBe(true);
    expect(DEFAULT_REACTION_EMOJIS).toContain("❤️");
    expect(DEFAULT_REACTION_EMOJIS).toContain("🎉");
    expect(DEFAULT_REACTION_EMOJIS).toContain("🚀");
    expect(DEFAULT_REACTION_EMOJIS).toContain("💡");
    expect(DEFAULT_REACTION_EMOJIS).toContain("🔥");
    expect(DEFAULT_REACTION_EMOJIS).toContain("👏");
  });

  it("exports ReactionPicker component function", () => {
    expect(typeof ReactionPicker).toBe("function");
  });
});
