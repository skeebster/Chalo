import { db } from "./db";
import {
  places, screenshots, userPreferences, weekendPlans,
  type Place, type InsertPlace, type UpdatePlaceRequest,
  type Screenshot, type InsertScreenshot,
  type UserPreferences, type InsertUserPreferences,
  type WeekendPlan, type InsertWeekendPlan,
  insertUserPreferencesSchema
} from "@shared/schema";
import { eq, desc, ilike, or, and } from "drizzle-orm";

export interface IStorage {
  // Places
  getPlaces(search?: string, category?: string, sort?: string): Promise<Place[]>;
  getPlace(id: number): Promise<Place | undefined>;
  createPlace(place: InsertPlace): Promise<Place>;
  updatePlace(id: number, updates: UpdatePlaceRequest): Promise<Place>;
  deletePlace(id: number): Promise<void>;
  
  // Screenshots
  createScreenshot(screenshot: InsertScreenshot): Promise<Screenshot>;
  getScreenshot(id: number): Promise<Screenshot | undefined>;
  updateScreenshotStatus(id: number, status: string, extractedData?: any): Promise<Screenshot>;

  // Weekend Plans
  getPlans(): Promise<WeekendPlan[]>;
  createPlan(plan: InsertWeekendPlan): Promise<WeekendPlan>;
  updatePlan(id: number, updates: Partial<InsertWeekendPlan>): Promise<WeekendPlan>;
  deletePlan(id: number): Promise<void>;

  // Preferences
  getPreferences(): Promise<UserPreferences | undefined>;
  updatePreferences(prefs: InsertUserPreferences): Promise<UserPreferences>;
}

export class DatabaseStorage implements IStorage {
  // === Places ===
  async getPlaces(search?: string, category?: string, sort?: string): Promise<Place[]> {
    let query = db.select().from(places);
    
    // Apply filters
    const conditions = [];
    if (search) {
      const searchLower = `%${search.toLowerCase()}%`;
      conditions.push(
        or(
          ilike(places.name, searchLower),
          ilike(places.overview, searchLower),
          ilike(places.category, searchLower),
          ilike(places.subcategory, searchLower)
        )
      );
    }
    
    if (category && category !== 'all') {
      conditions.push(ilike(places.category, category));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    // Apply sorting
    if (sort === 'distance') {
      query = query.orderBy(places.distanceMiles);
    } else if (sort === 'rating') {
      query = query.orderBy(desc(places.googleRating));
    } else {
      query = query.orderBy(desc(places.createdAt));
    }

    return await query;
  }

  async getPlace(id: number): Promise<Place | undefined> {
    const [place] = await db.select().from(places).where(eq(places.id, id));
    return place;
  }

  async createPlace(place: InsertPlace): Promise<Place> {
    const [newPlace] = await db.insert(places).values(place).returning();
    return newPlace;
  }

  async updatePlace(id: number, updates: UpdatePlaceRequest): Promise<Place> {
    const [updated] = await db.update(places)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(places.id, id))
      .returning();
    return updated;
  }

  async deletePlace(id: number): Promise<void> {
    await db.delete(places).where(eq(places.id, id));
  }

  // === Screenshots ===
  async createScreenshot(screenshot: InsertScreenshot): Promise<Screenshot> {
    const [newScreenshot] = await db.insert(screenshots).values(screenshot).returning();
    return newScreenshot;
  }

  async getScreenshot(id: number): Promise<Screenshot | undefined> {
    const [screenshot] = await db.select().from(screenshots).where(eq(screenshots.id, id));
    return screenshot;
  }

  async updateScreenshotStatus(id: number, status: string, extractedData?: any): Promise<Screenshot> {
    const updates: any = { processingStatus: status };
    if (extractedData) {
      updates.extractedData = extractedData;
    }
    const [updated] = await db.update(screenshots)
      .set(updates)
      .where(eq(screenshots.id, id))
      .returning();
    return updated;
  }

  // === Weekend Plans ===
  async getPlans(): Promise<WeekendPlan[]> {
    return await db.select().from(weekendPlans).orderBy(desc(weekendPlans.planDate));
  }

  async createPlan(plan: InsertWeekendPlan): Promise<WeekendPlan> {
    const [newPlan] = await db.insert(weekendPlans).values(plan).returning();
    return newPlan;
  }

  async updatePlan(id: number, updates: Partial<InsertWeekendPlan>): Promise<WeekendPlan> {
    const [updated] = await db.update(weekendPlans)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(weekendPlans.id, id))
      .returning();
    return updated;
  }

  async deletePlan(id: number): Promise<void> {
    await db.delete(weekendPlans).where(eq(weekendPlans.id, id));
  }

  // === Preferences ===
  async getPreferences(): Promise<UserPreferences | undefined> {
    const [prefs] = await db.select().from(userPreferences).limit(1);
    return prefs;
  }

  async updatePreferences(prefs: InsertUserPreferences): Promise<UserPreferences> {
    const existing = await this.getPreferences();
    if (existing) {
      const [updated] = await db.update(userPreferences)
        .set({ ...prefs, updatedAt: new Date() })
        .where(eq(userPreferences.id, existing.id))
        .returning();
      return updated;
    } else {
      const [newPrefs] = await db.insert(userPreferences).values(prefs).returning();
      return newPrefs;
    }
  }
}

export const storage = new DatabaseStorage();
