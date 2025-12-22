const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface FetchRequest {
  placeName: string;
  category?: string;
}

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
      const url = imageUrlMatch[0].replace(/"ou":"/,  "").replace(/"/g, "");
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

    const photoMatch = html.match(/"photo":\{"url":"([^"]+)"/i);
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
    const { placeName, category } = (await req.json()) as FetchRequest;

    if (!placeName) {
      return new Response(
        JSON.stringify({ success: false, error: "placeName is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let imageUrl = await fetchImageFromTripAdvisor(placeName);
    
    if (!imageUrl) {
      imageUrl = await fetchImageFromGoogle(placeName, category);
    }

    if (!imageUrl) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No images found for this place",
          imageUrl: null,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching image:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
