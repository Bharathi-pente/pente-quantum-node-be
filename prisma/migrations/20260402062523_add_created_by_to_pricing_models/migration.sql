-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateTable
CREATE TABLE "alert_channel_map" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "alert_id" UUID NOT NULL,
    "channel_id" UUID NOT NULL,

    CONSTRAINT "alert_channel_map_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_channels" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "org_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "channel_type" VARCHAR(50) NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',

    CONSTRAINT "alert_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_history" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "alert_id" UUID NOT NULL,
    "channel_id" UUID,
    "triggered_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customer_id" UUID,
    "value_snapshot" VARCHAR(255),
    "delivery_status" VARCHAR(50),

    CONSTRAINT "alert_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "org_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "alert_type" VARCHAR(50) NOT NULL,
    "condition_expr" VARCHAR(500) NOT NULL,
    "threshold" DECIMAL(12,2),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "last_triggered_at" TIMESTAMP(6),
    "trigger_count" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anomalies" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "org_id" UUID NOT NULL,
    "anomaly_type" VARCHAR(50) NOT NULL,
    "severity" VARCHAR(20) NOT NULL,
    "customer_id" UUID,
    "metric_name" VARCHAR(255),
    "value_description" VARCHAR(500),
    "status" VARCHAR(20) NOT NULL DEFAULT 'new',
    "description" TEXT,
    "recommendation" TEXT,
    "detected_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anomalies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "org_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "key_prefix" VARCHAR(20) NOT NULL,
    "key_hash" VARCHAR(255) NOT NULL,
    "last4" VARCHAR(4) NOT NULL,
    "environment" VARCHAR(20) NOT NULL DEFAULT 'production',
    "scopes" JSONB DEFAULT '[]',
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "last_used_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "org_id" UUID NOT NULL,
    "actor" VARCHAR(255) NOT NULL,
    "actor_name" VARCHAR(255),
    "action" VARCHAR(100) NOT NULL,
    "resource_label" VARCHAR(255),
    "resource_id" UUID,
    "ip_address" INET,
    "user_agent" TEXT,
    "status" VARCHAR(20) NOT NULL,
    "details" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_reports" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "org_id" UUID NOT NULL,
    "framework" VARCHAR(50) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "last_audit_date" DATE,
    "next_audit_date" DATE,
    "findings_count" INTEGER DEFAULT 0,

    CONSTRAINT "compliance_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "customer_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "contract_type" VARCHAR(20) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "total_value" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "commit_amount" DECIMAL(12,2) DEFAULT 0,
    "used_amount" DECIMAL(12,2) DEFAULT 0,
    "remaining_amount" DECIMAL(12,2) DEFAULT 0,
    "rate_card_id" UUID,
    "auto_renew" BOOLEAN DEFAULT false,
    "payment_terms" VARCHAR(50) DEFAULT 'Net 30',
    "amendment_count" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_ledger" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "customer_id" UUID NOT NULL,
    "credit_id" UUID,
    "entry_date" DATE NOT NULL,
    "txn_type" VARCHAR(20) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "running_balance" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_notes" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "credit_note_number" VARCHAR(50) NOT NULL,
    "invoice_id" UUID,
    "customer_id" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reason" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "issue_date" DATE NOT NULL,
    "applied_date" DATE,

    CONSTRAINT "credit_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credits" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "customer_id" UUID NOT NULL,
    "credit_type" VARCHAR(20) NOT NULL,
    "original_amount" DECIMAL(12,2) NOT NULL,
    "remaining_amount" DECIMAL(12,2) NOT NULL,
    "used_amount" DECIMAL(12,2) DEFAULT 0,
    "expires_at" TIMESTAMP(6),
    "priority" INTEGER DEFAULT 0,
    "applicable_to" VARCHAR(255) DEFAULT 'all',
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "reason" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "org_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "product_id" UUID,
    "rate_card_override" UUID,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "mrr" DECIMAL(12,2) DEFAULT 0,
    "credit_balance" DECIMAL(12,2) DEFAULT 0,
    "health_score" INTEGER DEFAULT 100,
    "primary_contact" VARCHAR(255),
    "phone" VARCHAR(20),
    "billing_currency" VARCHAR(3) DEFAULT 'USD',
    "billing_cycle" VARCHAR(20) DEFAULT 'monthly',
    "logo_initials" VARCHAR(5),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_retention_policies" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "org_id" UUID NOT NULL,
    "data_type" VARCHAR(100) NOT NULL,
    "retention_period" VARCHAR(50) NOT NULL,
    "auto_delete" BOOLEAN DEFAULT false,
    "last_purge_at" TIMESTAMP(6),

    CONSTRAINT "data_retention_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discrepancies" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "org_id" UUID NOT NULL,
    "disc_type" VARCHAR(50) NOT NULL,
    "customer_id" UUID,
    "description" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending_review',
    "resolution" TEXT,
    "financial_impact" DECIMAL(12,2),
    "detected_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discrepancies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dunning_policies" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "org_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "is_default" BOOLEAN DEFAULT false,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "retry_schedule" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dunning_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dunning_steps" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "policy_id" UUID NOT NULL,
    "day_offset" INTEGER NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "template_name" VARCHAR(255),
    "subject" VARCHAR(500),
    "assignee" VARCHAR(255),
    "escalate_to" VARCHAR(255),
    "grace_period_days" INTEGER DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "dunning_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_templates" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "org_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "template_id" VARCHAR(100) NOT NULL,
    "subject" VARCHAR(500) NOT NULL,
    "html_content" TEXT NOT NULL,
    "text_content" TEXT,
    "variables" JSONB NOT NULL DEFAULT '[]',
    "used_in" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entitlement_grants" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "customer_id" UUID NOT NULL,
    "feature_id" UUID NOT NULL,
    "reason" TEXT,
    "expires_at" TIMESTAMP(6),
    "granted_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "granted_by" VARCHAR(255),

    CONSTRAINT "entitlement_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "features" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "org_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gdpr_requests" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "customer_id" UUID,
    "request_type" VARCHAR(50) NOT NULL,
    "customer_email" VARCHAR(255) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending_approval',
    "data_size" VARCHAR(50),
    "requested_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(6),

    CONSTRAINT "gdpr_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integrations" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "org_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'available',
    "config" JSONB DEFAULT '{}',
    "last_sync_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_line_items" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "invoice_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "meter_id" UUID,
    "quantity" BIGINT DEFAULT 0,
    "unit_price" DECIMAL(12,4) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "model_name" VARCHAR(100),
    "sort_order" INTEGER DEFAULT 0,

    CONSTRAINT "invoice_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "invoice_number" VARCHAR(50) NOT NULL,
    "customer_id" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "issue_date" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "paid_date" DATE,
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "credits_applied" DECIMAL(12,2) DEFAULT 0,
    "tax_amount" DECIMAL(12,2) DEFAULT 0,
    "tax_rate" DECIMAL(5,2) DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) DEFAULT 'USD',
    "payment_method_id" UUID,
    "notes" TEXT,
    "dunning_step" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "limit_overrides" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "customer_id" UUID NOT NULL,
    "meter_id" UUID NOT NULL,
    "original_limit" BIGINT NOT NULL,
    "new_limit" BIGINT NOT NULL,
    "reason" TEXT,
    "expires_at" TIMESTAMP(6),
    "created_by" VARCHAR(255),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "limit_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meters" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "org_id" UUID,
    "name" VARCHAR(255) NOT NULL,
    "event_type" VARCHAR(100) NOT NULL,
    "aggregation" VARCHAR(20) NOT NULL,
    "field" VARCHAR(100) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "migrations" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "org_id" UUID NOT NULL,
    "source_system" VARCHAR(255) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "record_counts" JSONB DEFAULT '{}',
    "error_count" INTEGER DEFAULT 0,
    "progress_pct" INTEGER DEFAULT 0,
    "started_at" TIMESTAMP(6),
    "completed_at" TIMESTAMP(6),

    CONSTRAINT "migrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "billing_email" VARCHAR(255) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "settings" JSONB DEFAULT '{}',
    "created_by" UUID,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "customer_id" UUID NOT NULL,
    "method_type" VARCHAR(20) NOT NULL,
    "brand" VARCHAR(50),
    "last4" VARCHAR(4),
    "exp_month" INTEGER,
    "exp_year" INTEGER,
    "bank_name" VARCHAR(255),
    "account_type" VARCHAR(50),
    "is_default" BOOLEAN DEFAULT false,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "billing_name" VARCHAR(255),
    "billing_address" JSONB,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "invoice_id" UUID,
    "customer_id" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) DEFAULT 'USD',
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "payment_method_id" UUID,
    "payment_date" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "failure_reason" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_payments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "org_id" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) DEFAULT 'USD',
    "payment_method" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "payment_date" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "failure_reason" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_payment_methods" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "org_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "details" JSONB NOT NULL DEFAULT '{}',
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_models" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "org_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "pricing_type" VARCHAR(20) NOT NULL,
    "meter_id" UUID,
    "unit_price" DECIMAL(12,4),
    "unit_label" VARCHAR(50),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pricing_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_test_variants" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "test_id" UUID NOT NULL,
    "variant_name" VARCHAR(100) NOT NULL,
    "price_label" VARCHAR(255),
    "customer_count" INTEGER DEFAULT 0,
    "revenue" DECIMAL(12,2) DEFAULT 0,
    "conversion_rate" DECIMAL(5,2) DEFAULT 0,

    CONSTRAINT "pricing_test_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_tests" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "org_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "start_date" DATE,
    "winner_variant" VARCHAR(100),
    "confidence_pct" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pricing_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_tiers" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "pricing_model_id" UUID NOT NULL,
    "from_qty" BIGINT NOT NULL,
    "to_qty" BIGINT,
    "price_per_unit" DECIMAL(12,4) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "pricing_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_features" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "product_id" UUID NOT NULL,
    "feature_id" UUID NOT NULL,

    CONSTRAINT "product_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "org_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "base_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "included_units" JSONB DEFAULT '{}',
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_card_rates" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "rate_card_id" UUID NOT NULL,
    "meter_id" UUID,
    "model_name" VARCHAR(100),
    "rate" DECIMAL(12,4) NOT NULL,
    "unit_label" VARCHAR(50),

    CONSTRAINT "rate_card_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_cards" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "org_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "effective_date" DATE NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limit_policies" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "product_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',

    CONSTRAINT "rate_limit_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limit_rules" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "policy_id" UUID NOT NULL,
    "endpoint" VARCHAR(255) NOT NULL,
    "requests_limit" INTEGER NOT NULL,
    "time_window" VARCHAR(10) NOT NULL,
    "burst_limit" INTEGER,

    CONSTRAINT "rate_limit_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendations" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "org_id" UUID NOT NULL,
    "rec_type" VARCHAR(50) NOT NULL,
    "customer_id" UUID,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "impact_description" VARCHAR(500),
    "confidence_pct" INTEGER,
    "priority" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'new',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "org_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "report_type" VARCHAR(50) NOT NULL,
    "schedule" VARCHAR(20) NOT NULL,
    "last_run_at" TIMESTAMP(6),
    "next_run_at" TIMESTAMP(6),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "recipients" JSONB NOT NULL DEFAULT '[]',
    "filters" JSONB DEFAULT '{}',
    "selected_metrics" JSONB DEFAULT '[]',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "role_id" UUID NOT NULL,
    "permission" VARCHAR(100) NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "org_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_exemptions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "org_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "certificate_id" VARCHAR(100),
    "expires_at" DATE,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tax_exemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_regions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "org_id" UUID NOT NULL,
    "country_code" VARCHAR(2) NOT NULL,
    "state_code" VARCHAR(10),
    "rate" DECIMAL(5,4) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "tax_type" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tax_regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_configs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "org_id" UUID NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "default_rate" DECIMAL(5,4),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "tax_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currency_configs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "org_id" UUID NOT NULL,
    "base_currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "supported_currencies" TEXT[] DEFAULT ARRAY['USD', 'EUR', 'GBP']::TEXT[],
    "exchange_rates" JSONB DEFAULT '{}',
    "auto_update_rates" BOOLEAN NOT NULL DEFAULT false,
    "last_updated" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "currency_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_limits" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "product_id" UUID NOT NULL,
    "meter_id" UUID NOT NULL,
    "limit_type" VARCHAR(20) NOT NULL,
    "limit_value" BIGINT NOT NULL,
    "period" VARCHAR(20) NOT NULL,
    "warning_threshold_pct" INTEGER DEFAULT 80,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',

    CONSTRAINT "usage_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "org_id" UUID,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "keycloak_user_id" UUID,
    "keycloak_roles" JSONB DEFAULT '[]',
    "role_id" UUID,
    "status" VARCHAR(20) NOT NULL DEFAULT 'invited',
    "avatar_initials" VARCHAR(5),
    "last_active_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_logs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "webhook_id" UUID NOT NULL,
    "event_type" VARCHAR(100) NOT NULL,
    "delivery_status" VARCHAR(20) NOT NULL,
    "response_code" INTEGER,
    "response_time_ms" INTEGER,
    "payload" JSONB,
    "error_message" TEXT,
    "retry_count" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhooks" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "org_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "url" VARCHAR(1000) NOT NULL,
    "subscribed_events" JSONB NOT NULL DEFAULT '[]',
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "success_rate" DECIMAL(5,2) DEFAULT 100.00,
    "last_triggered_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_events" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "org_id" UUID NOT NULL,
    "customer_id" UUID,
    "meter_id" UUID NOT NULL,
    "event_type" VARCHAR(100) NOT NULL,
    "event_value" DECIMAL(20,6) NOT NULL,
    "event_time" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "source" VARCHAR(100),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_alert_channel_map_alert_id" ON "alert_channel_map"("alert_id");

-- CreateIndex
CREATE INDEX "idx_alert_channel_map_channel_id" ON "alert_channel_map"("channel_id");

-- CreateIndex
CREATE UNIQUE INDEX "alert_channel_map_alert_id_channel_id_key" ON "alert_channel_map"("alert_id", "channel_id");

-- CreateIndex
CREATE INDEX "idx_alert_channels_channel_type" ON "alert_channels"("channel_type");

-- CreateIndex
CREATE INDEX "idx_alert_channels_org_id" ON "alert_channels"("org_id");

-- CreateIndex
CREATE INDEX "idx_alert_history_alert_id" ON "alert_history"("alert_id");

-- CreateIndex
CREATE INDEX "idx_alert_history_channel_id" ON "alert_history"("channel_id");

-- CreateIndex
CREATE INDEX "idx_alert_history_customer_id" ON "alert_history"("customer_id");

-- CreateIndex
CREATE INDEX "idx_alert_history_triggered_at" ON "alert_history"("triggered_at");

-- CreateIndex
CREATE INDEX "idx_alerts_alert_type" ON "alerts"("alert_type");

-- CreateIndex
CREATE INDEX "idx_alerts_org_id" ON "alerts"("org_id");

-- CreateIndex
CREATE INDEX "idx_alerts_status" ON "alerts"("status");

-- CreateIndex
CREATE INDEX "idx_anomalies_anomaly_type" ON "anomalies"("anomaly_type");

-- CreateIndex
CREATE INDEX "idx_anomalies_customer_id" ON "anomalies"("customer_id");

-- CreateIndex
CREATE INDEX "idx_anomalies_detected_at" ON "anomalies"("detected_at");

-- CreateIndex
CREATE INDEX "idx_anomalies_org_id" ON "anomalies"("org_id");

-- CreateIndex
CREATE INDEX "idx_anomalies_severity" ON "anomalies"("severity");

-- CreateIndex
CREATE INDEX "idx_anomalies_status" ON "anomalies"("status");

-- CreateIndex
CREATE INDEX "idx_api_keys_environment" ON "api_keys"("environment");

-- CreateIndex
CREATE INDEX "idx_api_keys_key_prefix" ON "api_keys"("key_prefix");

-- CreateIndex
CREATE INDEX "idx_api_keys_org_id" ON "api_keys"("org_id");

-- CreateIndex
CREATE INDEX "idx_api_keys_status" ON "api_keys"("status");

-- CreateIndex
CREATE INDEX "idx_audit_logs_action" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "idx_audit_logs_actor" ON "audit_logs"("actor");

-- CreateIndex
CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "idx_audit_logs_org_id" ON "audit_logs"("org_id");

-- CreateIndex
CREATE INDEX "idx_audit_logs_resource_id" ON "audit_logs"("resource_id");

-- CreateIndex
CREATE INDEX "idx_compliance_reports_framework" ON "compliance_reports"("framework");

-- CreateIndex
CREATE INDEX "idx_compliance_reports_org_id" ON "compliance_reports"("org_id");

-- CreateIndex
CREATE INDEX "idx_compliance_reports_status" ON "compliance_reports"("status");

-- CreateIndex
CREATE INDEX "idx_contracts_customer_id" ON "contracts"("customer_id");

-- CreateIndex
CREATE INDEX "idx_contracts_dates" ON "contracts"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "idx_contracts_rate_card_id" ON "contracts"("rate_card_id");

-- CreateIndex
CREATE INDEX "idx_contracts_status" ON "contracts"("status");

-- CreateIndex
CREATE INDEX "idx_credit_ledger_credit_id" ON "credit_ledger"("credit_id");

-- CreateIndex
CREATE INDEX "idx_credit_ledger_customer_id" ON "credit_ledger"("customer_id");

-- CreateIndex
CREATE INDEX "idx_credit_ledger_entry_date" ON "credit_ledger"("entry_date");

-- CreateIndex
CREATE INDEX "idx_credit_ledger_txn_type" ON "credit_ledger"("txn_type");

-- CreateIndex
CREATE UNIQUE INDEX "credit_notes_credit_note_number_key" ON "credit_notes"("credit_note_number");

-- CreateIndex
CREATE INDEX "idx_credit_notes_credit_note_number" ON "credit_notes"("credit_note_number");

-- CreateIndex
CREATE INDEX "idx_credit_notes_customer_id" ON "credit_notes"("customer_id");

-- CreateIndex
CREATE INDEX "idx_credit_notes_invoice_id" ON "credit_notes"("invoice_id");

-- CreateIndex
CREATE INDEX "idx_credit_notes_status" ON "credit_notes"("status");

-- CreateIndex
CREATE INDEX "idx_credits_customer_id" ON "credits"("customer_id");

-- CreateIndex
CREATE INDEX "idx_credits_expires_at" ON "credits"("expires_at");

-- CreateIndex
CREATE INDEX "idx_credits_priority" ON "credits"("priority");

-- CreateIndex
CREATE INDEX "idx_credits_status" ON "credits"("status");

-- CreateIndex
CREATE INDEX "idx_customers_email" ON "customers"("email");

-- CreateIndex
CREATE INDEX "idx_customers_org_id" ON "customers"("org_id");

-- CreateIndex
CREATE INDEX "idx_customers_product_id" ON "customers"("product_id");

-- CreateIndex
CREATE INDEX "idx_customers_rate_card_override" ON "customers"("rate_card_override");

-- CreateIndex
CREATE INDEX "idx_customers_status" ON "customers"("status");

-- CreateIndex
CREATE INDEX "idx_data_retention_policies_data_type" ON "data_retention_policies"("data_type");

-- CreateIndex
CREATE INDEX "idx_data_retention_policies_org_id" ON "data_retention_policies"("org_id");

-- CreateIndex
CREATE INDEX "idx_discrepancies_customer_id" ON "discrepancies"("customer_id");

-- CreateIndex
CREATE INDEX "idx_discrepancies_detected_at" ON "discrepancies"("detected_at");

-- CreateIndex
CREATE INDEX "idx_discrepancies_disc_type" ON "discrepancies"("disc_type");

-- CreateIndex
CREATE INDEX "idx_discrepancies_org_id" ON "discrepancies"("org_id");

-- CreateIndex
CREATE INDEX "idx_discrepancies_status" ON "discrepancies"("status");

-- CreateIndex
CREATE INDEX "idx_dunning_policies_org_id" ON "dunning_policies"("org_id");

-- CreateIndex
CREATE INDEX "idx_dunning_steps_policy_id" ON "dunning_steps"("policy_id");

-- CreateIndex
CREATE INDEX "idx_dunning_steps_sort_order" ON "dunning_steps"("sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_template_id_key" ON "email_templates"("template_id");

-- CreateIndex
CREATE INDEX "idx_email_templates_org_id" ON "email_templates"("org_id");

-- CreateIndex
CREATE INDEX "idx_email_templates_template_id" ON "email_templates"("template_id");

-- CreateIndex
CREATE INDEX "idx_entitlement_grants_customer_id" ON "entitlement_grants"("customer_id");

-- CreateIndex
CREATE INDEX "idx_entitlement_grants_expires_at" ON "entitlement_grants"("expires_at");

-- CreateIndex
CREATE INDEX "idx_entitlement_grants_feature_id" ON "entitlement_grants"("feature_id");

-- CreateIndex
CREATE INDEX "idx_features_category" ON "features"("category");

-- CreateIndex
CREATE INDEX "idx_features_org_id" ON "features"("org_id");

-- CreateIndex
CREATE INDEX "idx_features_status" ON "features"("status");

-- CreateIndex
CREATE UNIQUE INDEX "features_org_id_name_key" ON "features"("org_id", "name");

-- CreateIndex
CREATE INDEX "idx_gdpr_requests_customer_email" ON "gdpr_requests"("customer_email");

-- CreateIndex
CREATE INDEX "idx_gdpr_requests_customer_id" ON "gdpr_requests"("customer_id");

-- CreateIndex
CREATE INDEX "idx_gdpr_requests_request_type" ON "gdpr_requests"("request_type");

-- CreateIndex
CREATE INDEX "idx_gdpr_requests_status" ON "gdpr_requests"("status");

-- CreateIndex
CREATE INDEX "idx_integrations_category" ON "integrations"("category");

-- CreateIndex
CREATE INDEX "idx_integrations_org_id" ON "integrations"("org_id");

-- CreateIndex
CREATE INDEX "idx_integrations_status" ON "integrations"("status");

-- CreateIndex
CREATE INDEX "idx_invoice_line_items_invoice_id" ON "invoice_line_items"("invoice_id");

-- CreateIndex
CREATE INDEX "idx_invoice_line_items_meter_id" ON "invoice_line_items"("meter_id");

-- CreateIndex
CREATE INDEX "idx_invoice_line_items_sort_order" ON "invoice_line_items"("sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "idx_invoices_customer_id" ON "invoices"("customer_id");

-- CreateIndex
CREATE INDEX "idx_invoices_due_date" ON "invoices"("due_date");

-- CreateIndex
CREATE INDEX "idx_invoices_invoice_number" ON "invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "idx_invoices_issue_date" ON "invoices"("issue_date");

-- CreateIndex
CREATE INDEX "idx_invoices_payment_method_id" ON "invoices"("payment_method_id");

-- CreateIndex
CREATE INDEX "idx_invoices_status" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "idx_limit_overrides_customer_id" ON "limit_overrides"("customer_id");

-- CreateIndex
CREATE INDEX "idx_limit_overrides_expires_at" ON "limit_overrides"("expires_at");

-- CreateIndex
CREATE INDEX "idx_limit_overrides_meter_id" ON "limit_overrides"("meter_id");

-- CreateIndex
CREATE INDEX "idx_meters_event_type" ON "meters"("event_type");

-- CreateIndex
CREATE INDEX "idx_meters_org_id" ON "meters"("org_id");

-- CreateIndex
CREATE INDEX "idx_meters_status" ON "meters"("status");

-- CreateIndex
CREATE INDEX "idx_meters_created_by" ON "meters"("created_by");

-- CreateIndex
CREATE UNIQUE INDEX "meters_created_by_name_key" ON "meters"("created_by", "name");

-- CreateIndex
CREATE INDEX "idx_migrations_org_id" ON "migrations"("org_id");

-- CreateIndex
CREATE INDEX "idx_migrations_started_at" ON "migrations"("started_at");

-- CreateIndex
CREATE INDEX "idx_migrations_status" ON "migrations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "idx_organizations_slug" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "idx_organizations_status" ON "organizations"("status");

-- CreateIndex
CREATE INDEX "idx_payment_methods_customer_id" ON "payment_methods"("customer_id");

-- CreateIndex
CREATE INDEX "idx_payment_methods_status" ON "payment_methods"("status");

-- CreateIndex
CREATE INDEX "idx_payments_customer_id" ON "payments"("customer_id");

-- CreateIndex
CREATE INDEX "idx_payments_invoice_id" ON "payments"("invoice_id");

-- CreateIndex
CREATE INDEX "idx_payments_payment_date" ON "payments"("payment_date");

-- CreateIndex
CREATE INDEX "idx_payments_payment_method_id" ON "payments"("payment_method_id");

-- CreateIndex
CREATE INDEX "idx_payments_status" ON "payments"("status");

-- CreateIndex
CREATE INDEX "idx_org_payments_org_id" ON "org_payments"("org_id");

-- CreateIndex
CREATE INDEX "idx_org_payments_payment_date" ON "org_payments"("payment_date");

-- CreateIndex
CREATE INDEX "idx_org_payments_status" ON "org_payments"("status");

-- CreateIndex
CREATE INDEX "idx_org_payment_methods_org_id" ON "org_payment_methods"("org_id");

-- CreateIndex
CREATE INDEX "idx_org_payment_methods_status" ON "org_payment_methods"("status");

-- CreateIndex
CREATE INDEX "idx_pricing_models_meter_id" ON "pricing_models"("meter_id");

-- CreateIndex
CREATE INDEX "idx_pricing_models_org_id" ON "pricing_models"("org_id");

-- CreateIndex
CREATE INDEX "idx_pricing_models_status" ON "pricing_models"("status");

-- CreateIndex
CREATE INDEX "idx_pricing_models_name" ON "pricing_models"("name");

-- CreateIndex
CREATE INDEX "idx_pricing_models_unit_label" ON "pricing_models"("unit_label");

-- CreateIndex
CREATE INDEX "idx_pricing_models_created_by" ON "pricing_models"("created_by");

-- CreateIndex
CREATE INDEX "idx_pricing_test_variants_test_id" ON "pricing_test_variants"("test_id");

-- CreateIndex
CREATE INDEX "idx_pricing_tests_org_id" ON "pricing_tests"("org_id");

-- CreateIndex
CREATE INDEX "idx_pricing_tests_status" ON "pricing_tests"("status");

-- CreateIndex
CREATE INDEX "idx_pricing_tiers_pricing_model_id" ON "pricing_tiers"("pricing_model_id");

-- CreateIndex
CREATE INDEX "idx_pricing_tiers_sort_order" ON "pricing_tiers"("sort_order");

-- CreateIndex
CREATE INDEX "idx_product_features_feature_id" ON "product_features"("feature_id");

-- CreateIndex
CREATE INDEX "idx_product_features_product_id" ON "product_features"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_features_product_id_feature_id_key" ON "product_features"("product_id", "feature_id");

-- CreateIndex
CREATE INDEX "idx_products_org_id" ON "products"("org_id");

-- CreateIndex
CREATE INDEX "idx_products_status" ON "products"("status");

-- CreateIndex
CREATE UNIQUE INDEX "products_org_id_name_key" ON "products"("org_id", "name");

-- CreateIndex
CREATE INDEX "idx_rate_card_rates_meter_id" ON "rate_card_rates"("meter_id");

-- CreateIndex
CREATE INDEX "idx_rate_card_rates_model_name" ON "rate_card_rates"("model_name");

-- CreateIndex
CREATE INDEX "idx_rate_card_rates_rate_card_id" ON "rate_card_rates"("rate_card_id");

-- CreateIndex
CREATE INDEX "idx_rate_cards_effective_date" ON "rate_cards"("effective_date");

-- CreateIndex
CREATE INDEX "idx_rate_cards_org_id" ON "rate_cards"("org_id");

-- CreateIndex
CREATE INDEX "idx_rate_cards_status" ON "rate_cards"("status");

-- CreateIndex
CREATE UNIQUE INDEX "rate_cards_org_id_name_version_key" ON "rate_cards"("org_id", "name", "version");

-- CreateIndex
CREATE INDEX "idx_rate_limit_policies_product_id" ON "rate_limit_policies"("product_id");

-- CreateIndex
CREATE INDEX "idx_rate_limit_policies_status" ON "rate_limit_policies"("status");

-- CreateIndex
CREATE INDEX "idx_rate_limit_rules_endpoint" ON "rate_limit_rules"("endpoint");

-- CreateIndex
CREATE INDEX "idx_rate_limit_rules_policy_id" ON "rate_limit_rules"("policy_id");

-- CreateIndex
CREATE INDEX "idx_recommendations_customer_id" ON "recommendations"("customer_id");

-- CreateIndex
CREATE INDEX "idx_recommendations_org_id" ON "recommendations"("org_id");

-- CreateIndex
CREATE INDEX "idx_recommendations_priority" ON "recommendations"("priority");

-- CreateIndex
CREATE INDEX "idx_recommendations_rec_type" ON "recommendations"("rec_type");

-- CreateIndex
CREATE INDEX "idx_recommendations_status" ON "recommendations"("status");

-- CreateIndex
CREATE INDEX "idx_reports_next_run_at" ON "reports"("next_run_at");

-- CreateIndex
CREATE INDEX "idx_reports_org_id" ON "reports"("org_id");

-- CreateIndex
CREATE INDEX "idx_reports_report_type" ON "reports"("report_type");

-- CreateIndex
CREATE INDEX "idx_reports_status" ON "reports"("status");

-- CreateIndex
CREATE INDEX "idx_role_permissions_role_id" ON "role_permissions"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_permission_key" ON "role_permissions"("role_id", "permission");

-- CreateIndex
CREATE INDEX "idx_roles_org_id" ON "roles"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_org_id_name_key" ON "roles"("org_id", "name");

-- CreateIndex
CREATE INDEX "idx_tax_exemptions_customer_id" ON "tax_exemptions"("customer_id");

-- CreateIndex
CREATE INDEX "idx_tax_exemptions_org_id" ON "tax_exemptions"("org_id");

-- CreateIndex
CREATE INDEX "idx_tax_exemptions_expires_at" ON "tax_exemptions"("expires_at");

-- CreateIndex
CREATE INDEX "idx_tax_exemptions_status" ON "tax_exemptions"("status");

-- CreateIndex
CREATE INDEX "idx_tax_regions_country_state" ON "tax_regions"("country_code", "state_code");

-- CreateIndex
CREATE INDEX "idx_tax_regions_org_id" ON "tax_regions"("org_id");

-- CreateIndex
CREATE INDEX "idx_tax_regions_status" ON "tax_regions"("status");

-- CreateIndex
CREATE INDEX "idx_tax_configs_org_id" ON "tax_configs"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "tax_configs_org_id_key" ON "tax_configs"("org_id");

-- CreateIndex
CREATE INDEX "idx_currency_configs_org_id" ON "currency_configs"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "currency_configs_org_id_key" ON "currency_configs"("org_id");

-- CreateIndex
CREATE INDEX "idx_usage_limits_meter_id" ON "usage_limits"("meter_id");

-- CreateIndex
CREATE INDEX "idx_usage_limits_product_id" ON "usage_limits"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "usage_limits_product_id_meter_id_key" ON "usage_limits"("product_id", "meter_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_keycloak_user_id_key" ON "users"("keycloak_user_id");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_org_id" ON "users"("org_id");

-- CreateIndex
CREATE INDEX "idx_users_role_id" ON "users"("role_id");

-- CreateIndex
CREATE INDEX "idx_users_status" ON "users"("status");

-- CreateIndex
CREATE INDEX "idx_users_keycloak_id" ON "users"("keycloak_user_id");

-- CreateIndex
CREATE INDEX "idx_webhook_logs_created_at" ON "webhook_logs"("created_at");

-- CreateIndex
CREATE INDEX "idx_webhook_logs_delivery_status" ON "webhook_logs"("delivery_status");

-- CreateIndex
CREATE INDEX "idx_webhook_logs_event_type" ON "webhook_logs"("event_type");

-- CreateIndex
CREATE INDEX "idx_webhook_logs_webhook_id" ON "webhook_logs"("webhook_id");

-- CreateIndex
CREATE INDEX "idx_webhooks_org_id" ON "webhooks"("org_id");

-- CreateIndex
CREATE INDEX "idx_webhooks_status" ON "webhooks"("status");

-- CreateIndex
CREATE INDEX "idx_usage_events_customer_id" ON "usage_events"("customer_id");

-- CreateIndex
CREATE INDEX "idx_usage_events_event_time" ON "usage_events"("event_time");

-- CreateIndex
CREATE INDEX "idx_usage_events_event_type" ON "usage_events"("event_type");

-- CreateIndex
CREATE INDEX "idx_usage_events_meter_id" ON "usage_events"("meter_id");

-- CreateIndex
CREATE INDEX "idx_usage_events_org_id" ON "usage_events"("org_id");

-- AddForeignKey
ALTER TABLE "alert_channel_map" ADD CONSTRAINT "alert_channel_map_alert_id_fkey" FOREIGN KEY ("alert_id") REFERENCES "alerts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alert_channel_map" ADD CONSTRAINT "alert_channel_map_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "alert_channels"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alert_channels" ADD CONSTRAINT "alert_channels_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alert_history" ADD CONSTRAINT "alert_history_alert_id_fkey" FOREIGN KEY ("alert_id") REFERENCES "alerts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alert_history" ADD CONSTRAINT "alert_history_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "alert_channels"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alert_history" ADD CONSTRAINT "alert_history_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "anomalies" ADD CONSTRAINT "anomalies_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "anomalies" ADD CONSTRAINT "anomalies_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "compliance_reports" ADD CONSTRAINT "compliance_reports_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_rate_card_id_fkey" FOREIGN KEY ("rate_card_id") REFERENCES "rate_cards"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "credit_ledger" ADD CONSTRAINT "credit_ledger_credit_id_fkey" FOREIGN KEY ("credit_id") REFERENCES "credits"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "credit_ledger" ADD CONSTRAINT "credit_ledger_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "credits" ADD CONSTRAINT "credits_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_rate_card_override_fkey" FOREIGN KEY ("rate_card_override") REFERENCES "rate_cards"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "data_retention_policies" ADD CONSTRAINT "data_retention_policies_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "discrepancies" ADD CONSTRAINT "discrepancies_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "discrepancies" ADD CONSTRAINT "discrepancies_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dunning_policies" ADD CONSTRAINT "dunning_policies_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dunning_steps" ADD CONSTRAINT "dunning_steps_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "dunning_policies"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "entitlement_grants" ADD CONSTRAINT "entitlement_grants_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "entitlement_grants" ADD CONSTRAINT "entitlement_grants_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "features" ADD CONSTRAINT "features_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "gdpr_requests" ADD CONSTRAINT "gdpr_requests_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_meter_id_fkey" FOREIGN KEY ("meter_id") REFERENCES "meters"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "limit_overrides" ADD CONSTRAINT "limit_overrides_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "limit_overrides" ADD CONSTRAINT "limit_overrides_meter_id_fkey" FOREIGN KEY ("meter_id") REFERENCES "meters"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "meters" ADD CONSTRAINT "meters_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "meters" ADD CONSTRAINT "meters_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "migrations" ADD CONSTRAINT "migrations_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "org_payments" ADD CONSTRAINT "org_payments_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "org_payment_methods" ADD CONSTRAINT "org_payment_methods_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pricing_models" ADD CONSTRAINT "pricing_models_meter_id_fkey" FOREIGN KEY ("meter_id") REFERENCES "meters"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pricing_models" ADD CONSTRAINT "pricing_models_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pricing_models" ADD CONSTRAINT "pricing_models_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_test_variants" ADD CONSTRAINT "pricing_test_variants_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "pricing_tests"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pricing_tests" ADD CONSTRAINT "pricing_tests_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pricing_tiers" ADD CONSTRAINT "pricing_tiers_pricing_model_id_fkey" FOREIGN KEY ("pricing_model_id") REFERENCES "pricing_models"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_features" ADD CONSTRAINT "product_features_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_features" ADD CONSTRAINT "product_features_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rate_card_rates" ADD CONSTRAINT "rate_card_rates_meter_id_fkey" FOREIGN KEY ("meter_id") REFERENCES "meters"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rate_card_rates" ADD CONSTRAINT "rate_card_rates_rate_card_id_fkey" FOREIGN KEY ("rate_card_id") REFERENCES "rate_cards"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rate_cards" ADD CONSTRAINT "rate_cards_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rate_limit_policies" ADD CONSTRAINT "rate_limit_policies_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rate_limit_rules" ADD CONSTRAINT "rate_limit_rules_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "rate_limit_policies"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tax_exemptions" ADD CONSTRAINT "tax_exemptions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tax_exemptions" ADD CONSTRAINT "tax_exemptions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tax_regions" ADD CONSTRAINT "tax_regions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tax_configs" ADD CONSTRAINT "tax_configs_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "currency_configs" ADD CONSTRAINT "currency_configs_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "usage_limits" ADD CONSTRAINT "usage_limits_meter_id_fkey" FOREIGN KEY ("meter_id") REFERENCES "meters"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "usage_limits" ADD CONSTRAINT "usage_limits_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "webhook_logs" ADD CONSTRAINT "webhook_logs_webhook_id_fkey" FOREIGN KEY ("webhook_id") REFERENCES "webhooks"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_meter_id_fkey" FOREIGN KEY ("meter_id") REFERENCES "meters"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
