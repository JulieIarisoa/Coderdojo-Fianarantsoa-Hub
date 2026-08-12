"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Bell,
  X,
  Award,
  Heart,
  Camera,
  MessageCircle,
  Gift,
  Mail,
  CheckCheck,
} from "lucide-react";
import { NotificationItem } from "@/types";
import { countUnread, notificationTime } from "@/lib/utils/notification";

interface NotificationsModalProps {
  isOpen: boolean;
  notifications: NotificationItem[];
  onClose: () => void;
  onMarkRead: (notificationId: string) => void;
  onMarkAllRead: () => void;
}

const NOTIFICATION_ICONS: Record<NotificationItem["type"], React.ReactNode> = {
  badge: <Award className="w-4 h-4" />,
  comment: <MessageCircle className="w-4 h-4" />,
  reaction: <Heart className="w-4 h-4" />,
  memory: <Camera className="w-4 h-4" />,
  "secret-friend": <Gift className="w-4 h-4" />,
  message: <Mail className="w-4 h-4" />,
};

export function NotificationsModal({
  isOpen,
  notifications,
  onClose,
  onMarkRead,
  onMarkAllRead,
}: NotificationsModalProps) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!isOpen || !mounted) return null;

  const unreadCount = countUnread(notifications);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-outline-variant/40 max-h-[85vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-headline text-lg font-bold text-on-surface flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Notifications
            {unreadCount > 0 && (
              <span className="bg-error text-on-primary font-mono text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </h3>
          <button
            onClick={onClose}
            aria-label="Fermer les notifications"
            className="text-on-surface-variant hover:text-on-surface"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {notifications.length === 0 ? (
          <div className="py-12 text-center text-on-surface-variant font-body text-sm">
            <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>Aucune notification pour l&apos;instant.</p>
            <p className="font-mono text-xs mt-1">
              Vos nouveaux messages et badges apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 flex flex-col gap-2 pr-1">
            {notifications.map((notification) => {
              const isUnread = !notification.read;
              const body = (
                <div
                  className={`w-full flex items-start gap-3 p-3 rounded-xl border transition-colors text-left ${
                    isUnread
                      ? "bg-primary-container/10 border-primary/20"
                      : "bg-surface-container-low border-outline-variant/20"
                  }`}
                >
                  <span
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      isUnread
                        ? "bg-primary/15 text-primary"
                        : "bg-surface-container-high text-on-surface-variant"
                    }`}
                  >
                    {NOTIFICATION_ICONS[notification.type] || (
                      <Bell className="w-4 h-4" />
                    )}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-body text-sm leading-snug ${
                        isUnread
                          ? "font-semibold text-on-surface"
                          : "text-on-surface-variant"
                      }`}
                    >
                      {notification.message}
                    </p>
                    <span className="font-mono text-[10px] text-on-surface-variant">
                      {notificationTime(notification.createdAt)}
                    </span>
                  </div>

                  {isUnread && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onMarkRead(notification.id);
                      }}
                      title="Marquer comme lu"
                      className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );

              return notification.link ? (
                <Link
                  key={notification.id}
                  href={notification.link}
                  onClick={() => {
                    if (isUnread) onMarkRead(notification.id);
                    onClose();
                  }}
                >
                  {body}
                </Link>
              ) : (
                <div
                  key={notification.id}
                  onClick={() => isUnread && onMarkRead(notification.id)}
                >
                  {body}
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-4 border-t border-outline-variant/20 flex justify-between items-center mt-auto">
          {unreadCount > 0 ? (
            <button
              onClick={onMarkAllRead}
              className="bg-primary-container/20 text-primary hover:bg-primary-container/40 font-mono text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1.5"
            >
              <CheckCheck className="w-4 h-4" />
              Tout marquer comme lu
            </button>
          ) : (
            <span className="font-mono text-xs text-on-surface-variant">
              Tout est lu ✓
            </span>
          )}

          <button
            onClick={onClose}
            className="bg-surface-container-high text-on-surface font-mono text-xs font-semibold px-6 py-2 rounded-full"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
