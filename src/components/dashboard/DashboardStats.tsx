import {
  ImageIcon,
  MessageSquare,
  Users,
  Zap,
} from "lucide-react";

export interface DashboardStatsData {
  mentorsCount: number;
  memoriesCount: number;
  postsCount: number;
  totalXp: number;
}

interface DashboardStatsProps {
  stats: DashboardStatsData;
}

const STAT_ITEMS = [
  { key: "mentorsCount", label: "Mentors", icon: Users },
  { key: "memoriesCount", label: "Photos", icon: ImageIcon },
  { key: "postsCount", label: "Discussions", icon: MessageSquare },
  { key: "totalXp", label: "XP Total", icon: Zap },
] as const;

function formatXp(xp: number) {
  return xp > 1000 ? `${(xp / 1000).toFixed(1)}k` : xp;
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="bg-surface rounded-2xl p-gutter card-shadow xl:col-span-1 grid grid-cols-2 gap-4 border border-outline-variant/30">
      {STAT_ITEMS.map(({ key, label, icon: Icon }) => (
        <div
          key={key}
          className="bg-surface-container-low rounded-xl p-4 flex flex-col items-center justify-center text-center"
        >
          <Icon className="w-7 h-7 text-primary mb-2" />
          <span className="font-headline text-2xl font-bold text-on-surface">
            {key === "totalXp" ? formatXp(stats[key]) : stats[key]}
          </span>
          <span className="font-mono text-xs text-on-surface-variant">{label}</span>
        </div>
      ))}
    </div>
  );
}
