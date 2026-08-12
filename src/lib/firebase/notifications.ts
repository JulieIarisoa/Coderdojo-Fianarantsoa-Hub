import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "./config";
import { NotificationItem } from "@/types";
import { createdAtMillis } from "@/lib/utils/notification";

function handleNotificationSnapshotError(err: unknown, source: string) {
  const code = (err as { code?: string })?.code;
  if (code === "permission-denied") {
    console.warn(
      `[Firestore Permission Warning] ${source}: Insufficient permissions or unauthenticated session.`
    );
  } else {
    console.error(`[Firestore Error] ${source}:`, err);
  }
}

export function subscribeToNotifications(
  userId: string,
  callback: (notifications: NotificationItem[]) => void
) {
  if (!userId) return () => {};

  const notificationsQuery = query(
    collection(db, "notifications"),
    where("userId", "==", userId)
  );

  return onSnapshot(
    notificationsQuery,
    (snapshot) => {
      const notifications: NotificationItem[] = snapshot.docs.map((document) => ({
        ...document.data(),
        id: document.id,
      })) as NotificationItem[];
      notifications.sort(
        (a, b) => createdAtMillis(b.createdAt) - createdAtMillis(a.createdAt)
      );
      callback(notifications);
    },
    (error) =>
      handleNotificationSnapshotError(error, `subscribeToNotifications(${userId})`)
  );
}

export async function markNotificationRead(notificationId: string) {
  const notificationRef = doc(db, "notifications", notificationId);
  await updateDoc(notificationRef, { read: true });
}

export async function markAllNotificationsRead(userId: string) {
  if (!userId) return;

  const notificationsQuery = query(
    collection(db, "notifications"),
    where("userId", "==", userId)
  );

  try {
    const snapshot = await getDocs(notificationsQuery);
    const unreadNotifications = snapshot.docs.filter(
      (notification) => notification.data().read !== true
    );
    if (unreadNotifications.length === 0) return;

    const batch = writeBatch(db);
    unreadNotifications.forEach((notification) => {
      batch.update(notification.ref, { read: true });
    });
    await batch.commit();
  } catch (err) {
    handleNotificationSnapshotError(err, "markAllNotificationsRead");
  }
}

export async function createNotification(notification: {
  userId: string;
  type: NotificationItem["type"];
  message: string;
  link?: string;
}) {
  try {
    await addDoc(collection(db, "notifications"), {
      ...notification,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleNotificationSnapshotError(error, "createNotification");
  }
}
