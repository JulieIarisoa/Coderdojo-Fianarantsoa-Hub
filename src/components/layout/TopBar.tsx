"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { Bell, Mail } from "lucide-react";
import { InboxModal } from "./InboxModal";
import { subscribeToReceivedMessages } from "@/lib/firebase/messaging";

export function TopBar() {
  const { user } = useAuth();
  const [showInbox, setShowInbox] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user || !process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return;
    const unsub = subscribeToReceivedMessages(user.id, (msgs) => {
      setUnreadCount(msgs.length);
    });
    return () => unsub();
  }, [user]);

  return (
    <header className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop h-16 sticky top-0 z-40 backdrop-blur-md bg-surface-container-lowest/80 border-b border-outline-variant/30">
      {/* Mobile Logo Header */}
      <div className="lg:hidden flex items-center gap-2">
        <Image src="/logo.jpg" alt="CoderDojo Logo" width={32} height={32} className="w-8 h-8 rounded-lg object-cover shadow-sm border border-outline-variant/30" />
        <span className="font-headline text-headline-md font-extrabold bg-gradient-to-r from-primary to-surface-tint bg-clip-text text-transparent">
          CoderDojo
        </span>
      </div>

      {/* Spacer for desktop layout balance */}
      <div className="hidden lg:block text-primary font-body-md text-body-md opacity-0">
        Spacer
      </div>

      {/* Right User Actions */}
      <div className="flex items-center gap-4 ml-auto">
        <button
          onClick={() => setShowInbox(true)}
          title="Boîte de réception (Messages directs)"
          className="relative w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-variant/50 transition-all"
        >
          <Mail className="w-5 h-5 text-primary" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-on-primary font-mono text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-surface">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          aria-label="Notifications"
          className="relative w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-variant/50 transition-all"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-error ring-2 ring-surface"></span>
        </button>

        {user && (
          <Link href="/settings" className="flex items-center gap-3">
            <Image src={user.avatar} alt={user.name} width={40} height={40} className="w-10 h-10 rounded-full object-cover border-2 border-surface-container shadow-sm hover:ring-2 hover:ring-primary transition-all" />
          </Link>
        )}
      </div>

      <InboxModal isOpen={showInbox} onClose={() => setShowInbox(false)} />
    </header>
  );
}
