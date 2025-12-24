import { pgTable, text, serial, integer, boolean, timestamp, numeric, jsonb, date, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export * from "./models/chat";

// === Restaurant Type ===
export interface NearbyRestaurant {
  name: string;
  description?: string;
  distance?: string;
  cuisine?: string;
  priceRange?: string; // $, $$, $$$, $$$$
  rating?: number;
  specialFeatures?: string[];
}

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
  bestTimeOfDay: text("best_time_of_day"),
  parkingInfo: text("parking_info"),
  evCharging: text("ev_charging"),
  googleRating: numeric("google_rating"),
  tripadvisorRating: numeric("tripadvisor_rating"),
  overallSentiment: text("overall_sentiment"),
  nearbyRestaurants: jsonb("nearby_restaurants").$type<NearbyRestaurant[]>().default([]),
  averageVisitDuration: text("average_visit_duration"),
  upcomingEvents: text("upcoming_events"),
  researchSources: text("research_sources"),
  // Public transit
  publicTransit: text("public_transit"),
  // AllTrails integration for nature places
  alltrailsUrl: text("alltrails_url"),
  recommendedTrails: jsonb("recommended_trails").$type<Array<{name: string, rating: number, difficulty: string, length: string, url: string}>>().default([]),
  // Tags for filtering
  kidFriendly: boolean("kid_friendly").default(true),
  indoorOutdoor: text("indoor_outdoor"), // 'indoor', 'outdoor', 'both'
  // Location coordinates for weather
  latitude: numeric("latitude"),
  longitude: numeric("longitude"),
  // User data
  visited: boolean("visited").default(false),
  visitedDate: date("visited_date"),
  userNotes: text("user_notes"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === Favorites Table ===
export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  placeId: integer("place_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
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
  shareCode: text("share_code"), // Unique code for public sharing
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === Trip Itinerary Activity Type ===
export interface ItineraryActivity {
  id: string;
  time: string; // "9:00 AM"
  endTime?: string; // "11:00 AM"
  type: 'arrival' | 'activity' | 'meal' | 'drive' | 'tip' | 'departure';
  title: string;
  description?: string;
  placeId?: number;
  placeName?: string;
  duration?: number; // minutes
  insiderTip?: string;
  icon?: string;
}

// === Trip Itineraries Table ===
export const tripItineraries = pgTable("trip_itineraries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  tripDate: date("trip_date").notNull(),
  placeIds: jsonb("place_ids").$type<number[]>().default([]),
  schedule: jsonb("schedule").$type<ItineraryActivity[]>().default([]),
  startTime: text("start_time").default("9:00 AM"),
  endTime: text("end_time").default("6:00 PM"),
  totalDriveTime: integer("total_drive_time"), // minutes
  optimizationNotes: text("optimization_notes"),
  status: text("status").default('draft'), // draft, optimized, saved
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

export const insertFavoriteSchema = createInsertSchema(favorites).omit({ 
  id: true, 
  createdAt: true 
});

export const insertTripItinerarySchema = createInsertSchema(tripItineraries).omit({ 
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

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;

export type TripItinerary = typeof tripItineraries.$inferSelect;
export type InsertTripItinerary = z.infer<typeof insertTripItinerarySchema>;

// === API Types ===
export type CreatePlaceRequest = InsertPlace;
export type UpdatePlaceRequest = Partial<InsertPlace>;

export type ImportDataResponse = {
  success: boolean;
  count: number;
  message?: string;
};

export type ExtractedPlace = Partial<InsertPlace>;
