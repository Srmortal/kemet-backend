-- CreateTable
CREATE TABLE "events" (
    "id" BIGSERIAL NOT NULL,
    "event_name" TEXT NOT NULL,
    "user_id" TEXT,
    "anonymous_id" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "platform" TEXT,
    "app_version" TEXT,
    "device_model" TEXT,
    "os_version" TEXT,
    "properties" JSONB,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users_analytics" (
    "user_id" TEXT NOT NULL,
    "first_seen_at" TIMESTAMP(3),
    "last_seen_at" TIMESTAMP(3),
    "signup_platform" TEXT,
    "country" TEXT,
    "properties" JSONB,

    CONSTRAINT "users_analytics_pkey" PRIMARY KEY ("user_id")
);
