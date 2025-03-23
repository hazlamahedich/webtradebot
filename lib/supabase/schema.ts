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
  numeric,
  real,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { type InferSelectModel } from "drizzle-orm";

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

// LLM Provider Enum
export const llmProviderEnum = pgEnum("llm_provider", [
  "openai",
  "anthropic",
  "google",
  "mistral",
  "groq",
  "deepseek",
  "together",
  "custom"
]);

// Users table
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email"),
  emailVerified: timestamp("email_verified"),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  gitHubId: integer("github_id"),
  gitHubLogin: text("github_login"),
});

export type User = InferSelectModel<typeof users>;

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
    refreshToken: text("refresh_token"),
    accessToken: text("access_token"),
    expiresAt: integer("expires_at"),
    tokenType: text("token_type"),
    scope: text("scope"),
    idToken: text("id_token"),
    sessionState: text("session_state"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export type Account = InferSelectModel<typeof accounts>;

// Sessions table
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sessionToken: text("session_token").notNull().unique(),
  expires: timestamp("expires").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Session = InferSelectModel<typeof sessions>;

// Verification tokens
export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

export type VerificationToken = InferSelectModel<typeof verificationTokens>;

// Repositories
export const repositories = pgTable(
  "repositories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    owner: text("owner").notNull(),
    fullName: text("full_name").notNull(),
    description: text("description"),
    language: text("language"),
    isPrivate: boolean("is_private").default(false),
    userId: text("user_id")
      .references(() => users.id)
      .notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (repo) => ({
    uniqueFullName: unique().on(repo.fullName, repo.userId),
  })
);

export type Repository = InferSelectModel<typeof repositories>;

// Pull Requests
export const pullRequests = pgTable("pull_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  repoId: uuid("repo_id")
    .references(() => repositories.id)
    .notNull(),
  githubId: integer("github_id").notNull(),
  number: integer("number").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  state: text("state").notNull(), // 'open', 'closed', 'merged'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  closedAt: timestamp("closed_at"),
  mergedAt: timestamp("merged_at"),
  headBranch: text("head_branch"),
  baseBranch: text("base_branch"),
  author: text("author"),
  htmlUrl: text("html_url"),
  diffUrl: text("diff_url"),
  patchUrl: text("patch_url"),
});

export type PullRequest = InferSelectModel<typeof pullRequests>;

// Code Reviews
export const codeReviews = pgTable("code_reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  prId: uuid("pr_id")
    .references(() => pullRequests.id)
    .notNull(),
  userId: text("user_id")
    .references(() => users.id)
    .notNull(),
  status: text("status").notNull(), // 'pending', 'in_progress', 'completed', 'failed'
  feedback: json("feedback").$type<{
    summary: string;
    qualityScore: number;
    issues: Array<{
      id: string;
      type: string;
      title: string;
      description: string;
      severity: string;
      suggestion: string;
      lineNumbers?: number[];
      filename?: string;
    }>;
    suggestions: Array<{
      id: string;
      title: string;
      description: string;
      priority: string;
      implementation?: string;
    }>;
    verdict: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export type CodeReview = InferSelectModel<typeof codeReviews>;

// Review Comments
export const reviewComments = pgTable("review_comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  reviewId: uuid("review_id")
    .references(() => codeReviews.id)
    .notNull(),
  userId: text("user_id")
    .references(() => users.id)
    .notNull(),
  content: text("content").notNull(),
  filePath: text("file_path"),
  lineNumber: integer("line_number"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type ReviewComment = InferSelectModel<typeof reviewComments>;

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

// User Sessions for enhanced session management
export const userSessions = pgTable("user_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  session_data: json("session_data"),
  last_updated: timestamp("last_updated", { mode: "date" }).defaultNow(),
  created_at: timestamp("created_at", { mode: "date" }).defaultNow(),
});

// ServerlessOptimization Metrics
export const serverlessMetrics = pgTable("serverless_metrics", {
  id: uuid("id").defaultRandom().primaryKey(),
  function_name: text("function_name").notNull(),
  execution_time_ms: integer("execution_time_ms").notNull(),
  memory_usage_mb: integer("memory_usage_mb"),
  status: text("status").notNull(),
  error_message: text("error_message"),
  request_id: text("request_id"),
  user_id: text("user_id").references(() => users.id),
  created_at: timestamp("created_at", { mode: "date" }).defaultNow(),
});

// LLM Model Configuration
export const llmConfigurations = pgTable("llm_configurations", {
  id: uuid("id").defaultRandom().primaryKey(),
  provider: llmProviderEnum("provider").notNull(),
  modelName: text("model_name").notNull(),
  displayName: text("display_name").notNull(),
  apiKey: text("api_key"),
  apiUrl: text("api_url"),
  costPerInputToken: numeric("cost_per_input_token").notNull().default("0"),
  costPerOutputToken: numeric("cost_per_output_token").notNull().default("0"),
  isActive: boolean("is_active").default(true),
  isDefault: boolean("is_default").default(false),
  contextWindow: integer("context_window"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

// LLM Usage Logs
export const llmUsageLogs = pgTable("llm_usage_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  configurationId: uuid("configuration_id").references(() => llmConfigurations.id),
  userId: text("user_id").references(() => users.id),
  feature: text("feature").notNull(), // e.g., 'code-review', 'documentation', etc.
  promptTokens: integer("prompt_tokens").default(0),
  completionTokens: integer("completion_tokens").default(0),
  totalTokens: integer("total_tokens").default(0),
  totalCost: numeric("total_cost").default("0"),
  startTime: timestamp("start_time", { mode: "date" }).defaultNow(),
  endTime: timestamp("end_time", { mode: "date" }),
  success: boolean("success").default(true),
  metadata: json("metadata"),
});

// User LLM Preferences
export const userLlmPreferences = pgTable("user_llm_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  defaultConfigurationId: uuid("default_configuration_id")
    .references(() => llmConfigurations.id),
  tokenBudget: numeric("token_budget"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

// LLM providers table
export const llmProviders = pgTable("llm_providers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  apiKey: text("api_key").notNull(),
  apiBase: text("api_base"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type LLMProvider = InferSelectModel<typeof llmProviders>;

// LLM models table
export const llmModels = pgTable("llm_models", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  modelId: text("model_id").notNull(),
  providerId: uuid("provider_id")
    .references(() => llmProviders.id)
    .notNull(),
  maxTokens: integer("max_tokens").default(4096),
  isDefault: boolean("is_default").default(false),
  tasks: json("tasks").$type<string[]>().default(['generation']),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type LLMModel = InferSelectModel<typeof llmModels>;

// LLM usage tracking table
export const llmUsage = pgTable("llm_usage", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .references(() => users.id),
  modelId: text("model_id").notNull(),
  modelName: text("model_name").notNull(),
  providerId: uuid("provider_id")
    .references(() => llmProviders.id),
  feature: text("feature").notNull(), // Which feature used the LLM: 'code_review', 'documentation', etc.
  requestId: text("request_id"), // For tracking specific requests
  inputTokens: integer("input_tokens").notNull(),
  outputTokens: integer("output_tokens").notNull(),
  totalTokens: integer("total_tokens").notNull(),
  cost: real("cost").notNull(),
  duration: integer("duration"), // Duration in milliseconds
  createdAt: timestamp("created_at").defaultNow(),
});

export type LLMUsage = InferSelectModel<typeof llmUsage>;

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
  userSessions: many(userSessions),
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

export const serverlessMetricsRelations = relations(serverlessMetrics, ({ one }) => ({
  user: one(users, {
    fields: [serverlessMetrics.user_id],
    references: [users.id],
  }),
})); 