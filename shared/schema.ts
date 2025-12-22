import { pgTable, text, serial, integer, boolean, timestamp, numeric, jsonb, date, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export * from "./models/chat";

// === Places Table ===
export const places = pgTable("places", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  overview: text("overview"),
  address: text("address"),
  googleMapsUrl: text("google_maps_url"),
  distanceMiles: numeric("distance_miles"),
  driveTimeMinutes: integer("drive_time_minutes"),
  category: text("category"),
  subcategory: text("subcategory"),
  keyHighlights: text("key_highlights"),
  insiderTips: text("insider_tips"),
  entryFee: text("entry_fee"),
  averageSpend: integer("average_spend"),
  bestSeasons: text("best_seasons"),
  bestDay: text("best_day"),
  parkingInfo: text("parking_info"),
  evCharging: text("ev_charging"),
  googleRating: numeric("google_rating"),
  tripadvisorRating: numeric("tripadvisor_rating"),
  overallSentiment: text("overall_sentiment"),
  nearbyRestaurants: jsonb("nearby_restaurants").$type<Array<{name: string, description: string, distance?: string}>>().default([]),
  averageVisitDuration: text("average_visit_duration"),
  upcomingEvents: text("upcoming_events"),
  researchSources: text("research_sources"),
  visited: boolean("visited").default(false),
  visitedDate: date("visited_date"),
  userNotes: text("user_notes"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === Screenshots/Uploads Table ===
export const screenshots = pgTable("screenshots", {
  id: serial("id").primaryKey(),
  imageUrl: text("image_url"),
  imageData: text("image_data"), // Base64 if needed, but prefer URL
  processingStatus: text("processing_status").default('pending'), // pending, processing, completed, failed
  extractedData: jsonb("extracted_data").default({}),
  confidenceScore: numeric("confidence_score"),
  placeId: integer("place_id"), // Optional link to a created place
  createdAt: timestamp("created_at").defaultNow(),
});

// === User Preferences Table ===
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  homeAddress: text("home_address"),
  homeLatitude: numeric("home_latitude"),
  homeLongitude: numeric("home_longitude"),
  defaultMaxDistance: integer("default_max_distance").default(100),
  preferredCategories: jsonb("preferred_categories").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === Weekend Plans Table ===
export const weekendPlans = pgTable("weekend_plans", {
  id: serial("id").primaryKey(),
  planDate: date("plan_date").notNull(),
  places: jsonb("places").$type<Array<{placeId: number, time?: string, notes?: string}>>().default([]),
  notes: text("notes"),
  status: text("status").default('planned'), // planned, completed, cancelled
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === Schemas ===
export const insertPlaceSchema = createInsertSchema(places).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertScreenshotSchema = createInsertSchema(screenshots).omit({ 
  id: true, 
  createdAt: true 
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertWeekendPlanSchema = createInsertSchema(weekendPlans).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

// === Types ===
export type Place = typeof places.$inferSelect;
export type InsertPlace = z.infer<typeof insertPlaceSchema>;

export type Screenshot = typeof screenshots.$inferSelect;
export type InsertScreenshot = z.infer<typeof insertScreenshotSchema>;

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;

export type WeekendPlan = typeof weekendPlans.$inferSelect;
export type InsertWeekendPlan = z.infer<typeof insertWeekendPlanSchema>;

// === API Types ===
export type CreatePlaceRequest = InsertPlace;
export type UpdatePlaceRequest = Partial<InsertPlace>;

export type ImportDataResponse = {
  success: boolean;
  count: number;
  message?: string;
};

export type ExtractedPlace = Partial<InsertPlace>;
