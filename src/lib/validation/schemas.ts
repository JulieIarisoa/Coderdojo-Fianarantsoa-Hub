import { z } from "zod";

const reactionsSchema = z.record(z.string(), z.array(z.string()));

export const profileUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    email: z.string().email().optional(),
    avatar: z.string().min(1).max(2000).optional(),
    bio: z.string().max(1000).optional(),
    skills: z.array(z.string().max(60)).max(30).optional(),
    role: z.enum(["USER", "MENTOR", "ADMIN"]).optional(),
    status: z.enum(["APPROVED", "PENDING", "REJECTED"]).optional(),
    workshopsCount: z.number().int().min(0).optional(),
    projectsCount: z.number().int().min(0).optional(),
    studentsCount: z.number().int().min(0).optional(),
    memoriesCount: z.number().int().min(0).optional(),
    xp: z.number().int().min(0).optional(),
    level: z.number().int().min(1).optional(),
    updatedAt: z.unknown().optional(),
  })
  .strict();

export const campfirePostSchema = z.object({
  authorId: z.string().min(1),
  authorName: z.string().trim().min(1).max(100),
  authorAvatar: z.string().min(1).max(2000),
  authorRole: z.string().max(50).optional(),
  content: z.string().trim().min(1).max(5000),
  category: z.enum(["idea", "fun", "teaching", "project"]),
  reactions: reactionsSchema,
  likesCount: z.number().int().min(0),
  commentsCount: z.number().int().min(0),
  linkPreview: z
    .object({
      title: z.string().max(200),
      description: z.string().max(500),
      url: z.string().url(),
    })
    .optional(),
});

export const memorySchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().max(5000),
  imageUrl: z.string().min(1).max(5000),
  images: z.array(z.string().min(1).max(5000)).optional(),
  cloudinaryId: z.string().max(300).optional(),
  authorId: z.string().min(1),
  authorName: z.string().trim().min(1).max(100),
  authorAvatar: z.string().min(1).max(2000),
  authorRole: z.string().max(50).optional(),
  eventDate: z.string().max(40),
  likesCount: z.number().int().min(0),
  commentsCount: z.number().int().min(0),
  reactions: reactionsSchema,
});

export const directMessageSchema = z.object({
  fromId: z.string().min(1),
  fromName: z.string().trim().min(1).max(100),
  fromAvatar: z.string().min(1).max(2000),
  toId: z.string().min(1),
  toName: z.string().trim().min(1).max(100),
  content: z.string().trim().min(1).max(2000),
});
