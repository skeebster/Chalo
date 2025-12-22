const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Place {
  id: string;
  name: string;
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase credentials" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/places?select=id,name,category&image_url=is.null&limit=100`, {
      headers: {
        "Authorization": `Bearer ${supabaseKey}`,
        "apikey": supabaseKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status}`);
    }

    const places = (await response.json()) as Place[];

    if (places.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No places need image updates", updated: 0 }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let updated = 0;
    for (const place of places) {
      let imageUrl = await fetchImageFromTripAdvisor(place.name);
      if (!imageUrl) {
        imageUrl = await fetchImageFromGoogle(place.name, place.category);
      }

      if (imageUrl) {
        const updateResponse = await fetch(
          `${supabaseUrl}/rest/v1/places?id=eq.${place.id}`,
          {
            method: "PATCH",
            headers: {
              "Authorization": `Bearer ${supabaseKey}`,
              "apikey": supabaseKey,
              "Content-Type": "application/json",
              "Prefer": "return=minimal",
            },
            body: JSON.stringify({ image_url: imageUrl }),
          }
        );

        if (updateResponse.ok) {
          updated++;
        } else {
          console.error(`Failed to update image for ${place.name}: ${updateResponse.status}`);
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated ${updated} places with images`,
        updated,
        total: places.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error updating place images:", error);
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
