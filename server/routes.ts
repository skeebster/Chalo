import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";

// Sample data for import
const samplePlaces = [
  {
    name: 'Sky Zone Trampoline Park - South Plainfield',
    overview: 'Large indoor trampoline park with a dedicated Toddler Zone, open jump courts, foam pits, Air Court, and party rooms. Good option for a 5-year-old if you go during off-peak hours.',
    address: '600 Hadley Rd, South Plainfield, NJ 07080',
    googleMapsUrl: 'https://www.google.com/maps/place/Sky+Zone+Trampoline+Park,+600+Hadley+Rd,+South+Plainfield,+NJ+07080',
    distanceMiles: "9.5",
    driveTimeMinutes: 22,
    category: 'Indoor Attraction',
    subcategory: 'Trampoline Park',
    keyHighlights: 'Toddler Zone designed for younger kids; Freestyle Jump; Foam Zone; Air Court; Family Slide/SkyHoops; birthday party packages',
    insiderTips: 'Go at opening on Tue–Thu to avoid big-kid crowds; skip GLOW for noise/sensory-sensitive kids. Pre-sign the online waiver and book a start time; arrive 20 minutes early to get wristbands and socks.',
    entryFee: 'Varies by session; book online. Typical range: 60 min ≈ $25–$30 per jumper',
    averageSpend: 55,
    bestSeasons: 'Year-round; ideal for winter, rainy days, and very hot days',
    bestDay: 'Tuesday–Thursday mornings (least crowded)',
    parkingInfo: 'Free on-site lot (shared plaza); busiest on weekends',
    evCharging: 'No dedicated chargers on-site; public stations available nearby',
    googleRating: "3.8",
    tripadvisorRating: "3.7",
    overallSentiment: 'Mixed-positive: kids love it and staff are often friendly; best experiences reported during off-peak times.',
    nearbyRestaurants: [
      { name: 'Panera Bread', description: 'Soups/sandwiches, kid-friendly', distance: '~0.3 mi' },
      { name: 'Chipotle Mexican Grill', description: 'Customizable bowls/tacos; kid meals', distance: '~0.3 mi' },
      { name: 'Chick-fil-A', description: 'Chicken sandwiches/nuggets; kids\' meals', distance: '~1.0 mi' }
    ],
    averageVisitDuration: '1.5–2 hours',
    upcomingEvents: 'GLOW (blacklight) nights on select weekends; Little Leapers toddler sessions',
    visited: false
  },
  {
    name: 'Turtle Back Zoo',
    overview: 'Turtle Back Zoo, located in West Orange, New Jersey, is a family-friendly destination featuring over 100 species of animals, including giraffes, penguins, and bears. It offers interactive experiences like a miniature train ride, a petting zoo, and a treetop adventure course.',
    address: '560 Northfield Ave, West Orange, NJ 07052',
    googleMapsUrl: 'https://www.google.com/maps/place/Turtle+Back+Zoo/@40.7678,-74.2855,17z',
    distanceMiles: "25",
    driveTimeMinutes: 35,
    category: 'Outdoor Attraction',
    subcategory: 'Zoo',
    keyHighlights: 'Diverse animal exhibits, interactive experiences like the petting zoo and train ride, seasonal events such as Boo at the Zoo, playground areas for kids',
    insiderTips: 'Arrive early to beat the crowds and secure parking close to the entrance; bring a stroller for a 5-year-old as the zoo involves a lot of walking; check the feeding schedules online to plan your visit around interactive animal experiences',
    entryFee: 'Adults (13-61): $17, Children (2-12): $14, Seniors (62+): $14, Free for children under 2',
    averageSpend: 60,
    bestSeasons: 'Spring and Fall for pleasant weather and fewer crowds',
    bestDay: 'Wednesday for lower attendance and a calmer experience',
    parkingInfo: 'Ample parking available at South Mountain Recreation Complex, $10 fee on weekends and holidays, free on weekdays',
    evCharging: 'Limited EV charging stations available at South Mountain Recreation Complex parking area',
    googleRating: "4.5",
    tripadvisorRating: "4.0",
    overallSentiment: 'Highly positive; families praise the variety of animals, cleanliness, and kid-friendly activities, though some note crowded weekends',
    nearbyRestaurants: [
      { name: 'The Juke Joint Soul Kitchen', description: 'Family-friendly Southern comfort food', distance: '10-minute drive' },
      { name: 'Tito\'s Burritos & Wings', description: 'Casual Mexican eatery, kid-friendly menu', distance: '15-minute drive' },
      { name: 'Whole Foods Market Cafe', description: 'Healthy grab-and-go options for families', distance: '5-minute drive' }
    ],
    averageVisitDuration: '3-4 hours',
    upcomingEvents: 'Boo at the Zoo (October 2025), Holiday Lights Spectacular (November-December 2025)',
    visited: false
  },
  {
    name: 'Liberty Science Center',
    overview: 'Liberty Science Center is a premier interactive science museum and learning center located in Jersey City, New Jersey. It features hundreds of hands-on exhibits, live demonstrations, the largest planetarium in the Western Hemisphere, and dedicated play zones for younger visitors.',
    address: '222 Jersey City Blvd, Jersey City, NJ 07305',
    googleMapsUrl: 'https://www.google.com/maps/place/Liberty+Science+Center',
    distanceMiles: "37",
    driveTimeMinutes: 50,
    category: 'Museum',
    subcategory: 'Science Center',
    keyHighlights: 'Jennifer Chalsty Planetarium (largest in the Western Hemisphere), Wobbly World and I Explore zones for younger children, Touch Tunnel crawl experience, Dino Dig, live animal exhibits',
    insiderTips: 'Arrive early to beat school groups and secure timed tickets for the Planetarium. Bring snacks or eat before entering—the on-site cafeteria is convenient but pricey. Buying parking online with admission saves time.',
    entryFee: 'Approximately $30 per adult, $25 per child (ages 2–12); separate fee for special exhibits or planetarium shows',
    averageSpend: 150,
    bestSeasons: 'Year-round (indoor attraction). Fall and winter are best for fewer crowds',
    bestDay: 'Wednesday or Thursday morning for minimal wait times',
    parkingInfo: 'On-site paid parking lot ($7–$10/day); buy online to save $2',
    evCharging: 'Limited EV charging stations available in the main parking lot',
    googleRating: "4.5",
    tripadvisorRating: "4.0",
    overallSentiment: 'Highly positive – families love the hands-on exhibits and educational value. A few reviews mention it gets noisy and crowded, but staff handle crowd flow well',
    nearbyRestaurants: [
      { name: 'Liberty House Restaurant', description: 'Upscale but family-friendly dining with views of the Manhattan skyline' },
      { name: 'Brownstone Diner & Pancake Factory', description: 'Casual spot known for excellent pancakes and breakfast all day' },
      { name: 'Café Peanut', description: 'Cozy local café serving sandwiches, wraps, frappes, and smoothies' }
    ],
    averageVisitDuration: '3–5 hours',
    upcomingEvents: 'Winter 2025 Planetarium series: Stars of Sesame Street live astronomy show for preschoolers (Nov–Feb)',
    visited: false
  },
  {
    name: 'Adventure Aquarium',
    overview: 'One of the premier aquariums in the US, featuring hippos, sharks, penguins, and interactive touch tanks. Located on the Camden waterfront with views of Philadelphia.',
    address: '1 Riverside Dr, Camden, NJ 08103',
    googleMapsUrl: 'https://www.google.com/maps/place/Adventure+Aquarium',
    distanceMiles: "62",
    driveTimeMinutes: 75,
    category: 'Museum',
    subcategory: 'Aquarium',
    keyHighlights: 'Hippo Haven, Shark Bridge walkway, penguin island, stingray touch tank, 4D theater experiences',
    insiderTips: 'Purchase tickets online to save money and skip the box office line. Visit on weekday mornings for smaller crowds. The shark tunnel is best experienced early before crowds arrive.',
    entryFee: 'Adults: $35, Children (2-12): $25, under 2 free',
    averageSpend: 120,
    bestSeasons: 'Year-round indoor attraction; summer offers waterfront activities nearby',
    bestDay: 'Tuesday or Wednesday mornings',
    parkingInfo: 'Paid parking garage adjacent to aquarium ($15-20)',
    evCharging: 'EV charging available at nearby parking facilities',
    googleRating: "4.4",
    tripadvisorRating: "4.0",
    overallSentiment: 'Very positive; visitors love the diverse exhibits and interactive experiences, particularly the hippos and shark tunnel',
    nearbyRestaurants: [
      { name: 'Chickie\'s & Pete\'s', description: 'Family sports bar famous for crabfries', distance: 'Adjacent' },
      { name: 'Iron Hill Brewery', description: 'Craft brewery with full menu', distance: '0.2 mi' }
    ],
    averageVisitDuration: '3-4 hours',
    upcomingEvents: 'Penguin Encounter experiences, Dive with Sharks programs',
    visited: false
  },
  {
    name: 'Grounds For Sculpture',
    overview: '42-acre sculpture park and museum featuring contemporary sculptures set in beautifully landscaped gardens. Indoor galleries and outdoor installations throughout.',
    address: '80 Sculptors Way, Hamilton, NJ 08619',
    googleMapsUrl: 'https://www.google.com/maps/place/Grounds+For+Sculpture',
    distanceMiles: "45",
    driveTimeMinutes: 55,
    category: 'Outdoor Attraction',
    subcategory: 'Sculpture Park',
    keyHighlights: '270+ sculptures by renowned and emerging artists, themed gardens, climate-controlled pavilions, family-friendly scavenger hunts',
    insiderTips: 'Wear comfortable walking shoes. Pick up a family guide at entrance for kid-friendly sculpture descriptions. The Peacock Café requires reservations on weekends.',
    entryFee: 'Adults: $20, Children (under 10): Free, Students/Seniors: $18',
    averageSpend: 75,
    bestSeasons: 'Spring (blooming gardens) and Fall (autumn colors)',
    bestDay: 'Friday for quieter experience',
    parkingInfo: 'Free on-site parking lot',
    evCharging: 'No dedicated EV charging currently',
    googleRating: "4.6",
    tripadvisorRating: "4.5",
    overallSentiment: 'Excellent; visitors praise the beautiful setting, diverse artwork, and peaceful atmosphere',
    nearbyRestaurants: [
      { name: 'Rats Restaurant', description: 'Fine dining on-site inspired by Monet\'s Giverny' },
      { name: 'Van Gogh\'s Ear Café', description: 'Casual café on-site with sandwiches and pastries' }
    ],
    averageVisitDuration: '2-3 hours',
    upcomingEvents: 'Summer Concert Series, Holiday Light Show (December)',
    visited: false
  }
];

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Register integration routes
  registerObjectStorageRoutes(app);
  registerChatRoutes(app);
  registerImageRoutes(app);

  const openai = new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  });

  // === Places API ===
  app.get(api.places.list.path, async (req, res) => {
    try {
      const { search, category, sort } = req.query as any;
      const places = await storage.getPlaces(search, category, sort);
      res.json(places);
    } catch (error) {
      console.error("Error listing places:", error);
      res.status(500).json({ message: "Failed to list places" });
    }
  });

  app.get(api.places.get.path, async (req, res) => {
    try {
      const place = await storage.getPlace(Number(req.params.id));
      if (!place) {
        return res.status(404).json({ message: 'Place not found' });
      }
      res.json(place);
    } catch (error) {
      res.status(500).json({ message: "Failed to get place" });
    }
  });

  app.post(api.places.create.path, async (req, res) => {
    try {
      const input = api.places.create.input.parse(req.body);
      const place = await storage.createPlace(input);
      res.status(201).json(place);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Failed to create place" });
    }
  });

  app.put(api.places.update.path, async (req, res) => {
    try {
      const input = api.places.update.input.parse(req.body);
      const place = await storage.updatePlace(Number(req.params.id), input);
      if (!place) return res.status(404).json({ message: 'Place not found' });
      res.json(place);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Failed to update place" });
    }
  });

  app.delete(api.places.delete.path, async (req, res) => {
    try {
      await storage.deletePlace(Number(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete place" });
    }
  });

  app.post(api.places.import.path, async (req, res) => {
    try {
      let count = 0;
      for (const place of samplePlaces) {
        await storage.createPlace(place as any); // Casting because numeric strings in sample vs numeric type in DB
        count++;
      }
      res.json({ success: true, count });
    } catch (error) {
      console.error("Import error:", error);
      res.status(500).json({ success: false, count: 0 });
    }
  });

  app.post(api.places.extract.path, async (req, res) => {
    try {
      const { imageUrl, imageData, fileType } = req.body;
      
      let userContent: any[] = [
        { type: "text", text: "Extract place details from this image/document. Return a JSON array of places with these fields: name, overview, address, category, subcategory, key_highlights, insider_tips, entry_fee, average_spend, best_seasons, best_day, parking_info, ev_charging, google_rating, tripadvisor_rating, overall_sentiment, nearby_restaurants (array of {name, description, distance}), average_visit_duration, upcoming_events, research_sources. If a field is missing, use null." }
      ];

      if (imageUrl) {
        userContent.push({ type: "image_url", image_url: { url: imageUrl } });
      } else if (imageData) {
        // Assume imageData is base64
        userContent.push({ type: "image_url", image_url: { url: imageData } });
      } else {
        return res.status(400).json({ message: "Image URL or data required" });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          {
            role: "system",
            content: "You are a data extraction assistant. You extract structured data from images of documents or screenshots about travel destinations. You ONLY return valid JSON."
          },
          {
            role: "user",
            content: userContent
          }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 4096
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error("No content from AI");
      
      const result = JSON.parse(content);
      const places = result.places || result; // Handle both {places: [...]} and [...] format if possible, though prompts usually guide to object

      res.json({ success: true, places: Array.isArray(places) ? places : [places] });

    } catch (error) {
      console.error("Extraction error:", error);
      res.status(500).json({ message: "Failed to extract data" });
    }
  });

  return httpServer;
}
