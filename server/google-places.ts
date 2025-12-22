import { z } from "zod";
import OpenAI from "openai";

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

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
