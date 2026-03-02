import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
  uuid,
  uniqueIndex,
  index,
  varchar,
  primaryKey,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ─── Enums ───────────────────────────────────────────────────────────────────

export const experimentStatusEnum = pgEnum('experiment_status', [
  'draft',
  'running',
  'paused',
  'complete',
])

export const goalTypeEnum = pgEnum('goal_type', [
  'click',
  'pageview',
  'form_submit',
  'custom',
])

export const planEnum = pgEnum('plan', ['free', 'starter', 'pro'])

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'canceled',
  'past_due',
])

// ─── Auth Tables (NextAuth — uses text IDs for adapter compatibility) ─────────

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').unique(),
  emailVerified: timestamp('email_verified'),
  name: text('name'),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refreshToken: text('refresh_token'),
  accessToken: text('access_token'),
  expiresAt: integer('expires_at'),
  tokenType: text('token_type'),
  scope: text('scope'),
  idToken: text('id_token'),
  sessionState: text('session_state'),
})

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  sessionToken: text('session_token').unique().notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
})

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').unique().notNull(),
    expires: timestamp('expires').notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })]
)

// ─── Workspaces ───────────────────────────────────────────────────────────────

export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  name: text('name').notNull(),
  apiKey: varchar('api_key', { length: 64 }).unique().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ─── Experiments ──────────────────────────────────────────────────────────────

export const experiments = pgTable('experiments', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  status: experimentStatusEnum('status').default('draft').notNull(),
  goalType: goalTypeEnum('goal_type').default('click').notNull(),
  goalSelector: varchar('goal_selector', { length: 255 }),
  trafficAllocation: integer('traffic_allocation').default(100).notNull(),
  hasAlertSent: boolean('has_alert_sent').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('experiments_workspace_idx').on(t.workspaceId),
  index('experiments_status_idx').on(t.status),
])

// ─── Variants ────────────────────────────────────────────────────────────────

export const variants = pgTable('variants', {
  id: uuid('id').primaryKey().defaultRandom(),
  experimentId: uuid('experiment_id').notNull().references(() => experiments.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  isControl: boolean('is_control').default(false).notNull(),
  targetSelector: varchar('target_selector', { length: 255 }),
  htmlContent: text('html_content'),
  cssOverride: text('css_override'),
  redirectUrl: text('redirect_url'),
  weight: integer('weight').default(50).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('variants_experiment_idx').on(t.experimentId),
])

// ─── Visitors ────────────────────────────────────────────────────────────────

export const visitors = pgTable('visitors', {
  id: uuid('id').primaryKey().defaultRandom(),
  experimentId: uuid('experiment_id').notNull().references(() => experiments.id, { onDelete: 'cascade' }),
  variantId: uuid('variant_id').notNull().references(() => variants.id, { onDelete: 'cascade' }),
  visitorHash: varchar('visitor_hash', { length: 64 }).notNull(),
  converted: boolean('converted').default(false).notNull(),
  convertedAt: timestamp('converted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('visitors_experiment_idx').on(t.experimentId),
  index('visitors_variant_idx').on(t.variantId),
  uniqueIndex('visitors_experiment_hash_idx').on(t.experimentId, t.visitorHash),
])

// ─── Subscriptions ────────────────────────────────────────────────────────────

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  plan: planEnum('plan').default('free').notNull(),
  experimentLimit: integer('experiment_limit').default(3).notNull(),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  status: subscriptionStatusEnum('status').default('active').notNull(),
  currentPeriodEnd: timestamp('current_period_end'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ─── Relations ───────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [users.id], references: [workspaces.userId] }),
  subscription: one(subscriptions, { fields: [users.id], references: [subscriptions.userId] }),
  accounts: many(accounts),
  sessions: many(sessions),
}))

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  user: one(users, { fields: [workspaces.userId], references: [users.id] }),
  experiments: many(experiments),
}))

export const experimentsRelations = relations(experiments, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [experiments.workspaceId], references: [workspaces.id] }),
  variants: many(variants),
  visitors: many(visitors),
}))

export const variantsRelations = relations(variants, ({ one, many }) => ({
  experiment: one(experiments, { fields: [variants.experimentId], references: [experiments.id] }),
  visitors: many(visitors),
}))

export const visitorsRelations = relations(visitors, ({ one }) => ({
  experiment: one(experiments, { fields: [visitors.experimentId], references: [experiments.id] }),
  variant: one(variants, { fields: [visitors.variantId], references: [variants.id] }),
}))

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, { fields: [subscriptions.userId], references: [users.id] }),
}))
