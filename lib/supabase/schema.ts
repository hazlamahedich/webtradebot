import {
  timestamp,
  pgTable,
  text,
  primaryKey,
  integer,
  uuid,
  pgEnum,
  json,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const reviewStatusEnum = pgEnum("review_status", [
  "pending",
  "in_progress",
  "completed",
  "failed",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "new_review",
  "review_completed",
  "new_comment",
  "mention",
  "assigned",
  "team_activity",
  "system",
]);

export const documentationStatusEnum = pgEnum("documentation_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);

// Users table
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
});

// Accounts table for OAuth
export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey(account.provider, account.providerAccountId),
  })
);

// Sessions table
export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

// Verification tokens
export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey(vt.identifier, vt.token),
  })
);

// Repositories
export const repositories = pgTable("repositories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  fullName: text("full_name").notNull(),
  owner: text("owner").notNull(),
  url: text("url").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

// Pull Requests
export const pullRequests = pgTable("pull_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  number: integer("number").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull(),
  author: text("author").notNull(),
  url: text("url").notNull(),
  repoId: uuid("repo_id")
    .notNull()
    .references(() => repositories.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

// Code Reviews
export const codeReviews = pgTable("code_reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  status: reviewStatusEnum("status").notNull().default("pending"),
  summary: text("summary"),
  feedback: json("feedback"),
  prId: uuid("pr_id")
    .notNull()
    .references(() => pullRequests.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

// Review Comments
export const reviewComments = pgTable("review_comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  content: text("content").notNull(),
  filePath: text("file_path"),
  lineNumber: integer("line_number"),
  reviewId: uuid("review_id")
    .notNull()
    .references(() => codeReviews.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

// Organizations
export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  isPersonal: boolean("is_personal").default(false),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

// Organization memberships
export const organizationMembers = pgTable("organization_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  role: text("role").notNull().default("member"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  link: text("link"),
  read: boolean("read").default(false),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  senderId: text("sender_id").references(() => users.id),
  metadata: json("metadata"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

// Documentation Requests
export const documentationRequests = pgTable("documentation_requests", {
  id: text("id").primaryKey(),
  repository_id: text("repository_id").notNull(),
  owner: text("owner").notNull(),
  repo: text("repo").notNull(),
  branch: text("branch").notNull(),
  status: documentationStatusEnum("status").notNull().default("pending"),
  progress: integer("progress").default(0),
  result: json("result"),
  user_id: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at", { mode: "date" }).defaultNow(),
  completed_at: timestamp("completed_at", { mode: "date" }),
});

// Documentation Components
export const documentationComponents = pgTable("documentation_components", {
  id: uuid("id").defaultRandom().primaryKey(),
  doc_id: text("doc_id")
    .notNull()
    .references(() => documentationRequests.id, { onDelete: "cascade" }),
  component_id: text("component_id").notNull(),
  component_type: text("component_type").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  file_path: text("file_path").notNull(),
  content: text("content").notNull(),
  quality_score: integer("quality_score"),
  created_at: timestamp("created_at", { mode: "date" }).defaultNow(),
  updated_at: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

// Documentation Versions
export const documentationVersions = pgTable("documentation_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  doc_id: text("doc_id")
    .notNull()
    .references(() => documentationRequests.id, { onDelete: "cascade" }),
  version: text("version").notNull(),
  changes_summary: text("changes_summary"),
  is_current: boolean("is_current").default(false),
  created_at: timestamp("created_at", { mode: "date" }).defaultNow(),
  created_by: text("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

// Documentation Diagrams
export const documentationDiagrams = pgTable("documentation_diagrams", {
  id: uuid("id").defaultRandom().primaryKey(),
  doc_id: text("doc_id")
    .notNull()
    .references(() => documentationRequests.id, { onDelete: "cascade" }),
  diagram_type: text("diagram_type").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  created_at: timestamp("created_at", { mode: "date" }).defaultNow(),
});

// Relations
export const userRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  repositories: many(repositories),
  reviews: many(codeReviews),
  comments: many(reviewComments),
  organizations: many(organizationMembers),
  notifications: many(notifications),
  sentNotifications: many(notifications, { relationName: "notificationSender" }),
  documentationRequests: many(documentationRequests),
  documentationVersions: many(documentationVersions),
}));

export const repositoryRelations = relations(repositories, ({ one, many }) => ({
  user: one(users, {
    fields: [repositories.userId],
    references: [users.id],
  }),
  pullRequests: many(pullRequests),
}));

export const pullRequestRelations = relations(pullRequests, ({ one, many }) => ({
  repository: one(repositories, {
    fields: [pullRequests.repoId],
    references: [repositories.id],
  }),
  reviews: many(codeReviews),
}));

export const codeReviewRelations = relations(codeReviews, ({ one, many }) => ({
  pullRequest: one(pullRequests, {
    fields: [codeReviews.prId],
    references: [pullRequests.id],
  }),
  user: one(users, {
    fields: [codeReviews.userId],
    references: [users.id],
  }),
  comments: many(reviewComments),
}));

export const organizationRelations = relations(organizations, ({ many }) => ({
  members: many(organizationMembers),
}));

export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
  user: one(users, {
    fields: [organizationMembers.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [organizationMembers.orgId],
    references: [organizations.id],
  }),
}));

export const notificationRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  sender: one(users, {
    fields: [notifications.senderId],
    references: [users.id],
    relationName: "notificationSender",
  }),
}));

export const reviewCommentRelations = relations(reviewComments, ({ one }) => ({
  review: one(codeReviews, {
    fields: [reviewComments.reviewId],
    references: [codeReviews.id],
  }),
  user: one(users, {
    fields: [reviewComments.userId],
    references: [users.id],
  }),
}));

// Documentation Relations
export const documentationRequestsRelations = relations(documentationRequests, ({ one, many }) => ({
  user: one(users, {
    fields: [documentationRequests.user_id],
    references: [users.id],
  }),
  components: many(documentationComponents),
  versions: many(documentationVersions),
  diagrams: many(documentationDiagrams),
}));

export const documentationComponentsRelations = relations(documentationComponents, ({ one }) => ({
  documentationRequest: one(documentationRequests, {
    fields: [documentationComponents.doc_id],
    references: [documentationRequests.id],
  }),
}));

export const documentationVersionsRelations = relations(documentationVersions, ({ one }) => ({
  documentationRequest: one(documentationRequests, {
    fields: [documentationVersions.doc_id],
    references: [documentationRequests.id],
  }),
  user: one(users, {
    fields: [documentationVersions.created_by],
    references: [users.id],
  }),
}));

export const documentationDiagramsRelations = relations(documentationDiagrams, ({ one }) => ({
  documentationRequest: one(documentationRequests, {
    fields: [documentationDiagrams.doc_id],
    references: [documentationRequests.id],
  }),
})); 