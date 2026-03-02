-- AbKit Initial Schema Migration
-- Sprint 1.2: Database Schema

CREATE TYPE "experiment_status" AS ENUM('draft', 'running', 'paused', 'complete');
CREATE TYPE "goal_type" AS ENUM('click', 'pageview', 'form_submit', 'custom');
CREATE TYPE "plan" AS ENUM('free', 'starter', 'pro');
CREATE TYPE "subscription_status" AS ENUM('active', 'canceled', 'past_due');

-- NextAuth tables
CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" text UNIQUE,
  "email_verified" timestamp,
  "name" text,
  "image" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "accounts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "type" text NOT NULL,
  "provider" text NOT NULL,
  "provider_account_id" text NOT NULL,
  "refresh_token" text,
  "access_token" text,
  "expires_at" integer,
  "token_type" text,
  "scope" text,
  "id_token" text,
  "session_state" text
);

CREATE TABLE "sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "session_token" text UNIQUE NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "expires" timestamp NOT NULL
);

CREATE TABLE "verification_tokens" (
  "identifier" text NOT NULL,
  "token" text UNIQUE NOT NULL,
  "expires" timestamp NOT NULL,
  PRIMARY KEY ("identifier", "token")
);

-- Workspaces
CREATE TABLE "workspaces" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "api_key" varchar(64) UNIQUE NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Experiments
CREATE TABLE "experiments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspace_id" uuid NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "description" text,
  "status" experiment_status DEFAULT 'draft' NOT NULL,
  "goal_type" goal_type DEFAULT 'click' NOT NULL,
  "goal_selector" varchar(255),
  "traffic_allocation" integer DEFAULT 100 NOT NULL,
  "has_alert_sent" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "experiments_workspace_idx" ON "experiments"("workspace_id");
CREATE INDEX "experiments_status_idx" ON "experiments"("status");

-- Variants
CREATE TABLE "variants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "experiment_id" uuid NOT NULL REFERENCES "experiments"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "is_control" boolean DEFAULT false NOT NULL,
  "target_selector" varchar(255),
  "html_content" text,
  "css_override" text,
  "redirect_url" text,
  "weight" integer DEFAULT 50 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "variants_experiment_idx" ON "variants"("experiment_id");

-- Visitors
CREATE TABLE "visitors" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "experiment_id" uuid NOT NULL REFERENCES "experiments"("id") ON DELETE CASCADE,
  "variant_id" uuid NOT NULL REFERENCES "variants"("id") ON DELETE CASCADE,
  "visitor_hash" varchar(64) NOT NULL,
  "converted" boolean DEFAULT false NOT NULL,
  "converted_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "visitors_experiment_idx" ON "visitors"("experiment_id");
CREATE INDEX "visitors_variant_idx" ON "visitors"("variant_id");
CREATE UNIQUE INDEX "visitors_experiment_hash_idx" ON "visitors"("experiment_id", "visitor_hash");

-- Subscriptions
CREATE TABLE "subscriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "plan" plan DEFAULT 'free' NOT NULL,
  "experiment_limit" integer DEFAULT 3 NOT NULL,
  "stripe_customer_id" text,
  "stripe_subscription_id" text,
  "status" subscription_status DEFAULT 'active' NOT NULL,
  "current_period_end" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
