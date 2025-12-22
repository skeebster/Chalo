import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ExtractedPlace {
  name: string;
  overview?: string;
  address?: string;
  google_maps_url?: string;
  distance_miles?: number;
  drive_time_minutes?: number;
  category?: string;
  subcategory?: string;
  key_highlights?: string;
  insider_tips?: string;
  entry_fee?: string;
  average_spend?: number;
  best_seasons?: string;
  best_day?: string;
  parking_info?: string;
  ev_charging?: string;
  google_rating?: number;
  tripadvisor_rating?: number;
  overall_sentiment?: string;
  nearby_restaurants?: Array<{name: string; description: string}>;
  average_visit_duration?: string;
  upcoming_events?: string;
  research_sources?: string;
}

const extractionPrompt = `You are analyzing a document that contains information about places of interest, likely in a spreadsheet or tabular format.

CRITICAL INSTRUCTIONS FOR SPREADSHEET DATA:
1. This document is likely a spreadsheet exported to PDF with ROWS of data
2. Each ROW represents a DIFFERENT PLACE - extract ALL of them
3. Look for column headers to understand the data structure
4. Extract EVERY SINGLE ROW as a separate place entry
5. Do NOT skip any rows - even if there are 30+ places
6. Scan the ENTIRE document from beginning to end, ALL PAGES
7. If you see duplicate entries (same place name multiple times), only include the FIRST occurrence

Look for these types of columns and extract the data:
- Place Name / Name
- Overview / Description
- Address / Location
- Google Maps URL
- Distance (miles)
- Drive Time (minutes)
- Category
- Subcategory / Type
- Key Highlights / Features
- Insider Tips / Tips
- Entry Fee / Admission
- Average Spend
- Best Seasons / Best Time
- Best Day to Visit
- Parking Info
- EV Charging
- Google Rating
- TripAdvisor Rating
- Overall Sentiment
- Nearby Restaurants (extract as array of {name, description})
- Average Visit Duration
- Upcoming Events
- Research Sources

Return a JSON object with this EXACT structure:
{
  "places": [
    {
      "name": "Place name (REQUIRED - skip if no name)",
      "overview": "Brief description",
      "address": "Full address",
      "google_maps_url": "URL if present",
      "distance_miles": 0,
      "drive_time_minutes": 0,
      "category": "Category",
      "subcategory": "Subcategory",
      "key_highlights": "Notable features",
      "insider_tips": "Tips for visitors",
      "entry_fee": "Cost information",
      "average_spend": 0,
      "best_seasons": "Best time to visit",
      "best_day": "Best day to visit",
      "parking_info": "Parking details",
      "ev_charging": "EV charging info",
      "google_rating": 0.0,
      "tripadvisor_rating": 0.0,
      "overall_sentiment": "General sentiment",
      "nearby_restaurants": [{"name": "Restaurant", "description": "Description"}],
      "average_visit_duration": "Duration",
      "upcoming_events": "Events",
      "research_sources": "Sources"
    }
  ],
  "total_found": 0,
  "duplicates_removed": 0
}

IMPORTANT:
- Extract NUMBERS as actual numbers, not strings (e.g., distance_miles: 25 not "25 miles")
- For ratings, extract just the number (e.g., 4.5 not "4.5/5")
- Skip entries without a valid place name
- Deduplicate by name - keep first occurrence only
- Return ONLY valid JSON, no markdown code blocks
- EXTRACT EVERY ROW - DO NOT STOP EARLY`;

async function fetchImageFromGoogle(placeName: string, category?: string): Promise<string | null> {
  try {
    const searchQuery = `${placeName} ${category || ""}`.trim();
    const encodedQuery = encodeURIComponent(searchQuery);

    const response = await fetch(
      `https://www.google.com/search?q=${encodedQuery}&tbm=isch`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const html = await response.text();

    const imageUrlMatch = html.match(/"ou":"([^"]+)"/g);
    if (imageUrlMatch && imageUrlMatch.length > 0) {
      const url = imageUrlMatch[0].replace(/"ou":"/, "").replace(/"/g, "");
      if (url && url.startsWith("http")) {
        return url;
      }
    }

    return null;
  } catch (error) {
    console.error(`Error fetching image from Google for ${placeName}:`, error);
    return null;
  }
}

async function fetchImageFromTripAdvisor(placeName: string): Promise<string | null> {
  try {
    const encodedQuery = encodeURIComponent(placeName);
    const response = await fetch(
      `https://www.tripadvisor.com/Search?q=${encodedQuery}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const html = await response.text();

    const imageMatch = html.match(/src="([^"]+)"[^>]*class="[^"]*thumb[^"]*"/i);
    if (imageMatch && imageMatch[1]) {
      return imageMatch[1];
    }

    const photoMatch = html.match(/"photo":{"url":"([^"]+)"/i);
    if (photoMatch && photoMatch[1]) {
      return photoMatch[1];
    }

    return null;
  } catch (error) {
    console.error(`Error fetching image from TripAdvisor for ${placeName}:`, error);
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { fileData, fileType } = await req.json();

    if (!fileData || !fileType) {
      return new Response(
        JSON.stringify({ error: "Missing fileData or fileType" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const mediaType = fileType === "pdf" ? "application/pdf" : "image/jpeg";
    const contentType = fileType === "pdf" ? "document" : "image";

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 16384,
        messages: [
          {
            role: "user",
            content: [
              {
                type: contentType,
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: fileData,
                },
              },
              {
                type: "text",
                text: extractionPrompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API Error:", errorText);
      return new Response(
        JSON.stringify({ error: `AI analysis failed: ${response.status}`, details: errorText }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const result = await response.json();
    const textContent = result.content[0].text;

    let cleanedJson = textContent.trim();
    if (cleanedJson.startsWith("```json")) {
      cleanedJson = cleanedJson.slice(7);
    } else if (cleanedJson.startsWith("```")) {
      cleanedJson = cleanedJson.slice(3);
    }
    if (cleanedJson.endsWith("```")) {
      cleanedJson = cleanedJson.slice(0, -3);
    }
    cleanedJson = cleanedJson.trim();

    const extractedData = JSON.parse(cleanedJson);
    const places: ExtractedPlace[] = extractedData.places || [];

    const seenNames = new Set<string>();
    const uniquePlaces = places.filter((place) => {
      if (!place.name || place.name.trim() === "") return false;
      const normalizedName = place.name.toLowerCase().trim();
      if (seenNames.has(normalizedName)) return false;
      seenNames.add(normalizedName);
      return true;
    });

    const processedPlaces = await Promise.all(
      uniquePlaces.map(async (place) => {
        let imageUrl = await fetchImageFromTripAdvisor(place.name);
        if (!imageUrl) {
          imageUrl = await fetchImageFromGoogle(place.name, place.category);
        }
        return {
          name: place.name?.trim() || "Unnamed Place",
          overview: place.overview || null,
          address: place.address || null,
          google_maps_url: place.google_maps_url || null,
          distance_miles: typeof place.distance_miles === "number" ? place.distance_miles : parseFloat(String(place.distance_miles)) || null,
          drive_time_minutes: typeof place.drive_time_minutes === "number" ? place.drive_time_minutes : parseInt(String(place.drive_time_minutes)) || null,
          category: place.category || null,
          subcategory: place.subcategory || null,
          key_highlights: place.key_highlights || null,
          insider_tips: place.insider_tips || null,
          entry_fee: place.entry_fee || null,
          average_spend: typeof place.average_spend === "number" ? place.average_spend : parseInt(String(place.average_spend)) || null,
          best_seasons: place.best_seasons || null,
          best_day: place.best_day || null,
          parking_info: place.parking_info || null,
          ev_charging: place.ev_charging || null,
          google_rating: typeof place.google_rating === "number" ? place.google_rating : parseFloat(String(place.google_rating)) || null,
          tripadvisor_rating: typeof place.tripadvisor_rating === "number" ? place.tripadvisor_rating : parseFloat(String(place.tripadvisor_rating)) || null,
          overall_sentiment: place.overall_sentiment || null,
          nearby_restaurants: place.nearby_restaurants || [],
          average_visit_duration: place.average_visit_duration || null,
          upcoming_events: place.upcoming_events || null,
          research_sources: place.research_sources || null,
          image_url: imageUrl,
          visited: false,
        };
      })
    );

    return new Response(
      JSON.stringify({
        success: true,
        places: processedPlaces,
        total_extracted: processedPlaces.length,
        duplicates_removed: places.length - processedPlaces.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Extraction error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
