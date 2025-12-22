import { z } from "zod";

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export const GoogleReviewSchema = z.object({
  author_name: z.string(),
  rating: z.number(),
  relative_time_description: z.string(),
  text: z.string().optional(),
  profile_photo_url: z.string().optional(),
});

export const GooglePlaceDetailsSchema = z.object({
  place_id: z.string().optional(),
  name: z.string().optional(),
  rating: z.number().optional(),
  user_ratings_total: z.number().optional(),
  reviews: z.array(GoogleReviewSchema).optional(),
});

export type GoogleReview = z.infer<typeof GoogleReviewSchema>;
export type GooglePlaceDetails = z.infer<typeof GooglePlaceDetailsSchema>;

export async function searchPlaceId(placeName: string, address?: string): Promise<string | null> {
  if (!GOOGLE_PLACES_API_KEY) {
    console.log("Google Places API key not configured");
    return null;
  }

  const query = address ? `${placeName} ${address}` : placeName;
  const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id&key=${GOOGLE_PLACES_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === "OK" && data.candidates && data.candidates.length > 0) {
      return data.candidates[0].place_id;
    }
    return null;
  } catch (error) {
    console.error("Error searching for place ID:", error);
    return null;
  }
}

export async function getPlaceDetails(placeId: string): Promise<GooglePlaceDetails | null> {
  if (!GOOGLE_PLACES_API_KEY) {
    console.log("Google Places API key not configured");
    return null;
  }

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=place_id,name,rating,user_ratings_total,reviews&reviews_sort=newest&key=${GOOGLE_PLACES_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === "OK" && data.result) {
      return GooglePlaceDetailsSchema.parse(data.result);
    }
    return null;
  } catch (error) {
    console.error("Error fetching place details:", error);
    return null;
  }
}

export async function getPlaceReviews(placeName: string, address?: string): Promise<{
  rating: number | null;
  totalReviews: number | null;
  reviews: GoogleReview[];
  popularItems: string[];
}> {
  const placeId = await searchPlaceId(placeName, address);
  
  if (!placeId) {
    return { rating: null, totalReviews: null, reviews: [], popularItems: [] };
  }

  const details = await getPlaceDetails(placeId);
  
  if (!details) {
    return { rating: null, totalReviews: null, reviews: [], popularItems: [] };
  }

  const popularItems = extractPopularItems(details.reviews || []);

  return {
    rating: details.rating || null,
    totalReviews: details.user_ratings_total || null,
    reviews: details.reviews || [],
    popularItems,
  };
}

function extractPopularItems(reviews: GoogleReview[]): string[] {
  const allText = reviews.map(r => r.text || "").join(" ").toLowerCase();
  
  const foodKeywords = [
    "burger", "pizza", "pancakes", "breakfast", "tacos", "burritos", "wings",
    "chicken", "seafood", "sushi", "pasta", "steak", "salads", "soup", "dessert",
    "ice cream", "coffee", "chai", "smoothies", "fries", "sandwich", "wrap",
    "nuggets", "ribs", "bbq", "brunch", "eggs", "bacon", "waffles", "omelet",
    "nachos", "quesadilla", "burrito bowl", "ramen", "pho", "curry", "naan",
    "biryani", "dosa", "tikka", "kebab", "shawarma", "falafel", "hummus"
  ];

  const positivePatterns = [
    /(?:the|their)\s+(\w+(?:\s+\w+)?)\s+(?:is|was|are|were)\s+(?:amazing|incredible|delicious|excellent|great|best|fantastic|perfect)/gi,
    /(?:loved?|recommend|try)\s+(?:the|their)?\s*(\w+(?:\s+\w+)?)/gi,
    /(?:best|amazing|incredible|delicious)\s+(\w+(?:\s+\w+)?)/gi,
    /must[- ]try\s+(\w+(?:\s+\w+)?)/gi,
  ];

  const foundItems = new Set<string>();

  for (const pattern of positivePatterns) {
    let match;
    while ((match = pattern.exec(allText)) !== null) {
      const item = match[1]?.trim();
      if (item && item.length > 2 && item.length < 30) {
        const cleaned = item.replace(/[^\w\s]/g, "").trim();
        if (cleaned.length > 2) {
          foundItems.add(cleaned.charAt(0).toUpperCase() + cleaned.slice(1));
        }
      }
    }
  }

  for (const keyword of foodKeywords) {
    if (allText.includes(keyword)) {
      const pattern = new RegExp(`(?:great|amazing|best|delicious|excellent|incredible|loved?)\\s+${keyword}s?`, "i");
      if (pattern.test(allText)) {
        foundItems.add(keyword.charAt(0).toUpperCase() + keyword.slice(1));
      }
    }
  }

  return Array.from(foundItems).slice(0, 5);
}
