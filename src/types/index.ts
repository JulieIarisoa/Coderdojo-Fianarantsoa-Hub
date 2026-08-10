export type UserRole = 'USER' | 'MENTOR' | 'ADMIN';
export type UserStatus = 'APPROVED' | 'PENDING' | 'REJECTED';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  skills: string[];
  role: UserRole;
  status?: UserStatus;
  xp: number;
  level: number;
  badges: string[];
  workshopsCount?: number;
  projectsCount?: number;
  studentsCount?: number;
  memoriesCount?: number;
  createdAt: unknown;
}

export type CampfireCategory = 'idea' | 'fun' | 'teaching' | 'project';

export interface CampfirePost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRole?: string;
  content: string;
  category: CampfireCategory;
  reactions: Record<string, string[]>; // emoji -> array of userIds
  likesCount: number;
  commentsCount: number;
  linkPreview?: {
    title: string;
    description: string;
    url: string;
  };
  createdAt: unknown;
}

export interface PostComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: unknown;
}

export interface MemoryItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  images?: string[];
  cloudinaryId?: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRole?: string;
  eventDate: string;
  likesCount: number;
  commentsCount: number;
  reactions: Record<string, string[]>;
  createdAt: unknown;
}

export interface SecretFriendCampaign {
  id: string;
  title: string;
  season: string;
  instruction?: string;
  status: 'draft' | 'active' | 'completed';
  revealDaysLeft: number;
  createdAt: unknown;
}

export interface SecretFriendAssignment {
  id: string;
  campaignId: string;
  mentorId: string; // The person who receives the secret target
  secretFriendId: string; // The assigned secret target
  secretFriendName: string;
  secretFriendAvatar: string;
  missionTitle: string;
  missionDescription: string;
  completed: boolean;
  actionJournal: {
    id: string;
    actionText: string;
    timeAgo: string;
    icon: string;
  }[];
}

export interface SecretFriendMessage {
  id: string;
  campaignId: string;
  assignmentId: string;
  senderId: string;
  recipientId: string;
  text: string;
  imageUrl?: string;
  replyToId?: string;
  read: boolean;
  createdAt: unknown;
}

export interface GuessWhoGame {
  id: string;
  clue: string;
  targetMentorId: string;
  targetMentorName: string;
  options: {
    id: string;
    name: string;
    avatar: string;
  }[];
  active: boolean;
  createdAt: unknown;
}

export interface DetectiveScore {
  userId: string;
  name: string;
  xp: number;
  rank: number;
}

export interface BadgeItem {
  id: string;
  name: string;
  description: string;
  icon: string; // Material symbol name or emoji
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

export interface MilestoneItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpAwarded: number;
  completed: boolean;
  completedDate?: string;
  progress?: number;
  maxProgress?: number;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: 'comment' | 'reaction' | 'memory' | 'badge' | 'secret-friend';
  message: string;
  read: boolean;
  link?: string;
  createdAt: unknown;
}
