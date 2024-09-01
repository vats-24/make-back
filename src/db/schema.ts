import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
  real,
  integer,
  json,
  date,
  pgEnum,
} from "drizzle-orm/pg-core"; 
// import { rolesEnum } from "../constants/db";
// import { statusEnum } from "../constants/db";
// import { serviceEnum } from "../constants/db";

const rolesEnum = pgEnum("roles", ["admin", "expert", "user"]);

const statusEnum = pgEnum("status", ["scheduled", "rescheduled", "completed"]);

const serviceEnum = pgEnum("service", [
  "1:1 Call",
  "Priority DM",
  "Webinar",
  "Subscription",
  "Digital Product",
]);
 
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  googleId: varchar("googleId", { length: 256 }),
  firstName: varchar("firstName", { length: 256 }),
  lastName: varchar("lastName", { length: 256 }),
  phoneNumber: text("phoneNumber"),
  profileName: varchar("profileName", { length: 256 }),
  socialAccount: varchar("socialAccount", { length: 256 }),
  name: varchar("name", { length: 256 }).notNull(),
  email: varchar("email", { length: 256 }).notNull(),
  password: varchar("password", { length: 256 }),
  role: rolesEnum("role").notNull(),
  profilePhoto: varchar("profilePhoto", {length: 256}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const experts = pgTable("experts", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  userId: uuid("userId")
    .references(() => users.id)
    .notNull(),
  expertise: text("expertise").array().$type<Array<string>>(),
  ratings: real("ratings").default(0.0),
  reviews: integer("reviews").default(0),
  availability: json("availability")
    .$type<
      Array<{
        [x: string]: any;
        day: number;
        slots: string[];
      }>
    >()
    .default([]),
  upiId: varchar("upiID", { length: 256 }),
});

export const forgotPassword = pgTable("forgotPasswords", {
  id: uuid("forgotPassword").primaryKey().defaultRandom().notNull(),
  userId: uuid("userId")
    .references(() => users.id)
    .notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const appointments = pgTable("appointments", {
  id: uuid("appointmentId").primaryKey().defaultRandom().notNull(),
  userId: uuid("userID")
    .references(() => users.id)
    .notNull(),
  expertId: uuid("expertId")
    .references(() => experts.id)
    .notNull(),
  serviceId: uuid("serviceId")
    .references(() => services.id)
    .notNull(),
  date: date("date").defaultNow().notNull(),
  startTime: varchar("startTime"),
  endTime: varchar("endTime"),
  amount: real("amount"),
  paymentStatus: varchar("paymentStatus"),
  status: statusEnum("status").notNull(),
  reschedulePolicy: json("reschedule_policy").default({
    howToReschedule: "requestReschedule",
    minimumNotice: "30mins",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const services = pgTable("services", {
  id: uuid("serviceId").primaryKey().defaultRandom().notNull(),
  expertId: uuid("expertId")
    .references(() => experts.id)
    .notNull(),
  type: serviceEnum("type").default("1:1 Call"),
  title: varchar("title", { length: 256 }).notNull(),
  shortDescription: varchar("shortDescription", { length: 256 }),
  description: varchar("description", { length: 256 }),
  duration: real("duration").notNull(),
  amount: real("amount").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/*
export const expertSchedule = pgTable("expertSchedule", {
	id: uuid("expertSchedule").primaryKey().defaultRandom().notNull(),
	expertId: uuid("expertId")
		.references(() => experts.id) 
		.notNull(),
	day: integer("day").notNull(),
	startTime: varchar("startTime").notNull(),
	endTime: varchar("endTime").notNull(),
	timeSlots: varchar("timeSlot").array().$type<Array<string>>(),
});
*/

export const reschedule = pgTable("reschedules", {
  id: uuid("rescheduleId").primaryKey().defaultRandom().notNull(),
  appointmentId: uuid("appointmentId")
    .references(() => appointments.id)
    .notNull(),
  requestedBy: varchar("requested_by", { length: 50 }).notNull(),
  requestedAt: timestamp("requested_at", { withTimezone: true }).notNull(),
  originalStartTime: timestamp("original_start_time", {
    withTimezone: true,
  }).notNull(),
  originalEndTime: timestamp("original_end_time", {
    withTimezone: true,
  }).notNull(),
  newStartTime: timestamp("new_start_time", { withTimezone: true }),
  newEndTime: timestamp("new_end_time", { withTimezone: true }),
  status: varchar("status", { length: 50 }).notNull(),
  reason: text("reason"),
});

export const reviews = pgTable("reviews", {
  id: uuid("reviewId").primaryKey().defaultRandom().notNull(),
  expertId: uuid("expertId").references(() => experts.id),
  userId: uuid("userId").references(() => users.id),
  description: varchar("description", { length: 256 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/*
export const payment = pgTable("payment", {
	id: uuid("paymentId").primaryKey().defaultRandom().notNull(),
	appointmentId: uuid("appointmentId").references(()=> appointments.id).notNull(),
	amount: real("amount").notNull(),
	gst: real("gst").notNull()
})
*/
