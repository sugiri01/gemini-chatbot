import { Message } from "ai";
import { InferSelectModel } from "drizzle-orm";
import {
  pgTable,
  varchar,
  timestamp,
  json,
  uuid,
  boolean,
} from "drizzle-orm/pg-core";

export const chat = pgTable("Chat", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  createdAt: timestamp("createdAt").notNull(),
  messages: json("messages").notNull(),
  userId: varchar("userId", { length: 64 }).notNull(),
});

export type Chat = Omit<InferSelectModel<typeof chat>, "messages"> & {
  messages: Array<Message>;
};

export const reservation = pgTable("Reservation", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  createdAt: timestamp("createdAt").notNull(),
  details: json("details").notNull(),
  hasCompletedPayment: boolean("hasCompletedPayment").notNull().default(false),
  userId: varchar("userId", { length: 64 }).notNull(),
});


export const users = pgTable("User", {
  id: varchar("id", { length: 64 }).primaryKey().notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  lastSeen: timestamp("lastSeen").notNull(),
});


export const messages = pgTable("Message", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  senderId: varchar("senderId", { length: 64 }).notNull(),
  receiverId: varchar("receiverId", { length: 64 }).notNull(),
  content: varchar("content").notNull(),
  translatedContent: varchar("translatedContent"),
  englishContent: varchar("englishContent"),
  targetLang: varchar("targetLang", { length: 10 }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type DBMessage = InferSelectModel<typeof messages>;
