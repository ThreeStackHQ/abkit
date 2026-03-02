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
  'click',        // CSS selector click
  'pageview',     // URL matches pattern
  'form_submit',  // Form submission event
  'custom',       // window.abkit.convert() call
])

export const planEnum = pgEnum('plan', ['free', 'starter', 'pro'])

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'trialing',
  'past_due',
  'canceled',
  'unpaid',
])

// ─── Auth Tables (NextAuth) ───────────────────────────────────────────────────

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').unique().notNull(),
  emailVerified: timestamp('email_verified'),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
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

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').unique().notNull(),
  expires: timestamp('expires').notNull(),
})

// ─── Workspaces ───────────────────────────────────────────────────────────────

export const workspaces = pgTable('workspaces', {
  id: text('id').primaryKey(), // nanoid
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  ownerId: text('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  apiKey: text('api_key').unique().notNull(), // public key for widget
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  uniqueIndex('workspaces_slug_idx').on(t.slug),
  uniqueIndex('workspaces_api_key_idx').on(t.apiKey),
])

// ─── Experiments ──────────────────────────────────────────────────────────────

export const experiments = pgTable('experiments', {
  id: text('id').primaryKey(), // nanoid
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  status: experimentStatusEnum('status').default('draft').notNull(),
  goalType: goalTypeEnum('goal_type').default('click').notNull(),
  // For click: CSS selector to watch. For pageview: URL pattern. For form: form CSS selector.
  goalSelector: text('goal_selector'),
  // Traffic allocation — % of visitors to include in experiment (100 = all)
  trafficAllocation: integer('traffic_allocation').default(100).notNull(),
  // Split ratio — % of included traffic sent to variant (50 = 50/50)
  splitRatio: integer('split_ratio').default(50).notNull(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('experiments_workspace_idx').on(t.workspaceId),
  index('experiments_status_idx').on(t.status),
])

// ─── Variants ────────────────────────────────────────────────────────────────

export const variants = pgTable('variants', {
  id: text('id').primaryKey(), // nanoid
  experimentId: text('experiment_id').notNull().references(() => experiments.id, { onDelete: 'cascade' }),
  name: text('name').notNull(), // e.g. 'Control' or 'Variant A'
  isControl: boolean('is_control').default(false).notNull(),
  // DOM manipulation: replace innerHTML of target selector
  targetSelector: text('target_selector'),
  htmlContent: text('html_content'),
  // CSS injection
  cssOverride: text('css_override'),
  // URL redirect (optional — redirect to different page)
  redirectUrl: text('redirect_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('variants_experiment_idx').on(t.experimentId),
])

// ─── Visitors (impression + assignment log) ───────────────────────────────────

export const visitors = pgTable('visitors', {
  id: uuid('id').primaryKey().defaultRandom(),
  experimentId: text('experiment_id').notNull().references(() => experiments.id, { onDelete: 'cascade' }),
  variantId: text('variant_id').notNull().references(() => variants.id, { onDelete: 'cascade' }),
  // Cookie/fingerprint hash — not PII, used to dedup same visitor
  visitorHash: text('visitor_hash').notNull(),
  converted: boolean('converted').default(false).notNull(),
  convertedAt: timestamp('converted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('visitors_experiment_idx').on(t.experimentId),
  index('visitors_variant_idx').on(t.variantId),
  // One row per visitor per experiment (deduplicated by visitor hash)
  uniqueIndex('visitors_experiment_hash_idx').on(t.experimentId, t.visitorHash),
])

// ─── Subscriptions ────────────────────────────────────────────────────────────

export const subscriptions = pgTable('subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  plan: planEnum('plan').default('free').notNull(),
  status: subscriptionStatusEnum('status').default('active').notNull(),
  // Plan limits
  experimentLimit: integer('experiment_limit').default(1).notNull(), // free=1, starter=5, pro=-1 (unlimited)
  currentPeriodEnd: timestamp('current_period_end'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ─── Relations ───────────────────────────────────────────────────────────────

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(users, { fields: [workspaces.ownerId], references: [users.id] }),
  experiments: many(experiments),
  subscription: one(subscriptions, { fields: [workspaces.id], references: [subscriptions.workspaceId] }),
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
