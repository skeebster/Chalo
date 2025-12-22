import { z } from "zod";

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export const GoogleReviewSchema = z.object({
  authorAttribution: z.object({
    displayName: z.string(),
    photoUri: z.string().optional(),
    uri: z.string().optional(),
  }).optional(),
  rating: z.number().optional(),
  relativePublishTimeDescription: z.string().optional(),
  text: z.object({
    text: z.string(),
    languageCode: z.string().optional(),
  }).optional(),
  originalText: z.object({
    text: z.string(),
    languageCode: z.string().optional(),
  }).optional(),
});

export type GoogleReview = z.infer<typeof GoogleReviewSchema>;

export interface FormattedReview {
  author_name: string;
  rating: number;
  relative_time_description: string;
  text?: string;
  profile_photo_url?: string;
}

async function searchPlaceId(placeName: string, address?: string): Promise<string | null> {
  if (!GOOGLE_PLACES_API_KEY) {
    console.log("Google Places API key not configured");
    return null;
  }

  const query = address ? `${placeName}, ${address}` : placeName;
  
  const url = "https://places.googleapis.com/v1/places:searchText";
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": "places.id,places.displayName",
      },
      body: JSON.stringify({
        textQuery: query,
        maxResultCount: 1,
      }),
    });
    
    const data = await response.json();
    console.log("Places search response for:", query, JSON.stringify(data).substring(0, 200));
    
    if (data.places && data.places.length > 0) {
      return data.places[0].id;
    }
    return null;
  } catch (error) {
    console.error("Error searching for place ID:", error);
    return null;
  }
}

async function getPlaceDetails(placeId: string): Promise<any | null> {
  if (!GOOGLE_PLACES_API_KEY) {
    console.log("Google Places API key not configured");
    return null;
  }

  const url = `https://places.googleapis.com/v1/places/${placeId}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": "id,displayName,rating,userRatingCount,reviews",
      },
    });
    
    const data = await response.json();
    console.log("Place details response:", JSON.stringify(data).substring(0, 300));
    
    if (data.id) {
      return data;
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
  reviews: FormattedReview[];
  popularItems: string[];
}> {
  const placeId = await searchPlaceId(placeName, address);
  
  if (!placeId) {
    console.log("No place ID found for:", placeName);
    return { rating: null, totalReviews: null, reviews: [], popularItems: [] };
  }

  const details = await getPlaceDetails(placeId);
  
  if (!details) {
    console.log("No details found for place ID:", placeId);
    return { rating: null, totalReviews: null, reviews: [], popularItems: [] };
  }

  const formattedReviews: FormattedReview[] = (details.reviews || []).map((review: any) => ({
    author_name: review.authorAttribution?.displayName || "Anonymous",
    rating: review.rating || 0,
    relative_time_description: review.relativePublishTimeDescription || "",
    text: review.text?.text || review.originalText?.text || "",
    profile_photo_url: review.authorAttribution?.photoUri || undefined,
  }));

  const popularItems = extractPopularItems(formattedReviews);

  return {
    rating: details.rating || null,
    totalReviews: details.userRatingCount || null,
    reviews: formattedReviews,
    popularItems,
  };
}

function extractPopularItems(reviews: FormattedReview[]): string[] {
  const allText = reviews.map(r => r.text || "").join(" ").toLowerCase();
  
  if (allText.length < 10) return [];

  const foodKeywords = [
    "burger", "pizza", "pancakes", "breakfast", "tacos", "burritos", "wings",
    "chicken", "seafood", "sushi", "pasta", "steak", "salads", "soup", "dessert",
    "ice cream", "coffee", "chai", "smoothies", "fries", "sandwich", "wrap",
    "nuggets", "ribs", "bbq", "brunch", "eggs", "bacon", "waffles", "omelet",
    "nachos", "quesadilla", "burrito bowl", "ramen", "pho", "curry", "naan",
    "biryani", "dosa", "tikka", "kebab", "shawarma", "falafel", "hummus",
    "exhibits", "planetarium", "animals", "rides", "trampolines", "zipline",
    "obstacle course", "touch tank", "playground", "train ride", "foam pit"
  ];

  const foundItems = new Set<string>();

  const positivePatterns = [
    /(?:the|their)\s+(\w+(?:\s+\w+)?)\s+(?:is|was|are|were)\s+(?:amazing|incredible|delicious|excellent|great|best|fantastic|perfect)/gi,
    /(?:loved?|recommend|try)\s+(?:the|their)?\s*(\w+(?:\s+\w+)?)/gi,
    /(?:best|amazing|incredible|delicious)\s+(\w+(?:\s+\w+)?)/gi,
    /must[- ]try\s+(\w+(?:\s+\w+)?)/gi,
  ];

  for (const pattern of positivePatterns) {
    let match;
    while ((match = pattern.exec(allText)) !== null) {
      const item = match[1]?.trim();
      if (item && item.length > 2 && item.length < 30) {
        const cleaned = item.replace(/[^\w\s]/g, "").trim();
        if (cleaned.length > 2 && !["the", "this", "that", "very", "really", "here", "there", "place", "visit"].includes(cleaned.toLowerCase())) {
          foundItems.add(cleaned.charAt(0).toUpperCase() + cleaned.slice(1));
        }
      }
    }
  }

  for (const keyword of foodKeywords) {
    if (allText.includes(keyword)) {
      const pattern = new RegExp(`(?:great|amazing|best|delicious|excellent|incredible|loved?|fun|cool)\\s+${keyword}s?`, "i");
      if (pattern.test(allText)) {
        foundItems.add(keyword.charAt(0).toUpperCase() + keyword.slice(1));
      }
    }
  }

  return Array.from(foundItems).slice(0, 5);
}
