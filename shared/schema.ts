import { sql } from "drizzle-orm";
import { pgTable, text, varchar, doublePrecision, bigint, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Origin Raw Table
export const originRaw = pgTable("origin_raw", {
  Customer: text("Customer"),
  Customer_Number: text("Customer_Number"),
  Customer_Name: text("Customer_Name"),
  Tenant_ID: text("Tenant_ID"),
  Tenant_URL: text("Tenant_URL"),
  Country_Name: text("Country_Name"),
  Latest_updated_date: text("Latest_updated_date"),
  Active_Farmers: doublePrecision("Active_Farmers"),
  Inactive_Farmers: doublePrecision("Inactive_Farmers"),
  Mapped_Fields: doublePrecision("Mapped_Fields"),
  Unmapped_Fields: doublePrecision("Unmapped_Fields"),
  Harvest_Bags: doublePrecision("Harvest_Bags"),
  Purchased_Bags: doublePrecision("Purchased_Bags"),
  Trainings: doublePrecision("Trainings"),
  Survey_Responses: doublePrecision("Survey_Responses"),
  Web_Allowed_Users: doublePrecision("Web_Allowed_Users"),
  Web_Active_Users: doublePrecision("Web_Active_Users"),
  Web_Billable_Users: doublePrecision("Web_Billable_Users"),
  Web_Not_Billed_Users: doublePrecision("Web_Not_Billed_Users"),
  Mobile_Allowed_Devices: doublePrecision("Mobile_Allowed_Devices"),
  Mobile_Devices_with_linked_staff: doublePrecision("Mobile_Devices_with_linked_staff"),
  Mobile_Devices_with_no_staff: doublePrecision("Mobile_Devices_with_no_staff"),
  Mobile_Billable_Users: doublePrecision("Mobile_Billable_Users"),
  Mobile_Not_Billed_Users: doublePrecision("Mobile_Not_Billed_Users"),
  summary_period: date("summary_period"),
});

// Orbit Raw Table
export const orbitRaw = pgTable("orbit_raw", {
  Customer_Name: text("Customer_Name"),
  Tenant_URL: text("Tenant_URL"),
  Origin_Tenants: bigint("Origin_Tenants", { mode: "number" }),
  Total_Farmers: bigint("Total_Farmers", { mode: "number" }),
  Total_Fields: bigint("Total_Fields", { mode: "number" }),
  Total_Web_Users: bigint("Total_Web_Users", { mode: "number" }),
  Total_Billable_Web_Users: bigint("Total_Billable_Web_Users", { mode: "number" }),
  Total_Web_Users_Logged_in_The_Past_3_Months: bigint("Total_Web_Users_Logged_in_The_Past_3_Months", { mode: "number" }),
  Total_Mobile_Users: bigint("Total_Mobile_Users", { mode: "number" }),
  Total_Billable_Mobile_Users: bigint("Total_Billable_Mobile_Users", { mode: "number" }),
  Total_Mobile_Users_Logged_in_The_Past_3_Months: bigint("Total_Mobile_Users_Logged_in_The_Past_3_Months", { mode: "number" }),
  Survey_Reponses: bigint("Survey_Reponses", { mode: "number" }),
  Trainings: bigint("Trainings", { mode: "number" }),
  summary_period: date("summary_period"),
});

export type OriginRaw = typeof originRaw.$inferSelect;
export type OrbitRaw = typeof orbitRaw.$inferSelect;
