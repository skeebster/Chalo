import { z } from "zod";
import OpenAI from "openai";
import type { InsertPlace, NearbyRestaurant } from "@shared/schema";

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export interface PlaceLookupResult {
  success: boolean;
  place?: Partial<InsertPlace>;
  error?: string;
}

export interface PlacePhoto {
  photoReference: string;
  url: string;
  width: number;
  height: number;
  attributions: string[];
}

export interface PhotoFetchResult {
  success: boolean;
  photos?: PlacePhoto[];
  error?: string;
}

export interface ReviewInsight {
  sentimentScore: number;
  sentimentLabel: "Very Positive" | "Positive" | "Mixed" | "Negative" | "Very Negative";
  summary: string;
  pros: string[];
  cons: string[];
  visitorTips: string[];
  noteworthyMentions: string[];
}

export interface ReviewAnalysis {
  rating: number | null;
  totalReviews: number | null;
  insights: ReviewInsight | null;
  googleMapsUrl: string | null;
}

interface FormattedReview {
  author_name: string;
  rating: number;
  text: string;
}

async function searchPlaceId(placeName: string, address?: string): Promise<{ placeId: string | null; googleMapsUrl: string | null }> {
  if (!GOOGLE_PLACES_API_KEY) {
    console.log("Google Places API key not configured");
    return { placeId: null, googleMapsUrl: null };
  }

  const query = address ? `${placeName}, ${address}` : placeName;
  
  const url = "https://places.googleapis.com/v1/places:searchText";
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": "places.id,places.displayName,places.googleMapsUri",
      },
      body: JSON.stringify({
        textQuery: query,
        maxResultCount: 1,
      }),
    });
    
    const data = await response.json();
    console.log("Places search response for:", query, JSON.stringify(data).substring(0, 200));
    
    if (data.places && data.places.length > 0) {
      return {
        placeId: data.places[0].id,
        googleMapsUrl: data.places[0].googleMapsUri || null,
      };
    }
    return { placeId: null, googleMapsUrl: null };
  } catch (error) {
    console.error("Error searching for place ID:", error);
    return { placeId: null, googleMapsUrl: null };
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

async function analyzeReviewsWithAI(reviews: FormattedReview[], placeName: string): Promise<ReviewInsight | null> {
  if (reviews.length === 0) return null;

  const reviewTexts = reviews.map((r, i) => 
    `Review ${i + 1} (${r.rating}/5 stars by ${r.author_name}):\n"${r.text}"`
  ).join("\n\n");

  const prompt = `Analyze these Google reviews for "${placeName}" and extract genuinely useful insights for someone planning to visit. Focus on non-obvious information that would actually help a visitor.

${reviewTexts}

Provide your analysis as JSON with this exact structure:
{
  "sentimentScore": <number 0-100, where 100 is extremely positive>,
  "sentimentLabel": "<one of: Very Positive, Positive, Mixed, Negative, Very Negative>",
  "summary": "<2-3 sentence summary of overall visitor experience, written conversationally>",
  "pros": ["<specific positive things visitors consistently mention>"],
  "cons": ["<specific negatives or warnings visitors mention>"],
  "visitorTips": ["<actionable tips extracted from reviews - things like best times to visit, what to bring, what to skip, insider knowledge>"],
  "noteworthyMentions": ["<specific things visitors rave about - attractions, features, food items, experiences worth seeking out>"]
}

IMPORTANT: 
- Only include genuinely useful, non-obvious information
- Skip generic statements like "it's a nice place" 
- Focus on specific, actionable insights
- Include 2-4 items per array (don't force items if reviews don't support them)
- visitorTips should be practical advice that would help someone planning a visit
- noteworthyMentions should be specific things worth experiencing at this location`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a travel insights analyst. Extract useful, non-obvious information from reviews to help visitors. Return valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    return {
      sentimentScore: parsed.sentimentScore || 50,
      sentimentLabel: parsed.sentimentLabel || "Mixed",
      summary: parsed.summary || "",
      pros: parsed.pros || [],
      cons: parsed.cons || [],
      visitorTips: parsed.visitorTips || [],
      noteworthyMentions: parsed.noteworthyMentions || [],
    };
  } catch (error) {
    console.error("Error analyzing reviews with AI:", error);
    return null;
  }
}

export async function getReviewAnalysis(placeName: string, address?: string): Promise<ReviewAnalysis> {
  const { placeId, googleMapsUrl } = await searchPlaceId(placeName, address);
  
  if (!placeId) {
    console.log("No place ID found for:", placeName);
    return { rating: null, totalReviews: null, insights: null, googleMapsUrl: null };
  }

  const details = await getPlaceDetails(placeId);
  
  if (!details) {
    console.log("No details found for place ID:", placeId);
    return { rating: null, totalReviews: null, insights: null, googleMapsUrl };
  }

  const formattedReviews: FormattedReview[] = (details.reviews || []).map((review: any) => ({
    author_name: review.authorAttribution?.displayName || "Anonymous",
    rating: review.rating || 0,
    text: review.text?.text || review.originalText?.text || "",
  })).filter((r: FormattedReview) => r.text && r.text.length > 20);

  const insights = await analyzeReviewsWithAI(formattedReviews, placeName);

  return {
    rating: details.rating || null,
    totalReviews: details.userRatingCount || null,
    insights,
    googleMapsUrl,
  };
}

// Extract place ID from various Google Maps URL formats
export function extractPlaceIdFromUrl(url: string): string | null {
  // Format: https://www.google.com/maps/place/.../@lat,lng,.../data=...!1s0x...:0x...!...
  // Format: https://maps.google.com/?cid=...
  // Format: https://www.google.com/maps?cid=...
  // Format: https://goo.gl/maps/...
  // Format: place_id embedded in URL
  
  try {
    // Try to find place_id in URL
    const placeIdMatch = url.match(/place_id[=:]([A-Za-z0-9_-]+)/);
    if (placeIdMatch) return placeIdMatch[1];
    
    // Try to find CID format
    const cidMatch = url.match(/cid[=:](\d+)/);
    if (cidMatch) return null; // CID needs different handling
    
    // For other formats, we'll search by extracted name/address
    return null;
  } catch {
    return null;
  }
}

// Get comprehensive place details for creating a card
async function getFullPlaceDetails(placeId: string): Promise<any | null> {
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
        "X-Goog-FieldMask": "id,displayName,formattedAddress,addressComponents,rating,userRatingCount,reviews,regularOpeningHours,priceLevel,types,primaryType,primaryTypeDisplayName,editorialSummary,websiteUri,nationalPhoneNumber,googleMapsUri,photos,accessibilityOptions,parkingOptions,paymentOptions,currentOpeningHours",
      },
    });
    
    const data = await response.json();
    console.log("Full place details response:", JSON.stringify(data).substring(0, 500));
    
    if (data.id) {
      return data;
    }
    return null;
  } catch (error) {
    console.error("Error fetching full place details:", error);
    return null;
  }
}

// Search for nearby restaurants
async function searchNearbyRestaurants(lat: number, lng: number): Promise<NearbyRestaurant[]> {
  if (!GOOGLE_PLACES_API_KEY) return [];

  const url = "https://places.googleapis.com/v1/places:searchNearby";
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": "places.displayName,places.rating,places.priceLevel,places.types,places.primaryTypeDisplayName",
      },
      body: JSON.stringify({
        includedTypes: ["restaurant", "cafe", "bakery"],
        maxResultCount: 5,
        locationRestriction: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: 1000.0, // 1km radius
          },
        },
      }),
    });
    
    const data = await response.json();
    
    if (data.places) {
      return data.places.map((place: any) => ({
        name: place.displayName?.text || "Unknown",
        rating: place.rating,
        priceRange: place.priceLevel ? "$".repeat(place.priceLevel) : undefined,
        cuisine: place.primaryTypeDisplayName?.text,
        distance: "Nearby",
      }));
    }
    return [];
  } catch (error) {
    console.error("Error searching nearby restaurants:", error);
    return [];
  }
}

// Use AI to research and generate comprehensive place information
async function researchPlaceWithAI(placeName: string, address: string, googleRating: string | null, category: string): Promise<Partial<InsertPlace>> {
  try {
    // Generate search URLs for source attribution
    const encodedName = encodeURIComponent(placeName);
    const encodedAddress = encodeURIComponent(address);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Use the best model for comprehensive research
      messages: [
        {
          role: "system",
          content: `You are a travel research expert. Generate comprehensive destination information for families planning weekend trips. 

IMPORTANT RESTRICTIONS:
- NEVER mention or recommend alcohol, bars, wineries, breweries, or drinking establishments
- NEVER recommend chain restaurants like Panera, Chick-fil-A, McDonald's, Starbucks, Subway, etc.
- Focus on unique local restaurants and cafes only
- Do not include any accessibility or wheelchair information
          
Return a JSON object with these fields (all as strings unless noted):
{
  "overview": "2-3 sentence engaging description of the place",
  "subcategory": "specific type of attraction",
  "keyHighlights": "4-5 main attractions or features, semicolon separated",
  "insiderTips": "3-4 practical tips for visitors, written as advice",
  "entryFee": "typical admission costs or 'Free'",
  "averageSpend": <number, estimated total spend for family of 4>,
  "bestSeasons": "best times of year to visit",
  "bestDay": "best day of week and why",
  "bestTimeOfDay": "optimal arrival time",
  "parkingInfo": "parking situation and costs",
  "evCharging": "EV charging availability nearby",
  "overallSentiment": "1 sentence summary of visitor sentiment",
  "nearbyRestaurants": [{"name": "Local Restaurant Name", "description": "brief description", "distance": "X mi"}],
  "averageVisitDuration": "typical time spent",
  "kidFriendly": <boolean>,
  "indoorOutdoor": "indoor" or "outdoor" or "both",
  "officialWebsite": "official website URL if known, or null"
}

Be specific and accurate. Only recommend unique, local dining options - no chains. If unsure about something, provide reasonable estimates based on similar venues.`
        },
        {
          role: "user",
          content: `Research this destination for a family weekend trip:

Name: ${placeName}
Address: ${address}
Category: ${category}
Google Rating: ${googleRating || "Unknown"}

Provide comprehensive, practical information for families planning to visit.`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error("No AI response for place research");
      return {};
    }

    const research = JSON.parse(content);
    
    // Build research sources with hyperlinks
    const sources: string[] = [];
    if (research.officialWebsite) {
      sources.push(`Official Website: ${research.officialWebsite}`);
    }
    sources.push(`Google Maps: https://www.google.com/maps/search/?api=1&query=${encodedName}+${encodedAddress}`);
    sources.push(`TripAdvisor: https://www.tripadvisor.com/Search?q=${encodedName}`);
    sources.push(`Yelp: https://www.yelp.com/search?find_desc=${encodedName}&find_loc=${encodedAddress}`);
    
    return {
      overview: research.overview || null,
      subcategory: research.subcategory || null,
      keyHighlights: research.keyHighlights || null,
      insiderTips: research.insiderTips || null,
      entryFee: research.entryFee || null,
      averageSpend: typeof research.averageSpend === 'number' ? research.averageSpend : null,
      bestSeasons: research.bestSeasons || null,
      bestDay: research.bestDay || null,
      bestTimeOfDay: research.bestTimeOfDay || "Early morning for smaller crowds",
      parkingInfo: research.parkingInfo || null,
      evCharging: research.evCharging || null,
      overallSentiment: research.overallSentiment || null,
      nearbyRestaurants: Array.isArray(research.nearbyRestaurants) ? research.nearbyRestaurants : [],
      averageVisitDuration: research.averageVisitDuration || null,
      kidFriendly: typeof research.kidFriendly === 'boolean' ? research.kidFriendly : true,
      indoorOutdoor: research.indoorOutdoor || "both",
      researchSources: sources.join(" | "),
    };
  } catch (error) {
    console.error("Error researching place with AI:", error);
    return {};
  }
}

// Lookup a place by name and get full details for card creation
export async function lookupPlaceByName(placeName: string, additionalContext?: string): Promise<PlaceLookupResult> {
  if (!placeName || placeName.trim().length === 0) {
    return { success: false, error: "Place name is required" };
  }
  
  const query = additionalContext ? `${placeName} ${additionalContext}` : placeName;
  const { placeId, googleMapsUrl } = await searchPlaceId(query);
  
  if (!placeId) {
    return { success: false, error: `Could not find place: ${placeName}` };
  }
  
  const details = await getFullPlaceDetails(placeId);
  
  if (!details) {
    return { success: false, error: `Could not fetch details for: ${placeName}` };
  }
  
  const name = details.displayName?.text || placeName;
  const address = details.formattedAddress || "";
  const googleRating = details.rating?.toString() || null;
  const category = details.primaryTypeDisplayName?.text || mapGoogleTypeToCategory(details.types) || "Attraction";
  
  // Use AI to research comprehensive details
  console.log("Researching comprehensive details for:", name);
  const aiResearch = await researchPlaceWithAI(name, address, googleRating, category);
  
  // Map Google Places data to our schema with AI-enhanced content
  const place: Partial<InsertPlace> = {
    name,
    address: address || null,
    googleMapsUrl: details.googleMapsUri || googleMapsUrl || null,
    googleRating,
    overview: aiResearch.overview || details.editorialSummary?.text || `A destination to explore.`,
    category,
    subcategory: aiResearch.subcategory || null,
    keyHighlights: aiResearch.keyHighlights || null,
    insiderTips: aiResearch.insiderTips || null,
    entryFee: aiResearch.entryFee || null,
    averageSpend: aiResearch.averageSpend || null,
    bestSeasons: aiResearch.bestSeasons || null,
    bestDay: aiResearch.bestDay || null,
    bestTimeOfDay: aiResearch.bestTimeOfDay || "Early morning (9-11am) for smaller crowds",
    parkingInfo: aiResearch.parkingInfo || (details.parkingOptions ? formatParkingInfo(details.parkingOptions) : null),
    evCharging: aiResearch.evCharging || null,
    tripadvisorRating: null,
    overallSentiment: aiResearch.overallSentiment || null,
    nearbyRestaurants: aiResearch.nearbyRestaurants || [],
    averageVisitDuration: aiResearch.averageVisitDuration || null,
    upcomingEvents: null,
    researchSources: aiResearch.researchSources || null,
    publicTransit: null,
    kidFriendly: aiResearch.kidFriendly ?? true,
    indoorOutdoor: aiResearch.indoorOutdoor || mapTypesToIndoorOutdoor(details.types) || "both",
    visited: false,
    visitedDate: null,
    userNotes: null,
    imageUrl: null,
  };
  
  return { success: true, place };
}

// Lookup place from Google Maps URL
export async function lookupPlaceFromUrl(googleMapsUrl: string): Promise<PlaceLookupResult> {
  if (!GOOGLE_PLACES_API_KEY) {
    return { success: false, error: "Google Places API key not configured" };
  }

  if (!googleMapsUrl || !googleMapsUrl.trim()) {
    return { success: false, error: "URL is required" };
  }

  // Validate it looks like a Google Maps URL
  const lowerUrl = googleMapsUrl.toLowerCase();
  const isValidGoogleMapsUrl = 
    lowerUrl.includes("google.com/maps") || 
    lowerUrl.includes("maps.google.com") || 
    lowerUrl.includes("goo.gl/maps") ||
    lowerUrl.includes("maps.app.goo.gl") ||
    lowerUrl.includes("goo.gl/");
    
  if (!isValidGoogleMapsUrl) {
    return { success: false, error: "Please provide a valid Google Maps URL" };
  }
  
  // For shortened URLs like maps.app.goo.gl, we need to follow the redirect
  let resolvedUrl = googleMapsUrl;
  if (lowerUrl.includes("goo.gl") || lowerUrl.includes("maps.app.goo.gl")) {
    try {
      console.log("Following redirect for shortened URL:", googleMapsUrl);
      const response = await fetch(googleMapsUrl, { 
        method: 'HEAD', 
        redirect: 'follow',
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      resolvedUrl = response.url;
      console.log("Resolved URL:", resolvedUrl);
    } catch (error) {
      console.error("Failed to resolve shortened URL:", error);
      // Continue with original URL, will try to extract what we can
    }
  }

  // Try to extract place name from URL for text search
  try {
    let searchQuery = "";
    
    // Format 1: /maps/place/Place+Name/... or /maps/place/Place+Name@lat,lng
    const placeMatch = resolvedUrl.match(/\/place\/([^/@?]+)/);
    if (placeMatch) {
      searchQuery = decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
    }
    
    // Format 2: ?q=Place+Name or ?query=Place+Name
    if (!searchQuery) {
      try {
        const url = new URL(resolvedUrl);
        searchQuery = url.searchParams.get("q") || url.searchParams.get("query") || "";
        if (searchQuery) {
          searchQuery = decodeURIComponent(searchQuery.replace(/\+/g, " "));
        }
      } catch {
        // URL parsing failed, try regex
      }
    }
    
    // Format 3: search/ followed by place name
    if (!searchQuery) {
      const searchMatch = resolvedUrl.match(/\/search\/([^/@?]+)/);
      if (searchMatch) {
        searchQuery = decodeURIComponent(searchMatch[1].replace(/\+/g, " "));
      }
    }
    
    // Format 4: Extract address-like text from URL path
    if (!searchQuery) {
      const addressMatch = resolvedUrl.match(/\/([^/@]+),\+([^/@]+)/);
      if (addressMatch) {
        searchQuery = decodeURIComponent(`${addressMatch[1]} ${addressMatch[2]}`.replace(/\+/g, " "));
      }
    }
    
    if (!searchQuery) {
      return { success: false, error: "Could not extract place name from URL. Try copying the full Google Maps link that includes the place name." };
    }
    
    console.log("Extracted search query from URL:", searchQuery);
    return await lookupPlaceByName(searchQuery);
  } catch (error) {
    console.error("Error parsing Google Maps URL:", error);
    return { success: false, error: "Invalid Google Maps URL format" };
  }
}

// Process voice transcript to extract place info
export async function processVoiceTranscript(transcript: string): Promise<PlaceLookupResult> {
  if (!transcript || transcript.trim().length === 0) {
    return { success: false, error: "Voice transcript is empty" };
  }
  
  if (transcript.trim().length < 3) {
    return { success: false, error: "Voice transcript too short. Please say the name of the place you want to add." };
  }

  // Use AI to extract place name and context from natural speech
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You extract place names from spoken descriptions. The user wants to add a destination or place of interest.

Return JSON with exactly this structure:
{
  "placeName": "the extracted place name or null if not found",
  "context": "any location context like city/state, or null",
  "notes": "any personal notes/comments the user mentioned, or null",
  "error": "explanation if placeName is null"
}

Examples:
- "I want to add Central Park in New York" → {"placeName": "Central Park", "context": "New York", "notes": null}
- "The zoo we went to last week was great" → {"placeName": null, "error": "No specific place name mentioned - just 'the zoo'"}
- "Add Turtle Back Zoo, it has great animals for kids" → {"placeName": "Turtle Back Zoo", "context": null, "notes": "great animals for kids"}`
        },
        {
          role: "user",
          content: `Extract the place information from this voice transcript: "${transcript}"`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { success: false, error: "Failed to process voice input - no response from AI" };
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      return { success: false, error: "Failed to parse voice input response" };
    }
    
    // Validate the parsed response
    if (!parsed.placeName || typeof parsed.placeName !== 'string' || parsed.placeName.trim().length === 0) {
      return { success: false, error: parsed.error || "Could not identify a place name from your voice input. Please try again with a specific place name." };
    }
    
    console.log("Extracted from voice:", parsed.placeName, parsed.context || "");
    
    const result = await lookupPlaceByName(parsed.placeName, parsed.context || undefined);
    
    // Add user notes if provided
    if (result.success && result.place && parsed.notes && typeof parsed.notes === 'string') {
      result.place.userNotes = parsed.notes.trim();
    }
    
    return result;
  } catch (error) {
    console.error("Error processing voice transcript:", error);
    return { success: false, error: "Failed to process voice input. Please try again." };
  }
}

// Helper functions
function mapGoogleTypeToCategory(types: string[]): string {
  if (!types || types.length === 0) return "Attraction";
  
  const typeMap: Record<string, string> = {
    "amusement_park": "Theme Park",
    "zoo": "Zoo",
    "aquarium": "Aquarium",
    "museum": "Museum",
    "park": "Park",
    "restaurant": "Restaurant",
    "cafe": "Cafe",
    "tourist_attraction": "Attraction",
    "natural_feature": "Nature",
    "campground": "Outdoor Recreation",
    "rv_park": "Outdoor Recreation",
    "stadium": "Entertainment",
    "bowling_alley": "Entertainment",
    "movie_theater": "Entertainment",
  };
  
  for (const type of types) {
    if (typeMap[type]) return typeMap[type];
  }
  
  return "Attraction";
}

function mapTypesToIndoorOutdoor(types: string[]): string {
  if (!types) return "both";
  
  const outdoorTypes = ["park", "zoo", "campground", "natural_feature", "beach", "hiking_area"];
  const indoorTypes = ["museum", "movie_theater", "bowling_alley", "shopping_mall", "library"];
  
  const hasOutdoor = types.some(t => outdoorTypes.includes(t));
  const hasIndoor = types.some(t => indoorTypes.includes(t));
  
  if (hasOutdoor && hasIndoor) return "both";
  if (hasOutdoor) return "outdoor";
  if (hasIndoor) return "indoor";
  return "both";
}

function formatParkingInfo(options: any): string {
  const parts: string[] = [];
  if (options.freeParking) parts.push("Free parking available");
  if (options.paidParking) parts.push("Paid parking available");
  if (options.streetParking) parts.push("Street parking available");
  if (options.valetParking) parts.push("Valet parking available");
  if (options.wheelchairAccessibleParking) parts.push("Accessible parking available");
  return parts.join(". ") || "Parking information not available";
}

// Fetch high-quality photos for a place
export async function fetchPlacePhotos(placeName: string, address?: string, maxPhotos: number = 5): Promise<PhotoFetchResult> {
  if (!GOOGLE_PLACES_API_KEY) {
    return { success: false, error: "Google Places API key not configured" };
  }

  // First, search for the place to get its ID
  const { placeId } = await searchPlaceId(placeName, address);
  
  if (!placeId) {
    return { success: false, error: `Could not find place: ${placeName}` };
  }

  // Get place details including photos
  const url = `https://places.googleapis.com/v1/places/${placeId}`;
  
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": "photos",
      },
    });
    
    const data = await response.json();
    console.log("Place photos response:", JSON.stringify(data).substring(0, 500));
    
    if (!data.photos || data.photos.length === 0) {
      return { success: false, error: "No photos available for this place" };
    }

    // Build photo references (up to maxPhotos) - URLs will be proxied through our server
    const photos: PlacePhoto[] = [];
    const photosToFetch = data.photos.slice(0, maxPhotos);
    
    for (const photo of photosToFetch) {
      // photo.name is like "places/ChIJ.../photos/ABC123..."
      const photoName = photo.name;
      // URL will be proxied through our server endpoint - don't expose API key
      const photoRef = encodeURIComponent(photoName);
      const photoUrl = `/api/photos/proxy?ref=${photoRef}`;
      
      // Get attributions
      const attributions = photo.authorAttributions?.map((a: any) => a.displayName || "Google Maps") || ["Google Maps"];
      
      photos.push({
        photoReference: photoName,
        url: photoUrl,
        width: photo.widthPx || 1600,
        height: photo.heightPx || 1200,
        attributions,
      });
    }

    return { success: true, photos };
  } catch (error) {
    console.error("Error fetching place photos:", error);
    return { success: false, error: "Failed to fetch photos" };
  }
}

// Fetch photos by Google Maps URL
export async function fetchPhotosFromUrl(googleMapsUrl: string, maxPhotos: number = 5): Promise<PhotoFetchResult> {
  if (!GOOGLE_PLACES_API_KEY) {
    return { success: false, error: "Google Places API key not configured" };
  }

  // Extract place name from URL (reusing existing logic)
  const lowerUrl = googleMapsUrl.toLowerCase();
  const isValidGoogleMapsUrl = 
    lowerUrl.includes("google.com/maps") || 
    lowerUrl.includes("maps.google.com") || 
    lowerUrl.includes("goo.gl/maps") ||
    lowerUrl.includes("maps.app.goo.gl") ||
    lowerUrl.includes("goo.gl/");
    
  if (!isValidGoogleMapsUrl) {
    return { success: false, error: "Please provide a valid Google Maps URL" };
  }

  // For shortened URLs, follow redirect
  let resolvedUrl = googleMapsUrl;
  if (lowerUrl.includes("goo.gl") || lowerUrl.includes("maps.app.goo.gl")) {
    try {
      const response = await fetch(googleMapsUrl, { 
        method: 'HEAD', 
        redirect: 'follow',
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      resolvedUrl = response.url;
    } catch (error) {
      console.error("Failed to resolve shortened URL:", error);
    }
  }

  // Extract place name
  let searchQuery = "";
  const placeMatch = resolvedUrl.match(/\/place\/([^/@?]+)/);
  if (placeMatch) {
    searchQuery = decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
  }

  if (!searchQuery) {
    try {
      const url = new URL(resolvedUrl);
      searchQuery = url.searchParams.get("q") || url.searchParams.get("query") || "";
      if (searchQuery) {
        searchQuery = decodeURIComponent(searchQuery.replace(/\+/g, " "));
      }
    } catch {}
  }

  if (!searchQuery) {
    return { success: false, error: "Could not extract place name from URL" };
  }

  return await fetchPlacePhotos(searchQuery, undefined, maxPhotos);
}

// Default home address for distance calculations (Somerset, NJ)
const HOME_ADDRESS = "8 Canvass Ct, Somerset, NJ 08873";

export interface DistanceResult {
  distanceMiles: number;
  driveTimeMinutes: number;
}

// Calculate estimated drive time from distance using average speed heuristic
// Uses ~45 mph average for mixed highway/local driving typical of NJ destinations
export function calculateDriveTimeFromDistance(distanceMiles: number): number {
  const AVERAGE_SPEED_MPH = 45;
  return Math.round((distanceMiles / AVERAGE_SPEED_MPH) * 60);
}

// Home coordinates (8 Canvass Ct, Somerset, NJ 08873)
const HOME_COORDS = { lat: 40.4976, lng: -74.4885 };

// Get coordinates for an address using Google Places Text Search
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!GOOGLE_PLACES_API_KEY) return null;
  
  try {
    const url = "https://places.googleapis.com/v1/places:searchText";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": "places.location",
      },
      body: JSON.stringify({ textQuery: address }),
    });
    
    const data = await response.json();
    if (data.places?.[0]?.location) {
      return {
        lat: data.places[0].location.latitude,
        lng: data.places[0].location.longitude,
      };
    }
    return null;
  } catch (error) {
    console.error("Geocode error:", error);
    return null;
  }
}

// Use OSRM (free, no API key) to get driving distance and time
async function getOSRMRoute(startLng: number, startLat: number, endLng: number, endLat: number): Promise<DistanceResult | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=false`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.code === "Ok" && data.routes?.[0]) {
      const route = data.routes[0];
      const distanceMiles = Math.round((route.distance / 1609.34) * 10) / 10;
      const driveTimeMinutes = Math.round(route.duration / 60);
      return { distanceMiles, driveTimeMinutes };
    }
    return null;
  } catch (error) {
    console.error("OSRM error:", error);
    return null;
  }
}

// Calculate driving distance and time from home to a destination
// Uses Google Places for geocoding + OSRM for routing (free, accurate)
export async function calculateDrivingDistance(destinationAddress: string, existingDistanceMiles?: number): Promise<DistanceResult | null> {
  // First, geocode the destination address to get coordinates
  const destCoords = await geocodeAddress(destinationAddress);
  
  if (destCoords) {
    // Use OSRM for accurate routing (free, no API key needed)
    const result = await getOSRMRoute(HOME_COORDS.lng, HOME_COORDS.lat, destCoords.lng, destCoords.lat);
    if (result) {
      console.log(`OSRM route to ${destinationAddress}: ${result.distanceMiles} miles, ${result.driveTimeMinutes} min`);
      return result;
    }
  }
  
  // Fallback to heuristic if routing fails and we have existing distance
  if (existingDistanceMiles && existingDistanceMiles > 1) {
    const driveTimeMinutes = calculateDriveTimeFromDistance(existingDistanceMiles);
    console.log(`Heuristic fallback: ${existingDistanceMiles} miles = ${driveTimeMinutes} min`);
    return { distanceMiles: existingDistanceMiles, driveTimeMinutes };
  }
  
  console.log(`Cannot calculate distance for: ${destinationAddress}`);
  return null;
}

export interface EnrichmentResult {
  success: boolean;
  updated: string[];
  error?: string;
}

// Enrich a place with missing data from Google Places API
export async function enrichPlaceData(place: { 
  id: number; 
  name: string; 
  address: string | null; 
  googleMapsUrl: string | null;
  distanceMiles: string | null;
  driveTimeMinutes: number | null;
  googleRating: string | null;
}): Promise<{ updates: Partial<{ distanceMiles: string; driveTimeMinutes: number; googleRating: string }>, changes: string[] }> {
  const updates: Partial<{ distanceMiles: string; driveTimeMinutes: number; googleRating: string }> = {};
  const changes: string[] = [];
  
  // Check if we need distance/drive time data
  // "1" is a known placeholder value that should be treated as missing
  const needsDistance = !place.distanceMiles || place.distanceMiles === "1" || parseFloat(place.distanceMiles) === 0;
  const needsDriveTime = !place.driveTimeMinutes || place.driveTimeMinutes === 1 || place.driveTimeMinutes === 0;
  
  // Only use existing distance for fallback if it's not a placeholder value
  const existingDistanceParsed = place.distanceMiles ? parseFloat(place.distanceMiles) : 0;
  const hasValidExistingDistance = existingDistanceParsed > 1; // Must be greater than 1 to not be placeholder
  const existingDistance = hasValidExistingDistance ? existingDistanceParsed : undefined;
  
  if ((needsDistance || needsDriveTime) && place.address) {
    // Pass existing distance for fallback heuristic calculation (only if valid)
    const distanceResult = await calculateDrivingDistance(place.address, existingDistance);
    if (distanceResult) {
      if (needsDistance) {
        updates.distanceMiles = distanceResult.distanceMiles.toString();
        changes.push(`distance: ${distanceResult.distanceMiles} mi`);
      }
      if (needsDriveTime) {
        updates.driveTimeMinutes = distanceResult.driveTimeMinutes;
        changes.push(`drive time: ${distanceResult.driveTimeMinutes} min`);
      }
    } else if (needsDistance || needsDriveTime) {
      console.log(`Cannot enrich ${place.name}: Distance Matrix API unavailable and no valid existing distance`);
    }
  } else if (needsDriveTime && hasValidExistingDistance) {
    // If we only need drive time and have valid distance, use heuristic directly
    const driveTimeMinutes = calculateDriveTimeFromDistance(existingDistanceParsed);
    updates.driveTimeMinutes = driveTimeMinutes;
    changes.push(`drive time: ${driveTimeMinutes} min (calculated)`);
  }
  
  // Check if we need Google rating
  const needsRating = !place.googleRating || parseFloat(place.googleRating) === 0;
  if (needsRating) {
    const { placeId } = await searchPlaceId(place.name, place.address || undefined);
    if (placeId) {
      const details = await getPlaceDetails(placeId);
      if (details?.rating) {
        updates.googleRating = details.rating.toString();
        changes.push(`rating: ${details.rating}`);
      }
    }
  }
  
  return { updates, changes };
}
