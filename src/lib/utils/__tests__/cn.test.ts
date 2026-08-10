import { describe, it, expect } from "vitest";
import { cn } from "../cn";

describe("cn utility", () => {
  it("merges multiple string class names", () => {
    expect(cn("px-2", "py-4", "text-red-500")).toBe("px-2 py-4 text-red-500");
  });

  it("handles conditional class names", () => {
    const isTrue = true;
    const isFalse = false;
    expect(cn("base", isTrue && "active", isFalse && "disabled")).toBe("base active");
  });

  it("properly resolves conflicting Tailwind CSS classes", () => {
    expect(cn("px-2 px-4", "bg-red-500 bg-blue-500")).toBe("px-4 bg-blue-500");
  });

  it("handles array and object inputs from clsx", () => {
    expect(cn(["flex", "items-center"], { "justify-between": true, "hidden": false })).toBe(
      "flex items-center justify-between"
    );
  });

  it("handles undefined, null, and empty inputs gracefully", () => {
    expect(cn("text-sm", undefined, null, "", false)).toBe("text-sm");
  });
});
