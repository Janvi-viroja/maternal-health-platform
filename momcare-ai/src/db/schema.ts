import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  role: text('role').notNull().default('patient'),
  fullName: text('full_name').notNull(),
  age: integer('age'),
  pregnancyWeek: integer('pregnancy_week'),
  lmpDate: text('lmp_date'),
  expectedDeliveryDate: text('expected_delivery_date'),
  bloodGroup: text('blood_group'),
  medicalHistory: text('medical_history'),
  dietPreference: text('diet_preference').notNull().default('vegetarian'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const doctors = pgTable('doctors', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  specialization: text('specialization').notNull(),
  qualification: text('qualification').notNull(),
  experienceYears: integer('experience_years').notNull(),
  hospital: text('hospital').notNull(),
  consultationFee: integer('consultation_fee').notNull(),
  rating: text('rating').notNull(),
  languages: text('languages').notNull(),
  bio: text('bio').notNull(),
  imageUrl: text('image_url').notNull(),
  availableSlots: text('available_slots').notNull(),
  isAvailable: boolean('is_available').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const appointments = pgTable('appointments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  doctorId: integer('doctor_id')
    .references(() => doctors.id, { onDelete: 'cascade' })
    .notNull(),
  appointmentDate: text('appointment_date').notNull(),
  timeSlot: text('time_slot').notNull(),
  consultationType: text('consultation_type').notNull(),
  reason: text('reason').notNull(),
  status: text('status').notNull().default('Confirmed'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const reminders = pgTable('reminders', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  dueDate: text('due_date').notNull(),
  dueTime: text('due_time').notNull(),
  frequency: text('frequency').notNull().default('Once'),
  notes: text('notes'),
  completed: boolean('completed').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const communityPosts = pgTable('community_posts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  authorName: text('author_name').notNull(),
  authorWeek: integer('author_week'),
  category: text('category').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  likesCount: integer('likes_count').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const communityComments = pgTable('community_comments', {
  id: serial('id').primaryKey(),
  postId: integer('post_id')
    .references(() => communityPosts.id, { onDelete: 'cascade' })
    .notNull(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  authorName: text('author_name').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const postpartumLogs = pgTable('postpartum_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  logDate: text('log_date').notNull(),
  mood: text('mood').notNull(),
  sleepHours: text('sleep_hours').notNull(),
  feedingCount: integer('feeding_count').notNull().default(0),
  painLevel: integer('pain_level').notNull().default(2),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const hydrationLogs = pgTable('hydration_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  logDate: text('log_date').notNull(),
  glassesCount: integer('glasses_count').notNull().default(0),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  appointments: many(appointments),
  reminders: many(reminders),
  communityPosts: many(communityPosts),
  communityComments: many(communityComments),
  postpartumLogs: many(postpartumLogs),
  hydrationLogs: many(hydrationLogs),
}));

export const doctorsRelations = relations(doctors, ({ many }) => ({
  appointments: many(appointments),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  patient: one(users, {
    fields: [appointments.userId],
    references: [users.id],
  }),
  doctor: one(doctors, {
    fields: [appointments.doctorId],
    references: [doctors.id],
  }),
}));

export const remindersRelations = relations(reminders, ({ one }) => ({
  user: one(users, {
    fields: [reminders.userId],
    references: [users.id],
  }),
}));

export const communityPostsRelations = relations(communityPosts, ({ one, many }) => ({
  author: one(users, {
    fields: [communityPosts.userId],
    references: [users.id],
  }),
  comments: many(communityComments),
}));

export const communityCommentsRelations = relations(communityComments, ({ one }) => ({
  post: one(communityPosts, {
    fields: [communityComments.postId],
    references: [communityPosts.id],
  }),
  author: one(users, {
    fields: [communityComments.userId],
    references: [users.id],
  }),
}));

export const postpartumLogsRelations = relations(postpartumLogs, ({ one }) => ({
  user: one(users, {
    fields: [postpartumLogs.userId],
    references: [users.id],
  }),
}));

export const hydrationLogsRelations = relations(hydrationLogs, ({ one }) => ({
  user: one(users, {
    fields: [hydrationLogs.userId],
    references: [users.id],
  }),
}));
