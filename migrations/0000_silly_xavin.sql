CREATE TABLE IF NOT EXISTS "appointments" (
	"appointmentId" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userID" uuid NOT NULL,
	"expertId" uuid NOT NULL,
	"serviceId" uuid NOT NULL,
	"date" date DEFAULT now() NOT NULL,
	"startTime" varchar,
	"endTime" varchar,
	"amount" real,
	"paymentStatus" varchar,
	"status" status NOT NULL,
	"reschedule_policy" json DEFAULT '{"howToReschedule":"requestReschedule","minimumNotice":"30mins"}'::json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "experts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"expertise" text[],
	"ratings" real DEFAULT 0,
	"reviews" integer DEFAULT 0,
	"availability" json DEFAULT '[]'::json,
	"upiID" varchar(256)
);

CREATE TABLE IF NOT EXISTS "forgotPasswords" (
	"forgotPassword" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "reschedules" (
	"rescheduleId" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appointmentId" uuid NOT NULL,
	"requested_by" varchar(50) NOT NULL,
	"requested_at" timestamp with time zone NOT NULL,
	"original_start_time" timestamp with time zone NOT NULL,
	"original_end_time" timestamp with time zone NOT NULL,
	"new_start_time" timestamp with time zone,
	"new_end_time" timestamp with time zone,
	"status" varchar(50) NOT NULL,
	"reason" text
);

CREATE TABLE IF NOT EXISTS "reviews" (
	"reviewId" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expertId" uuid,
	"userId" uuid,
	"description" varchar(256) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "services" (
	"serviceId" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expertId" uuid NOT NULL,
	"type" service DEFAULT '1:1 Call',
	"title" varchar(256) NOT NULL,
	"shortDescription" varchar(256),
	"description" varchar(256),
	"duration" real NOT NULL,
	"amount" real DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"googleId" varchar(256),
	"firstName" varchar(256),
	"lastName" varchar(256),
	"phoneNumber" text,
	"profileName" varchar(256),
	"socialAccount" varchar(256),
	"name" varchar(256) NOT NULL,
	"email" varchar(256) NOT NULL,
	"password" varchar(256),
	"role" role NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "appointments" ADD CONSTRAINT "appointments_userID_users_id_fk" FOREIGN KEY ("userID") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "appointments" ADD CONSTRAINT "appointments_expertId_experts_id_fk" FOREIGN KEY ("expertId") REFERENCES "experts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "appointments" ADD CONSTRAINT "appointments_serviceId_services_serviceId_fk" FOREIGN KEY ("serviceId") REFERENCES "services"("serviceId") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "experts" ADD CONSTRAINT "experts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "forgotPasswords" ADD CONSTRAINT "forgotPasswords_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "reschedules" ADD CONSTRAINT "reschedules_appointmentId_appointments_appointmentId_fk" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("appointmentId") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "reviews" ADD CONSTRAINT "reviews_expertId_experts_id_fk" FOREIGN KEY ("expertId") REFERENCES "experts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "services" ADD CONSTRAINT "services_expertId_experts_id_fk" FOREIGN KEY ("expertId") REFERENCES "experts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
