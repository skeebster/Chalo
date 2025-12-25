import OpenAI from "openai";

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
const APIFY_BASE_URL = "https://api.apify.com/v2";

interface InstagramPostData {
  caption?: string;
  ownerUsername?: string;
  locationName?: string;
  hashtags?: string[];
  displayUrl?: string;
  type?: string;
}

interface ExtractedPlaceInfo {
  name: string;
  address?: string;
  category?: string;
  overview?: string;
  googleMapsUrl?: string;
  imageUrl?: string;
  source: string;
}

export async function scrapeInstagramPost(instagramUrl: string): Promise<InstagramPostData | null> {
  if (!APIFY_API_TOKEN) {
    throw new Error("APIFY_API_TOKEN is not configured");
  }

  const normalizedUrl = normalizeInstagramUrl(instagramUrl);
  if (!normalizedUrl) {
    throw new Error("Invalid Instagram URL");
  }

  console.log(`[Apify] Scraping Instagram post: ${normalizedUrl}`);

  try {
    const response = await fetch(
      `${APIFY_BASE_URL}/acts/apify~instagram-post-scraper/run-sync-get-dataset-items?token=${APIFY_API_TOKEN}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          directUrls: [normalizedUrl],
          resultsLimit: 1,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Apify] Error response: ${errorText}`);
      throw new Error(`Apify API error: ${response.status}`);
    }

    const results = await response.json() as InstagramPostData[];
    
    if (!results || results.length === 0) {
      console.log("[Apify] No results returned");
      return null;
    }

    const post = results[0];
    console.log(`[Apify] Got post from @${post.ownerUsername}: ${post.caption?.slice(0, 100)}...`);
    
    return post;
  } catch (error) {
    console.error("[Apify] Scraping failed:", error);
    throw error;
  }
}

function normalizeInstagramUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    if (!urlObj.hostname.includes("instagram.com")) {
      return null;
    }

    const pathParts = urlObj.pathname.split("/").filter(Boolean);
    
    if (pathParts[0] === "p" || pathParts[0] === "reel") {
      return `https://www.instagram.com/${pathParts[0]}/${pathParts[1]}/`;
    }
    
    return null;
  } catch {
    return null;
  }
}

export async function extractPlaceFromInstagram(instagramUrl: string): Promise<ExtractedPlaceInfo | null> {
  const postData = await scrapeInstagramPost(instagramUrl);
  
  if (!postData || !postData.caption) {
    return null;
  }

  const openai = new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  });

  const prompt = `Extract place/destination information from this Instagram post caption. The user wants to save this as a place to visit.

Instagram Caption:
"${postData.caption}"

${postData.locationName ? `Tagged Location: ${postData.locationName}` : ""}
${postData.hashtags?.length ? `Hashtags: ${postData.hashtags.join(", ")}` : ""}

IMPORTANT RULES:
- NEVER include bars, wineries, breweries, or any alcohol-related venues
- NEVER include chain restaurants (Starbucks, McDonald's, Panera, Chick-fil-A, Subway, etc.)
- Focus on unique local restaurants, attractions, nature spots, and experiences

Extract the following as JSON:
{
  "name": "Place name (required)",
  "address": "Full address if mentioned or can be inferred",
  "city": "City name",
  "state": "State abbreviation",
  "category": "Category: Nature/Park, Restaurant, Museum, Attraction, Beach, Hiking Trail, etc.",
  "overview": "2-3 sentence description of why someone would want to visit",
  "found": true/false - whether a valid place was found
}

If no specific place can be identified, set found to false.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a travel assistant that extracts place information from social media posts. Be precise and only extract real, identifiable places." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    
    if (!parsed.found || !parsed.name) {
      return null;
    }

    let address = parsed.address;
    if (!address && parsed.city && parsed.state) {
      address = `${parsed.city}, ${parsed.state}`;
    }

    return {
      name: parsed.name,
      address: address || undefined,
      category: parsed.category || "Attraction",
      overview: parsed.overview,
      imageUrl: postData.displayUrl,
      source: `Instagram post by @${postData.ownerUsername}`,
    };
  } catch (error) {
    console.error("[OpenAI] Failed to extract place from caption:", error);
    throw error;
  }
}

export function isInstagramUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes("instagram.com") && 
           (urlObj.pathname.includes("/p/") || urlObj.pathname.includes("/reel/"));
  } catch {
    return false;
  }
}
