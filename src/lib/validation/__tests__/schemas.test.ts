import { describe, it, expect } from "vitest";
import {
  profileUpdateSchema,
  campfirePostSchema,
  memorySchema,
  directMessageSchema,
} from "../schemas";

describe("Zod Validation Schemas", () => {
  describe("profileUpdateSchema", () => {
    it("validates a correct partial profile update", () => {
      const validData = {
        name: "  Fanilo Razafindrakoto  ",
        email: "fanilo@coderdojo.mg",
        bio: "Mentor chez CoderDojo Fianarantsoa",
        skills: ["TypeScript", "Next.js", "Python"],
        role: "MENTOR" as const,
        status: "APPROVED" as const,
        level: 3,
        xp: 450,
      };

      const result = profileUpdateSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Fanilo Razafindrakoto");
      }
    });

    it("fails when email is invalid", () => {
      const invalidData = {
        email: "invalid-email-format",
      };
      const result = profileUpdateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("fails when unexpected extra properties are present (strict mode)", () => {
      const invalidData = {
        name: "Fanilo",
        unknownProperty: "not allowed",
      };
      const result = profileUpdateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("fails when role is not a valid enum value", () => {
      const invalidData = {
        role: "SUPERADMIN",
      };
      const result = profileUpdateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("campfirePostSchema", () => {
    it("validates a correct campfire post", () => {
      const validPost = {
        authorId: "user_123",
        authorName: "  Aina  ",
        authorAvatar: "https://example.com/avatar.png",
        authorRole: "Mentor",
        content: "Bienvenue à l'atelier Scratch ce samedi !",
        category: "teaching" as const,
        reactions: {
          "🔥": ["user_123", "user_456"],
        },
        likesCount: 5,
        commentsCount: 2,
        linkPreview: {
          title: "Scratch Project",
          description: "Mon super projet de jeu",
          url: "https://scratch.mit.edu",
        },
      };

      const result = campfirePostSchema.safeParse(validPost);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.authorName).toBe("Aina");
      }
    });

    it("fails when content is empty or category is invalid", () => {
      const invalidPost = {
        authorId: "user_123",
        authorName: "Aina",
        authorAvatar: "https://example.com/avatar.png",
        content: "",
        category: "invalid_category",
        reactions: {},
        likesCount: 0,
        commentsCount: 0,
      };

      const result = campfirePostSchema.safeParse(invalidPost);
      expect(result.success).toBe(false);
    });
  });

  describe("memorySchema", () => {
    it("validates a correct memory post", () => {
      const validMemory = {
        title: "  CoderDojo Hackathon 2026  ",
        description: "Une journée inoubliable de codage et de partage.",
        imageUrl: "https://example.com/photo.jpg",
        images: ["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"],
        cloudinaryId: "memories/hackathon2026",
        authorId: "user_789",
        authorName: "Soa",
        authorAvatar: "https://example.com/soa.png",
        eventDate: "2026-08-10",
        likesCount: 12,
        commentsCount: 3,
        reactions: { "❤️": ["user_123"] },
      };

      const result = memorySchema.safeParse(validMemory);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("CoderDojo Hackathon 2026");
      }
    });

    it("fails when title is too long", () => {
      const invalidMemory = {
        title: "A".repeat(161), // Max is 160
        description: "Description",
        imageUrl: "https://example.com/photo.jpg",
        authorId: "user_789",
        authorName: "Soa",
        authorAvatar: "https://example.com/soa.png",
        eventDate: "2026-08-10",
        likesCount: 0,
        commentsCount: 0,
        reactions: {},
      };

      const result = memorySchema.safeParse(invalidMemory);
      expect(result.success).toBe(false);
    });
  });

  describe("directMessageSchema", () => {
    it("validates a valid direct message", () => {
      const validMessage = {
        fromId: "user_1",
        fromName: "  Rakoto  ",
        fromAvatar: "https://example.com/rakoto.png",
        toId: "user_2",
        toName: "Rabe",
        content: "Salut Rabe, tu viens à la session ?",
      };

      const result = directMessageSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fromName).toBe("Rakoto");
      }
    });

    it("fails when content is empty or exceeding length", () => {
      const invalidMessage = {
        fromId: "user_1",
        fromName: "Rakoto",
        fromAvatar: "https://example.com/rakoto.png",
        toId: "user_2",
        toName: "Rabe",
        content: "   ", // Trims to empty string -> min(1) fails
      };

      const result = directMessageSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
    });
  });
});
