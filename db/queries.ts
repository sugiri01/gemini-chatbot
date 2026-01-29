import "server-only";

import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { chat, messages, reservation, users } from "./schema";

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle
let client = postgres(`${process.env.POSTGRES_URL!}?sslmode=require`);
let db = drizzle(client);

export async function saveChat({
  id,
  messages,
  userId,
}: {
  id: string;
  messages: any;
  userId: string;
}) {
  try {
    const selectedChats = await db.select().from(chat).where(eq(chat.id, id));

    if (selectedChats.length > 0) {
      return await db
        .update(chat)
        .set({
          messages: JSON.stringify(messages),
        })
        .where(eq(chat.id, id));
    }

    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      messages: JSON.stringify(messages),
      userId,
    });
  } catch (error) {
    console.error("Failed to save chat in database");
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    return await db.delete(chat).where(eq(chat.id, id));
  } catch (error) {
    console.error("Failed to delete chat by id from database");
    throw error;
  }
}

export async function getChatsByUserId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(chat)
      .where(eq(chat.userId, id))
      .orderBy(desc(chat.createdAt));
  } catch (error) {
    console.error("Failed to get chats by user from database");
    throw error;
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    console.error("Failed to get chat by id from database");
    throw error;
  }
}

export async function createReservation({
  id,
  userId,
  details,
}: {
  id: string;
  userId: string;
  details: any;
}) {
  return await db.insert(reservation).values({
    id,
    createdAt: new Date(),
    userId,
    hasCompletedPayment: false,
    details: JSON.stringify(details),
  });
}

export async function getReservationById({ id }: { id: string }) {
  const [selectedReservation] = await db
    .select()
    .from(reservation)
    .where(eq(reservation.id, id));

  return selectedReservation;
}

export async function updateReservation({
  id,
  hasCompletedPayment,
}: {
  id: string;
  hasCompletedPayment: boolean;
}) {
  return await db
    .update(reservation)
    .set({
      hasCompletedPayment,
    })
    .where(eq(reservation.id, id));
}

// User Queries
export async function getUsers() {
  try {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.lastSeen));
  } catch (error) {
    console.error("Failed to get users from database");
    throw error;
  }
}

export async function getUserById(id: string) {
  try {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  } catch (error) {
    console.error("Failed to get user by id");
    throw error;
  }
}

export async function saveUser({
  id,
  email,
}: {
  id: string;
  email: string;
}) {
  try {
    return await db
      .insert(users)
      .values({
        id,
        email,
        lastSeen: new Date(),
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          lastSeen: new Date(),
          email, // Sync email if changed
        },
      });
  } catch (error) {
    console.error("Failed to save user to database");
    throw error;
  }
}

export async function saveMessage(message: any) {
  try {
    return await db.insert(messages).values({
      ...message,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Failed to save message to database");
    throw error;
  }
}

export async function getMessages(senderId: string, receiverId: string) {
  try {
    // Get messages where (sender is A and receiver is B) OR (sender is B and receiver is A)
    // Drizzle ORM way to do complex OR logic:
    // We can filter in memory or raw sql if needed, but let's try strict drizzle.
    // Actually, simple sql template might be easier for OR condition if raw `or` is tricky.
    // But let's retrieve all messages involving these two users and sort.

    // Simpler: just fetch all messages for now (or improve query later)
    // Actually, let's use `sql` operator from drizzle for OR.
    // import { or, and } from "drizzle-orm"; -> Need to add imports

    // For now, let's just use raw SQL or simple logic. 
    // db.execute(sql`...`)

    const results = await db.select().from(messages).orderBy(desc(messages.createdAt));

    // Filter in memory for simplicity (unless scale is huge)
    return results.filter(
      (m) =>
        (m.senderId === senderId && m.receiverId === receiverId) ||
        (m.senderId === receiverId && m.receiverId === senderId)
    ).reverse(); // Oldest first for chat UI

  } catch (error) {
    console.error("Failed to get messages");
    throw error;
  }
}
