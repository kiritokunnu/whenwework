import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - Required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - Required for Replit Auth with workforce management fields
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ["admin", "manager", "employee"] }).default("employee"),
  position: varchar("position"),
  phone: varchar("phone"),
  companyId: integer("company_id"),
  organizationName: varchar("organization_name"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Companies/Vendors table
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  address: text("address"),
  contactPerson: varchar("contact_person"),
  contactPhone: varchar("contact_phone"),
  contactEmail: varchar("contact_email"),
  requiresPhoto: boolean("requires_photo").default(false),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Positions/Job roles table
export const positions = pgTable("positions", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schedules table
export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  employeeId: varchar("employee_id").notNull(),
  companyId: integer("company_id").notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  startTime: varchar("start_time").notNull(),
  endTime: varchar("end_time").notNull(),
  status: varchar("status", { enum: ["scheduled", "active", "completed", "cancelled"] }).default("scheduled"),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Check-ins table
export const checkIns = pgTable("check_ins", {
  id: serial("id").primaryKey(),
  employeeId: varchar("employee_id").notNull(),
  companyId: integer("company_id").notNull(),
  scheduleId: integer("schedule_id"),
  checkInTime: timestamp("check_in_time").defaultNow(),
  checkOutTime: timestamp("check_out_time"),
  checkInLatitude: decimal("check_in_latitude", { precision: 10, scale: 8 }),
  checkInLongitude: decimal("check_in_longitude", { precision: 11, scale: 8 }),
  checkOutLatitude: decimal("check_out_latitude", { precision: 10, scale: 8 }),
  checkOutLongitude: decimal("check_out_longitude", { precision: 11, scale: 8 }),
  photoUrl: text("photo_url"),
  notes: text("notes"),
  status: varchar("status", { enum: ["checked_in", "checked_out"] }).default("checked_in"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Time-off requests table
export const timeOffRequests = pgTable("time_off_requests", {
  id: serial("id").primaryKey(),
  employeeId: varchar("employee_id").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  reason: text("reason"),
  status: varchar("status", { enum: ["pending", "approved", "rejected"] }).default("pending"),
  approvedBy: varchar("approved_by"),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Announcements table
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  type: varchar("type", { enum: ["general", "closure", "restriction", "emergency"] }).default("general"),
  targetRole: varchar("target_role", { enum: ["all", "admin", "manager", "employee"] }).default("all"),
  restrictedStartDate: date("restricted_start_date"),
  restrictedEndDate: date("restricted_end_date"),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Pre-registered employees table
export const preRegisteredEmployees = pgTable("pre_registered_employees", {
  id: serial("id").primaryKey(),
  email: varchar("email").notNull(),
  phone: varchar("phone"),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  position: varchar("position"),
  companyId: integer("company_id"),
  isUsed: boolean("is_used").default(false),
  registeredBy: varchar("registered_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Products/Inventory table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  category: varchar("category"),
  unit: varchar("unit").default("pcs"),
  isActive: boolean("is_active").default(true),
  isCustom: boolean("is_custom").default(false),
  addedBy: varchar("added_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Check-in inventory/products used table
export const checkInProducts = pgTable("check_in_products", {
  id: serial("id").primaryKey(),
  checkInId: integer("check_in_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").default(1),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Work summaries with voice notes and transcriptions
export const workSummaries = pgTable("work_summaries", {
  id: serial("id").primaryKey(),
  checkInId: integer("check_in_id").notNull(),
  workNotes: text("work_notes"),
  voiceRecordingUrl: text("voice_recording_url"),
  voiceTranscription: text("voice_transcription"),
  voiceTranslation: text("voice_translation"),
  recordingLanguage: varchar("recording_language").default("en-IN"),
  recordingDuration: integer("recording_duration"), // in seconds
  submittedAt: timestamp("submitted_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Real-time chat system
export const chatRooms = pgTable("chat_rooms", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  type: varchar("type", { enum: ["group", "direct", "announcement"] }).notNull(),
  participants: text("participants").array().notNull(), // Array of user IDs
  createdBy: varchar("created_by").notNull(),
  isActive: boolean("is_active").default(true),
  lastActivity: timestamp("last_activity").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull(),
  senderId: varchar("sender_id").notNull(),
  messageType: varchar("message_type", { enum: ["text", "image", "file", "voice", "location"] }).default("text"),
  content: text("content"),
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  fileSize: integer("file_size"),
  isEdited: boolean("is_edited").default(false),
  replyToId: integer("reply_to_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const messageReadReceipts = pgTable("message_read_receipts", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull(),
  userId: varchar("user_id").notNull(),
  readAt: timestamp("read_at").defaultNow(),
});

// Tasks and assignments
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description"),
  assignedTo: varchar("assigned_to").notNull(),
  assignedBy: varchar("assigned_by").notNull(),
  companyId: integer("company_id"),
  priority: varchar("priority", { enum: ["low", "medium", "high", "urgent"] }).default("medium"),
  status: varchar("status", { enum: ["pending", "in_progress", "completed", "cancelled"] }).default("pending"),
  dueDate: timestamp("due_date"),
  requiresPhoto: boolean("requires_photo").default(false),
  requiresLocation: boolean("requires_location").default(false),
  estimatedHours: decimal("estimated_hours"),
  actualHours: decimal("actual_hours"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const taskUpdates = pgTable("task_updates", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull(),
  userId: varchar("user_id").notNull(),
  status: varchar("status", { enum: ["pending", "in_progress", "completed", "cancelled"] }).notNull(),
  comment: text("comment"),
  photoUrl: text("photo_url"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  hoursWorked: decimal("hours_worked"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Shift management
export const shifts = pgTable("shifts", {
  id: serial("id").primaryKey(),
  employeeId: varchar("employee_id").notNull(),
  title: varchar("title").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  breakDuration: integer("break_duration").default(0), // minutes
  companyId: integer("company_id"),
  isRecurring: boolean("is_recurring").default(false),
  recurringPattern: varchar("recurring_pattern"), // daily, weekly, monthly
  recurringDays: text("recurring_days").array(), // ["monday", "tuesday"]
  status: varchar("status", { enum: ["scheduled", "active", "completed", "cancelled"] }).default("scheduled"),
  overtimeHours: decimal("overtime_hours").default('0'),
  createdBy: varchar("created_by").notNull(),
  reminderSent: boolean("reminder_sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const shiftSwapRequests = pgTable("shift_swap_requests", {
  id: serial("id").primaryKey(),
  requesterId: varchar("requester_id").notNull(),
  originalShiftId: integer("original_shift_id").notNull(),
  targetShiftId: integer("target_shift_id"),
  coverageOnly: boolean("coverage_only").default(false),
  reason: text("reason"),
  status: varchar("status", { enum: ["pending", "approved", "rejected", "peer_approved"] }).default("pending"),
  approvedBy: varchar("approved_by"),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Polls and surveys
export const polls = pgTable("polls", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description"),
  options: jsonb("options").notNull(), // Array of poll options
  targetRoles: text("target_roles").array().notNull(), // ["employee", "manager"]
  createdBy: varchar("created_by").notNull(),
  expiresAt: timestamp("expires_at"),
  allowMultipleChoices: boolean("allow_multiple_choices").default(false),
  isAnonymous: boolean("is_anonymous").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pollResponses = pgTable("poll_responses", {
  id: serial("id").primaryKey(),
  pollId: integer("poll_id").notNull(),
  userId: varchar("user_id").notNull(),
  selectedOptions: text("selected_options").array().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  type: varchar("type", { enum: ["task", "shift", "chat", "announcement", "timeoff", "poll"] }).notNull(),
  relatedId: integer("related_id"), // ID of related entity
  isRead: boolean("is_read").default(false),
  priority: varchar("priority", { enum: ["low", "normal", "high"] }).default("normal"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Offline sync queue
export const syncQueue = pgTable("sync_queue", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  action: varchar("action").notNull(), // create, update, delete
  tableName: varchar("table_name").notNull(),
  recordId: varchar("record_id"),
  data: jsonb("data").notNull(),
  synced: boolean("synced").default(false),
  attempts: integer("attempts").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
  schedules: many(schedules),
  checkIns: many(checkIns),
  timeOffRequests: many(timeOffRequests),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
  employees: many(users),
  schedules: many(schedules),
  checkIns: many(checkIns),
}));

export const schedulesRelations = relations(schedules, ({ one, many }) => ({
  employee: one(users, {
    fields: [schedules.employeeId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [schedules.companyId],
    references: [companies.id],
  }),
  checkIns: many(checkIns),
}));

export const checkInsRelations = relations(checkIns, ({ one }) => ({
  employee: one(users, {
    fields: [checkIns.employeeId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [checkIns.companyId],
    references: [companies.id],
  }),
  schedule: one(schedules, {
    fields: [checkIns.scheduleId],
    references: [schedules.id],
  }),
}));

export const timeOffRequestsRelations = relations(timeOffRequests, ({ one }) => ({
  employee: one(users, {
    fields: [timeOffRequests.employeeId],
    references: [users.id],
  }),
}));

export const preRegisteredEmployeesRelations = relations(preRegisteredEmployees, ({ one }) => ({
  company: one(companies, {
    fields: [preRegisteredEmployees.companyId],
    references: [companies.id],
  }),
}));

export const productsRelations = relations(products, ({ many }) => ({
  checkInProducts: many(checkInProducts),
}));

export const checkInProductsRelations = relations(checkInProducts, ({ one }) => ({
  checkIn: one(checkIns, {
    fields: [checkInProducts.checkInId],
    references: [checkIns.id],
  }),
  product: one(products, {
    fields: [checkInProducts.productId],
    references: [products.id],
  }),
}));

export const workSummariesRelations = relations(workSummaries, ({ one }) => ({
  checkIn: one(checkIns, {
    fields: [workSummaries.checkInId],
    references: [checkIns.id],
  }),
}));

export const chatRoomsRelations = relations(chatRooms, ({ many }) => ({
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one, many }) => ({
  room: one(chatRooms, {
    fields: [chatMessages.roomId],
    references: [chatRooms.id],
  }),
  readReceipts: many(messageReadReceipts),
  replyTo: one(chatMessages, {
    fields: [chatMessages.replyToId],
    references: [chatMessages.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ many }) => ({
  updates: many(taskUpdates),
}));

export const shiftsRelations = relations(shifts, ({ one }) => ({
  employee: one(users, {
    fields: [shifts.employeeId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [shifts.companyId],
    references: [companies.id],
  }),
}));

export const pollsRelations = relations(polls, ({ many }) => ({
  responses: many(pollResponses),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPositionSchema = createInsertSchema(positions).omit({
  id: true,
  createdAt: true,
});

export const insertScheduleSchema = createInsertSchema(schedules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCheckInSchema = createInsertSchema(checkIns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTimeOffRequestSchema = createInsertSchema(timeOffRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPreRegisteredEmployeeSchema = createInsertSchema(preRegisteredEmployees).omit({
  id: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCheckInProductSchema = createInsertSchema(checkInProducts).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;
export type InsertPosition = z.infer<typeof insertPositionSchema>;
export type Position = typeof positions.$inferSelect;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type Schedule = typeof schedules.$inferSelect;
export type InsertCheckIn = z.infer<typeof insertCheckInSchema>;
export type CheckIn = typeof checkIns.$inferSelect;
export type InsertTimeOffRequest = z.infer<typeof insertTimeOffRequestSchema>;
export type TimeOffRequest = typeof timeOffRequests.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type Announcement = typeof announcements.$inferSelect;
export type InsertPreRegisteredEmployee = z.infer<typeof insertPreRegisteredEmployeeSchema>;
export type PreRegisteredEmployee = typeof preRegisteredEmployees.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertCheckInProduct = z.infer<typeof insertCheckInProductSchema>;
export type CheckInProduct = typeof checkInProducts.$inferSelect;

// Additional feature types
export type MessageReadReceipt = typeof messageReadReceipts.$inferSelect;
export type SyncQueueItem = typeof syncQueue.$inferSelect;

// Insert schemas for new features
export const insertChatRoomSchema = createInsertSchema(chatRooms).omit({
  id: true,
  createdAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaskUpdateSchema = createInsertSchema(taskUpdates).omit({
  id: true,
  createdAt: true,
});

export const insertShiftSchema = createInsertSchema(shifts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertShiftSwapRequestSchema = createInsertSchema(shiftSwapRequests).omit({
  id: true,
  createdAt: true,
});

export const insertPollSchema = createInsertSchema(polls).omit({
  id: true,
  createdAt: true,
});

export const insertPollResponseSchema = createInsertSchema(pollResponses).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertWorkSummarySchema = createInsertSchema(workSummaries).omit({
  id: true,
  submittedAt: true,
  createdAt: true,
});

// Chat types
export type InsertChatRoom = z.infer<typeof insertChatRoomSchema>;
export type ChatRoom = typeof chatRooms.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

// Task types
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTaskUpdate = z.infer<typeof insertTaskUpdateSchema>;
export type TaskUpdate = typeof taskUpdates.$inferSelect;

// Shift types
export type InsertShift = z.infer<typeof insertShiftSchema>;
export type Shift = typeof shifts.$inferSelect;
export type InsertShiftSwapRequest = z.infer<typeof insertShiftSwapRequestSchema>;
export type ShiftSwapRequest = typeof shiftSwapRequests.$inferSelect;

// Poll types
export type InsertPoll = z.infer<typeof insertPollSchema>;
export type Poll = typeof polls.$inferSelect;
export type InsertPollResponse = z.infer<typeof insertPollResponseSchema>;
export type PollResponse = typeof pollResponses.$inferSelect;

// Notification types
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Work summary types
export type InsertWorkSummary = z.infer<typeof insertWorkSummarySchema>;
export type WorkSummary = typeof workSummaries.$inferSelect;

// Expense Tracking Tables
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  employeeId: varchar("employee_id").notNull(),
  taskId: integer("task_id"), // Link to tasks
  shiftId: integer("shift_id"), // Link to shifts  
  checkInId: integer("check_in_id"), // Link to client visits
  companyId: integer("company_id"), // Link to companies
  category: varchar("category").notNull(), // Travel, Food, Supplies, etc.
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").default("USD"),
  description: text("description").notNull(),
  receiptUrl: text("receipt_url"), // Photo of receipt
  status: varchar("status", { enum: ["pending", "approved", "rejected", "reimbursed"] }).default("pending"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  approvedBy: varchar("approved_by"), // Manager/Admin who approved
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  reimbursedAt: timestamp("reimbursed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Push Notification Tables
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dhKey: text("p256dh_key").notNull(),
  authKey: text("auth_key").notNull(),
  userAgent: text("user_agent"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pushNotifications = pgTable("push_notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  title: varchar("title").notNull(),
  body: text("body").notNull(),
  icon: varchar("icon"),
  badge: varchar("badge"),
  tag: varchar("tag"), // For grouping notifications
  data: jsonb("data"), // Additional data payload
  url: varchar("url"), // Action URL
  priority: varchar("priority", { enum: ["low", "normal", "high", "urgent"] }).default("normal"),
  status: varchar("status", { enum: ["pending", "sent", "delivered", "failed"] }).default("pending"),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Biometric Authentication Tables
export const biometricCredentials = pgTable("biometric_credentials", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  credentialId: text("credential_id").notNull().unique(),
  publicKey: text("public_key").notNull(),
  authenticatorType: varchar("authenticator_type"), // fingerprint, face, etc.
  deviceName: varchar("device_name"),
  isActive: boolean("is_active").default(true),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Geofencing Tables
export const geofences = pgTable("geofences", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  name: varchar("name").notNull(),
  centerLatitude: decimal("center_latitude", { precision: 10, scale: 8 }).notNull(),
  centerLongitude: decimal("center_longitude", { precision: 11, scale: 8 }).notNull(),
  radiusMeters: integer("radius_meters").notNull(),
  isActive: boolean("is_active").default(true),
  autoCheckIn: boolean("auto_check_in").default(false),
  autoCheckOut: boolean("auto_check_out").default(false),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const geofenceEvents = pgTable("geofence_events", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  geofenceId: integer("geofence_id").notNull(),
  eventType: varchar("event_type", { enum: ["enter", "exit"] }).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  checkInId: integer("check_in_id"), // If auto check-in was triggered
  timestamp: timestamp("timestamp").defaultNow(),
});

// Insert schemas for the new tables
export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  submittedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({
  id: true,
  createdAt: true,
});

export const insertPushNotificationSchema = createInsertSchema(pushNotifications).omit({
  id: true,
  createdAt: true,
});

export const insertBiometricCredentialSchema = createInsertSchema(biometricCredentials).omit({
  id: true,
  createdAt: true,
});

export const insertGeofenceSchema = createInsertSchema(geofences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGeofenceEventSchema = createInsertSchema(geofenceEvents).omit({
  id: true,
  timestamp: true,
});

// Types
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushNotification = z.infer<typeof insertPushNotificationSchema>;
export type PushNotification = typeof pushNotifications.$inferSelect;
export type InsertBiometricCredential = z.infer<typeof insertBiometricCredentialSchema>;
export type BiometricCredential = typeof biometricCredentials.$inferSelect;
export type InsertGeofence = z.infer<typeof insertGeofenceSchema>;
export type Geofence = typeof geofences.$inferSelect;
export type InsertGeofenceEvent = z.infer<typeof insertGeofenceEventSchema>;
export type GeofenceEvent = typeof geofenceEvents.$inferSelect;
