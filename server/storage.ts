import { db } from "./db";
import {
  places, screenshots, userPreferences, weekendPlans, favorites,
  type Place, type InsertPlace, type UpdatePlaceRequest,
  type Screenshot, type InsertScreenshot,
  type UserPreferences, type InsertUserPreferences,
  type WeekendPlan, type InsertWeekendPlan,
  type Favorite, type InsertFavorite,
  insertUserPreferencesSchema
} from "@shared/schema";
import { eq, desc, ilike, or, and, inArray, lte, gte, sql } from "drizzle-orm";

export interface PlaceFilterOptions {
  search?: string;
  category?: string;
  sort?: string;
  kidFriendly?: boolean;
  indoorOutdoor?: 'indoor' | 'outdoor' | 'all';
  maxDistance?: number;
  minRating?: number;
  wheelchairAccessible?: boolean;
  favoriteIds?: number[];
}

export interface IStorage {
  // Places
  getPlaces(filters?: PlaceFilterOptions): Promise<Place[]>;
  getPlace(id: number): Promise<Place | undefined>;
  findPlaceByName(name: string): Promise<Place | undefined>;
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

  // Favorites
  getFavorites(): Promise<number[]>;
  addFavorite(placeId: number): Promise<Favorite>;
  removeFavorite(placeId: number): Promise<void>;
  isFavorite(placeId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // === Places ===
  async getPlaces(filters?: PlaceFilterOptions): Promise<Place[]> {
    let query = db.select().from(places);
    
    // Apply filters
    const conditions = [];
    if (filters?.search) {
      const searchLower = `%${filters.search.toLowerCase()}%`;
      conditions.push(
        or(
          ilike(places.name, searchLower),
          ilike(places.overview, searchLower),
          ilike(places.category, searchLower),
          ilike(places.subcategory, searchLower)
        )
      );
    }
    
    if (filters?.category && filters.category !== 'all') {
      conditions.push(ilike(places.category, filters.category));
    }

    if (filters?.kidFriendly) {
      conditions.push(eq(places.kidFriendly, true));
    }

    if (filters?.indoorOutdoor && filters.indoorOutdoor !== 'all') {
      // Include "both" when filtering for indoor or outdoor
      conditions.push(
        or(
          eq(places.indoorOutdoor, filters.indoorOutdoor),
          eq(places.indoorOutdoor, 'both')
        )
      );
    }

    if (filters?.maxDistance) {
      conditions.push(lte(places.distanceMiles, filters.maxDistance));
    }

    if (filters?.minRating) {
      conditions.push(gte(places.googleRating, filters.minRating.toString()));
    }

    if (filters?.wheelchairAccessible) {
      conditions.push(eq(places.wheelchairAccessible, true));
    }

    if (filters?.favoriteIds && filters.favoriteIds.length > 0) {
      conditions.push(inArray(places.id, filters.favoriteIds));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    // Apply sorting
    if (filters?.sort === 'distance') {
      query = query.orderBy(places.distanceMiles);
    } else if (filters?.sort === 'rating') {
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

  async findPlaceByName(name: string): Promise<Place | undefined> {
    // Use case-insensitive search to find duplicates
    const [place] = await db.select().from(places).where(
      ilike(places.name, name.trim())
    );
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

  // === Favorites ===
  async getFavorites(): Promise<number[]> {
    const favs = await db.select().from(favorites);
    return favs.map(f => f.placeId);
  }

  async addFavorite(placeId: number): Promise<Favorite> {
    const existing = await db.select().from(favorites).where(eq(favorites.placeId, placeId));
    if (existing.length > 0) {
      return existing[0];
    }
    const [newFav] = await db.insert(favorites).values({ placeId }).returning();
    return newFav;
  }

  async removeFavorite(placeId: number): Promise<void> {
    await db.delete(favorites).where(eq(favorites.placeId, placeId));
  }

  async isFavorite(placeId: number): Promise<boolean> {
    const [fav] = await db.select().from(favorites).where(eq(favorites.placeId, placeId));
    return !!fav;
  }
}

export const storage = new DatabaseStorage();
