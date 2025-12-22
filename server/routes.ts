import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import { getReviewAnalysis, lookupPlaceFromUrl, lookupPlaceByName, processVoiceTranscript } from "./google-places";
import type { InsertPlace } from "@shared/schema";

// Helper to validate and fill required fields for place creation
function validateAndFillPlace(partialPlace: Partial<InsertPlace>): InsertPlace | null {
  // Name is absolutely required
  if (!partialPlace.name || partialPlace.name.trim().length === 0) {
    return null;
  }
  
  // Fill in required fields with defaults
  return {
    name: partialPlace.name.trim(),
    overview: partialPlace.overview || `A destination to explore.`,
    address: partialPlace.address || null,
    googleMapsUrl: partialPlace.googleMapsUrl || null,
    distanceMiles: partialPlace.distanceMiles || null,
    driveTimeMinutes: partialPlace.driveTimeMinutes || null,
    category: partialPlace.category || "Attraction",
    subcategory: partialPlace.subcategory || null,
    keyHighlights: partialPlace.keyHighlights || null,
    insiderTips: partialPlace.insiderTips || null,
    entryFee: partialPlace.entryFee || null,
    averageSpend: partialPlace.averageSpend || null,
    bestSeasons: partialPlace.bestSeasons || null,
    bestDay: partialPlace.bestDay || null,
    bestTimeOfDay: partialPlace.bestTimeOfDay || "Early morning (9-11am) for smaller crowds",
    parkingInfo: partialPlace.parkingInfo || null,
    evCharging: partialPlace.evCharging || null,
    googleRating: partialPlace.googleRating || null,
    tripadvisorRating: partialPlace.tripadvisorRating || null,
    overallSentiment: partialPlace.overallSentiment || null,
    nearbyRestaurants: Array.isArray(partialPlace.nearbyRestaurants) ? partialPlace.nearbyRestaurants : [],
    averageVisitDuration: partialPlace.averageVisitDuration || null,
    upcomingEvents: partialPlace.upcomingEvents || null,
    researchSources: partialPlace.researchSources || null,
    wheelchairAccessible: partialPlace.wheelchairAccessible ?? false,
    adaCompliant: partialPlace.adaCompliant ?? false,
    serviceAnimalsAllowed: partialPlace.serviceAnimalsAllowed ?? true,
    accessibilityNotes: partialPlace.accessibilityNotes || "Contact venue for specific accessibility needs.",
    publicTransit: partialPlace.publicTransit || null,
    kidFriendly: partialPlace.kidFriendly ?? true,
    indoorOutdoor: partialPlace.indoorOutdoor || "both",
    visited: partialPlace.visited ?? false,
    visitedDate: partialPlace.visitedDate || null,
    userNotes: partialPlace.userNotes || null,
    imageUrl: partialPlace.imageUrl || null,
  };
}

// Sample data for import - from CSV with real images
const samplePlaces = [
  {
    name: 'Sky Zone Trampoline Park - South Plainfield',
    overview: 'Large indoor trampoline park with a dedicated Toddler Zone, open jump courts, foam pits, Air Court, and party rooms. Good option for a 5-year-old if you go during off-peak hours. Waivers and SkySocks are required; booking online avoids lines.',
    address: '600 Hadley Rd, South Plainfield, NJ 07080',
    googleMapsUrl: 'https://www.google.com/maps/place/Sky+Zone+Trampoline+Park,+600+Hadley+Rd,+South+Plainfield,+NJ+07080',
    distanceMiles: "9.5",
    driveTimeMinutes: 22,
    category: 'Indoor Attraction',
    subcategory: 'Trampoline Park / Family Entertainment Center',
    keyHighlights: 'Toddler Zone designed for younger kids; Freestyle Jump; Foam Zone; Air Court; Family Slide/SkyHoops; birthday party packages; occasional GLOW (blacklight) nights',
    insiderTips: 'Go at opening on Tue–Thu to avoid big-kid crowds; skip GLOW for noise/sensory-sensitive kids. Pre-sign the online waiver and book a start time; arrive 20 minutes early.',
    entryFee: 'Varies by session; book online. 60 min ≈ $25–$30, 90 min ≈ $30–$35, 120 min ≈ $40–$46. SkySocks required (~$3–$6).',
    averageSpend: 55,
    bestSeasons: 'Year-round; ideal for winter, rainy days, and very hot days',
    bestDay: 'Tuesday–Thursday mornings (least crowded)',
    parkingInfo: 'Free on-site lot (shared plaza); busiest on weekends',
    evCharging: 'No dedicated chargers on-site; public stations available nearby',
    googleRating: "3.8",
    tripadvisorRating: "3.7",
    overallSentiment: 'Mixed-positive: kids love it and staff are often friendly; best experiences during off-peak times.',
    nearbyRestaurants: [
      { name: 'Panera Bread', description: 'Soups/sandwiches, kid-friendly', distance: '~0.3 mi' },
      { name: 'Chipotle Mexican Grill', description: 'Customizable bowls/tacos; kid meals', distance: '~0.3 mi' },
      { name: 'Chick-fil-A', description: 'Chicken sandwiches/nuggets', distance: '~1.0 mi' }
    ],
    averageVisitDuration: '1.5–2 hours',
    upcomingEvents: 'GLOW (blacklight) nights on select weekends; Little Leapers toddler sessions',
    imageUrl: '/images/sky_zone_trampoline__b2b43907.jpg',
    visited: false
  },
  {
    name: 'Tree Escape Adventure Park',
    overview: 'Tree Escape Adventure Park offers a thrilling outdoor experience with ziplines, treetop obstacle courses, and climbing challenges suitable for families with young children (ages 5 and up for certain activities). Located in a natural setting.',
    address: '792 US-206, Hillsborough Township, NJ 08844',
    googleMapsUrl: 'https://www.google.com/maps?q=Tree+Escape+Adventure+Park+NJ',
    distanceMiles: "15",
    driveTimeMinutes: 25,
    category: 'Outdoor Activity',
    subcategory: 'Adventure Park',
    keyHighlights: 'Family-friendly zipline courses, beginner-friendly obstacles for kids aged 5+, scenic natural environment, picnic areas for family breaks.',
    insiderTips: 'Book tickets online at least a week in advance to secure a spot. Arrive early in the morning for cooler weather and smaller crowds. Bring your own water bottles and snacks.',
    entryFee: '$25-$45 per person depending on age and course',
    averageSpend: 120,
    bestSeasons: 'Spring and Fall for mild weather',
    bestDay: 'Wednesday for fewer crowds',
    parkingInfo: 'Free parking available on-site with ample spaces',
    evCharging: 'Not available on-site',
    googleRating: "4.6",
    tripadvisorRating: "4.5",
    overallSentiment: 'Highly positive; families praise the fun, safe environment for kids, though some note long wait times on busy days.',
    nearbyRestaurants: [
      { name: 'Hillsborough Star Diner', description: 'Family-friendly American diner', distance: '3 miles' },
      { name: 'Bella Pizza', description: 'Casual Italian spot', distance: '4 miles' },
      { name: 'Panera Bread', description: 'Healthy options', distance: '5 miles' }
    ],
    averageVisitDuration: '3-4 hours',
    upcomingEvents: 'Fall Festival Weekend on October 15-16, 2025',
    imageUrl: '/images/adventure_park_zipli_d7f77244.jpg',
    visited: false
  },
  {
    name: 'Turtle Back Zoo',
    overview: 'Turtle Back Zoo, located in West Orange, New Jersey, is a family-friendly destination featuring over 100 species of animals, including giraffes, penguins, and bears. It offers interactive experiences like a miniature train ride, a petting zoo, and a treetop adventure course.',
    address: '560 Northfield Ave, West Orange, NJ 07052',
    googleMapsUrl: 'https://www.google.com/maps/place/Turtle+Back+Zoo/@40.7678,-74.2855,17z',
    distanceMiles: "25",
    driveTimeMinutes: 35,
    category: 'Attraction',
    subcategory: 'Zoo',
    keyHighlights: 'Diverse animal exhibits, petting zoo and train ride, seasonal events (Boo at the Zoo), playground areas, part of South Mountain Recreation Complex',
    insiderTips: 'Arrive early to beat the crowds and secure parking close to the entrance; bring a stroller as the zoo involves a lot of walking; check feeding schedules online.',
    entryFee: 'Adults: $17, Children (2-12): $14, Seniors: $14, Free for under 2',
    averageSpend: 60,
    bestSeasons: 'Spring and Fall for pleasant weather and fewer crowds',
    bestDay: 'Wednesday for lower attendance',
    parkingInfo: 'Ample parking at South Mountain Recreation Complex, $10 fee on weekends/holidays, free on weekdays',
    evCharging: 'Limited EV charging stations at South Mountain Recreation Complex',
    googleRating: "4.5",
    tripadvisorRating: "4.0",
    overallSentiment: 'Highly positive; families praise the variety of animals, cleanliness, and kid-friendly activities',
    nearbyRestaurants: [
      { name: 'The Juke Joint Soul Kitchen', description: 'Family-friendly Southern comfort food', distance: '10-min drive' },
      { name: 'Titos Burritos & Wings', description: 'Casual Mexican eatery', distance: '15-min drive' },
      { name: 'Whole Foods Market Cafe', description: 'Healthy grab-and-go options', distance: '5-min drive' }
    ],
    averageVisitDuration: '3-4 hours',
    upcomingEvents: 'Boo at the Zoo (October 2025), Holiday Lights Spectacular (Nov-Dec 2025)',
    imageUrl: '/images/zoo_animals_family_g_bf100abc.jpg',
    visited: false
  },
  {
    name: 'iPlay America',
    overview: 'Large indoor amusement park and arcade in Freehold, NJ designed like an indoor boardwalk. Free to enter; pay for rides, attractions, and games with reloadable iPA cards or wristbands. Good mix for younger kids and teens.',
    address: '110 Schanck Rd, Freehold, NJ 07728',
    googleMapsUrl: 'https://maps.google.com/?q=iPlay%20America%2C%20110%20Schanck%20Rd%2C%20Freehold%2C%20NJ%2007728',
    distanceMiles: "25",
    driveTimeMinutes: 45,
    category: 'Indoor Amusement Park',
    subcategory: 'Arcade, Rides, Family Entertainment Center',
    keyHighlights: 'Free admission; pay-as-you-go; 11+ indoor rides; 200+ arcade games; laser tag; mini bowling; go-karts; Topgolf Swing Suite; carousel; on-site food',
    insiderTips: 'Measure your child\'s height before you go; many rides have height thresholds. Load credits during online promos. Go at opening on weekdays or Sunday morning.',
    entryFee: 'Free admission; attractions from $5-$20 each',
    averageSpend: 80,
    bestSeasons: 'Year-round (indoor)',
    bestDay: 'Sunday morning or weekday mornings',
    parkingInfo: 'Free parking; lot behind building is usually less crowded',
    evCharging: 'Available nearby at Freehold Raceway Mall',
    googleRating: "4.3",
    tripadvisorRating: "4.0",
    overallSentiment: 'Positive; great for families with mixed ages, variety of activities',
    nearbyRestaurants: [
      { name: 'iPlay Bistro', description: 'On-site restaurant', distance: 'Inside' },
      { name: 'Freehold Raceway Mall food court', description: 'Various options', distance: 'Adjacent' }
    ],
    averageVisitDuration: '3-4 hours',
    upcomingEvents: 'Seasonal events and holiday celebrations',
    imageUrl: '/images/indoor_amusement_par_0711bcaa.jpg',
    visited: false
  },
  {
    name: 'Ninja Kidz Action Park',
    overview: 'Indoor family entertainment center featuring obstacle courses inspired by ninja warrior challenges, trampolines, climbing walls, and interactive play areas. Great for active kids to burn off energy.',
    address: '1617 NJ-23, Wayne, NJ 07470',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Ninja+Kidz+Action+Park',
    distanceMiles: "28",
    driveTimeMinutes: 40,
    category: 'Entertainment',
    subcategory: 'Family Activity Center',
    keyHighlights: 'Ninja warrior-style obstacle courses, trampoline zones, foam pits, climbing walls, dedicated toddler area, birthday party packages, snack bar',
    insiderTips: 'Book tickets online in advance as weekends can get very crowded; arrive 15 minutes early to complete waivers. Wear comfortable, grippy socks.',
    entryFee: '$15–$25 per child for a 1–2 hour session, adults often free or discounted',
    averageSpend: 40,
    bestSeasons: 'Year-round (indoor facility)',
    bestDay: 'Weekday afternoons (less crowded, often discounted)',
    parkingInfo: 'Ample free parking available directly outside',
    evCharging: 'No EV charging on-site; nearest stations ~2 miles away',
    googleRating: "4.5",
    tripadvisorRating: "4.0",
    overallSentiment: 'Highly positive; families praise the engaging activities for active kids',
    nearbyRestaurants: [
      { name: 'Nearby Wayne restaurants', description: 'Various options', distance: '~5 min drive' }
    ],
    averageVisitDuration: '2-3 hours',
    upcomingEvents: 'Birthday party specials and seasonal events',
    imageUrl: '/images/ninja_obstacle_cours_54441990.jpg',
    visited: false
  },
  {
    name: 'Holland Ridge Farms',
    overview: 'Seasonal u-pick flower farm famous for millions of tulips in April and expansive sunflower/wildflower fields in early fall. A very family-friendly outdoor experience with photo ops, food vendors, and open space.',
    address: '86 Rues Rd, Cream Ridge, NJ 08514',
    googleMapsUrl: 'https://maps.google.com/?q=Holland+Ridge+Farms+86+Rues+Rd+Cream+Ridge+NJ+08514',
    distanceMiles: "31.5",
    driveTimeMinutes: 50,
    category: 'Outdoor attraction',
    subcategory: 'Flower farm; U-pick; Seasonal festivals',
    keyHighlights: 'Over 8 million tulips each spring; sunflower fields in fall; photo props and Dutch-themed displays; on-site food trucks and bakery; Winter Wonderland light show',
    insiderTips: 'Buy timed entry tickets online as soon as dates are announced—peak weekends sell out fast. Bring a bucket with water for the car. Wear boots after rain.',
    entryFee: 'Timed-entry tickets $12–$19 per person (weekday vs. weekend)',
    averageSpend: 50,
    bestSeasons: 'April for tulips, September for sunflowers',
    bestDay: 'Weekday mornings for lightest crowds',
    parkingInfo: 'On-site parking; expect traffic on peak weekends',
    evCharging: 'Not available',
    googleRating: "4.7",
    tripadvisorRating: "4.5",
    overallSentiment: 'Very positive; families love the photo opportunities and outdoor experience',
    nearbyRestaurants: [
      { name: 'On-site food trucks', description: 'Various seasonal options', distance: 'On-site' }
    ],
    averageVisitDuration: '2-3 hours',
    upcomingEvents: 'Tulip Festival (April), Sunflower Festival (September), Winter Wonderland (December)',
    imageUrl: '/images/tulip_flower_farm_sp_ec662570.jpg',
    visited: false
  },
  {
    name: 'Jennifer Chalsty Planetarium',
    overview: 'The largest planetarium in the Western Hemisphere (89-ft dome) inside Liberty Science Center. Runs family-friendly sky shows and seasonal laser programs. Great paired with LSC exhibits.',
    address: '222 Jersey City Blvd, Jersey City, NJ 07305',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Jennifer%20Chalsty%20Planetarium',
    distanceMiles: "33",
    driveTimeMinutes: 50,
    category: 'Planetarium',
    subcategory: 'Science Museum (inside Liberty Science Center)',
    keyHighlights: '89-ft dome with cutting-edge digital projection; preschool-friendly shows (One World, One Sky); daily sky tours; part of Liberty Science Center',
    insiderTips: 'Reserve showtimes early—popular shows sell out. Pick the shortest show for young kids and sit mid-to-back rows. Bring a light sweater; the dome can feel cool.',
    entryFee: 'Included with LSC admission (~$30 adult, $25 child) or separate planetarium-only tickets',
    averageSpend: 100,
    bestSeasons: 'Year-round (indoor)',
    bestDay: 'Tuesday–Thursday mornings for calmest experience',
    parkingInfo: 'Liberty State Park area parking available',
    evCharging: 'Limited EV charging at LSC main parking lot',
    googleRating: "4.6",
    tripadvisorRating: "4.5",
    overallSentiment: 'Excellent; families love the immersive experience and kid-friendly programming',
    nearbyRestaurants: [
      { name: 'LSC Cafe', description: 'On-site cafeteria', distance: 'Inside' },
      { name: 'Liberty House Restaurant', description: 'Upscale dining with Manhattan views', distance: '5 min' }
    ],
    averageVisitDuration: '1–2 hours (show + exhibits)',
    upcomingEvents: 'Seasonal laser shows and special programming',
    imageUrl: '/images/planetarium_dome_sta_bd7f3ca9.jpg',
    visited: false
  },
  {
    name: 'Big Bear Gear Tubing Center',
    overview: 'Family-friendly Delaware River tubing adventures. Trips last 90 minutes to 3+ hours depending on river conditions. The exclusive tubing operator on this portion of the river licensed by NJ.',
    address: 'Route 29, Cooley Tract, Kingwood, NJ 08559',
    googleMapsUrl: 'https://www.google.com/maps?q=Big+Bear+Gear+Tubing+Center+Kingwood+NJ',
    distanceMiles: "35",
    driveTimeMinutes: 50,
    category: 'Outdoor Recreation',
    subcategory: 'River Tubing',
    keyHighlights: 'Exclusive Delaware River tubing operator; scenic relaxing float; near charming Frenchtown; suitable for families with children 6+',
    insiderTips: 'Avoid Apple Maps for navigation—use Google Maps. Check river conditions before booking. Call ahead to confirm if suitable for a 5-year-old. Bring sunscreen and water shoes.',
    entryFee: 'Approximately $50 per person',
    averageSpend: 150,
    bestSeasons: 'Late Spring to Early Fall (May to September)',
    bestDay: 'Weekday for less crowded experience',
    parkingInfo: 'Available at the tubing center',
    evCharging: 'Not available on-site',
    googleRating: "4.4",
    tripadvisorRating: "4.0",
    overallSentiment: 'Positive; great summer activity for families',
    nearbyRestaurants: [
      { name: 'Frenchtown restaurants', description: 'Charming town nearby', distance: '~5 min drive' }
    ],
    averageVisitDuration: '3-4 hours',
    upcomingEvents: 'Open seasonally May-September',
    imageUrl: '/images/river_tubing_summer__d63d0a63.jpg',
    visited: false
  },
  {
    name: 'Liberty Science Center',
    overview: 'Premier interactive science museum and learning center in Jersey City. Features hundreds of hands-on exhibits, live demonstrations, the largest planetarium in the Western Hemisphere, and dedicated play zones for younger visitors.',
    address: '222 Jersey City Blvd, Jersey City, NJ 07305',
    googleMapsUrl: 'https://goo.gl/maps/7mC4byrLhGx',
    distanceMiles: "37",
    driveTimeMinutes: 50,
    category: 'Museum',
    subcategory: 'Interactive Science and Technology Center',
    keyHighlights: 'Jennifer Chalsty Planetarium, Wobbly World and I Explore zones, Touch Tunnel, Dino Dig, live animal exhibits, rotating science demos',
    insiderTips: 'Arrive early to beat school groups. Bring snacks—on-site cafeteria is pricey. Buying parking online with admission saves time. Start at top floor kid zones before crowds build.',
    entryFee: 'Adults: ~$30, Children (2-12): ~$25; separate fee for planetarium shows',
    averageSpend: 150,
    bestSeasons: 'Year-round (indoor). Fall and winter for fewer crowds',
    bestDay: 'Wednesday or Thursday morning',
    parkingInfo: 'On-site paid parking lot ($7–$10/day); buy online to save $2',
    evCharging: 'Limited EV charging in main parking lot',
    googleRating: "4.5",
    tripadvisorRating: "4.0",
    overallSentiment: 'Highly positive; families love the hands-on exhibits and educational value',
    nearbyRestaurants: [
      { name: 'Liberty House Restaurant', description: 'Upscale with Manhattan skyline views' },
      { name: 'Brownstone Diner & Pancake Factory', description: 'Casual, excellent pancakes' },
      { name: 'Cafe Peanut', description: 'Cozy local café' }
    ],
    averageVisitDuration: '3–5 hours',
    upcomingEvents: 'Winter 2025 Planetarium series: Stars of Sesame Street',
    imageUrl: '/images/science_museum_inter_08cf7f73.jpg',
    visited: false
  },
  {
    name: 'White Deer Plaza (Lake Mohawk)',
    overview: 'Commercial and social hub near Lake Mohawk in Sparta, NJ with shops, restaurants, and community events. Family-friendly destination with access to the scenic Lake Mohawk boardwalk.',
    address: '7 The Boardwalk, Lake Mohawk, Sparta, NJ 07871',
    googleMapsUrl: 'https://maps.google.com/maps?daddr=7+The+Boardwalk+Lake+Mohawk%2C+Sparta%2C+NJ+07871',
    distanceMiles: "40",
    driveTimeMinutes: 70,
    category: 'Shopping and Recreation',
    subcategory: 'Community Plaza',
    keyHighlights: 'Scenic Lake Mohawk boardwalk; nearby playground at White Deer Park; community events like summer concerts and farmers markets',
    insiderTips: 'Pack a picnic to enjoy by the lake. Stick to public walkways and respect private areas. Arrive early for events to secure parking.',
    entryFee: 'Free entry to plaza and boardwalk',
    averageSpend: 30,
    bestSeasons: 'Spring and Summer for outdoor activities; Fall for scenic views',
    bestDay: 'Saturday for the farmers market',
    parkingInfo: 'Limited street parking; LMCC lot nearby $10-15',
    evCharging: 'Not widely available; check nearby Sparta locations',
    googleRating: "4.5",
    tripadvisorRating: "4.0",
    overallSentiment: 'Positive; families appreciate the scenic beauty and community vibe',
    nearbyRestaurants: [
      { name: 'Mohawk House', description: 'Known for burgers and kids menu', distance: 'On-site' },
      { name: 'St. Moritz Grille', description: 'Family dining', distance: 'Nearby' }
    ],
    averageVisitDuration: '2-3 hours',
    upcomingEvents: 'Summer concerts, Farmers markets',
    imageUrl: '/images/lake_boardwalk_sunse_ec36093d.jpg',
    visited: false
  },
  {
    name: 'Mercer Labs',
    overview: 'Mercer Labs Museum of Art and Technology is an immersive digital art museum in Lower Manhattan blending digital innovation, light, and sound for a multisensory experience. Features 25+ immersive rooms with interactive installations.',
    address: '21 Dey St, New York, NY 10007',
    googleMapsUrl: 'https://maps.google.com/?q=Mercer+Labs+21+Dey+St,+New+York,+NY+10007',
    distanceMiles: "44",
    driveTimeMinutes: 70,
    category: 'Museum',
    subcategory: 'Immersive Art and Technology Experience',
    keyHighlights: '25+ immersive rooms; cutting-edge projection technology; motion-responsive LED rooms; interactive sound corridors; stroller-friendly and air-conditioned',
    insiderTips: 'Book tickets online in advance as walk-in slots sell out. Morning slots are less crowded. Bring sunglasses for bright visual effects. Compact strollers work best.',
    entryFee: 'Adults: $45-52, Children (3-12): $35-45, Free for under 3',
    averageSpend: 120,
    bestSeasons: 'Fall and Winter (comfortable indoor activity)',
    bestDay: 'Wednesday mornings for lower crowds',
    parkingInfo: 'Limited street parking; multiple paid garages within 5-min walk (Icon Parking, 90 West Street)',
    evCharging: 'Available at nearby Brookfield Place and Westfield WTC garages',
    googleRating: "4.6",
    tripadvisorRating: "4.5",
    overallSentiment: 'Highly positive; families love the visually stunning and kid-friendly environment',
    nearbyRestaurants: [
      { name: 'Oculus Food Hall', description: 'Various options nearby', distance: '2 min walk' },
      { name: 'Battery Park restaurants', description: 'Short walk away', distance: '5 min walk' }
    ],
    averageVisitDuration: '1.5–2.5 hours',
    upcomingEvents: 'Rotating art installations',
    imageUrl: '/images/immersive_digital_ar_3e2cf727.jpg',
    visited: false
  },
  {
    name: 'Sesame Place Philadelphia',
    overview: 'Family-friendly theme park in Langhorne, Pennsylvania designed around Sesame Street characters. Ideal for children under 10 with water rides, gentle amusement rides, live character shows, and interactive play areas. Certified Autism Center.',
    address: '100 Sesame Road, Langhorne, PA 19047',
    googleMapsUrl: 'https://goo.gl/maps/Tv6mJfKfK6G2',
    distanceMiles: "48",
    driveTimeMinutes: 60,
    category: 'Theme Park',
    subcategory: 'Family Theme Park',
    keyHighlights: 'Sesame Street characters; water rides and splash areas; gentle rides for young kids; live shows; Certified Autism Center',
    insiderTips: 'Book tickets online for discounts. Arrive at opening for shorter lines on popular rides. Bring a change of clothes for water play areas.',
    entryFee: 'Adults: ~$70-90, Children: ~$60-80 (varies by season)',
    averageSpend: 200,
    bestSeasons: 'Spring through Fall; Summer for water attractions',
    bestDay: 'Weekdays for shorter lines',
    parkingInfo: 'On-site paid parking ($25-30)',
    evCharging: 'Limited availability in parking area',
    googleRating: "4.3",
    tripadvisorRating: "4.0",
    overallSentiment: 'Very positive; excellent for families with young Sesame Street fans',
    nearbyRestaurants: [
      { name: 'Park restaurants', description: 'Multiple on-site options', distance: 'Inside park' }
    ],
    averageVisitDuration: '5-7 hours',
    upcomingEvents: 'Halloween Spooktacular, Very Furry Christmas',
    imageUrl: '/images/sesame_street_theme__6eb577be.jpg',
    visited: false
  },
  {
    name: 'Fontys Deli + Dukaan',
    overview: 'Cozy, family-run Indian-inspired cafe and deli in New York\'s West Village. Known for blending New York deli culture with Indian home flavors. Features a curated menu of sandwiches, chai, and snacks.',
    address: 'West Village, New York, NY',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Fontys+Deli+Dukaan',
    distanceMiles: "45",
    driveTimeMinutes: 75,
    category: 'Restaurant',
    subcategory: 'Cafe / Deli',
    keyHighlights: 'Indian-inspired sandwiches and snacks; authentic chai; welcoming atmosphere for families; unique cultural fusion',
    insiderTips: 'Visit during off-peak hours as the space is small. Try their signature chai and Indian-inspired sandwiches.',
    entryFee: 'N/A (restaurant)',
    averageSpend: 40,
    bestSeasons: 'Year-round',
    bestDay: 'Weekday afternoons',
    parkingInfo: 'Street parking in West Village (limited)',
    evCharging: 'Available at nearby parking garages',
    googleRating: "4.7",
    tripadvisorRating: "4.5",
    overallSentiment: 'Very positive; locals love the unique flavors and cozy atmosphere',
    nearbyRestaurants: [],
    averageVisitDuration: '1 hour',
    upcomingEvents: 'Regular hours',
    imageUrl: '/images/delicatessen_cafe_co_d42dcd4c.jpg',
    visited: false
  },
  {
    name: 'TreEscape Aerial Adventure Park',
    overview: 'Family-friendly outdoor adventure park in Vernon, NJ with 10 climbing and ziplining courses set in the scenic Great Gorge. Features trails for all ages including purple trails designed for younger children.',
    address: '414 Route 94, Vernon, NJ 07462',
    googleMapsUrl: 'https://www.google.com/maps?q=414+Route+94+Vernon+NJ',
    distanceMiles: "55",
    driveTimeMinutes: 75,
    category: 'Outdoor Recreation',
    subcategory: 'Aerial Adventure Park',
    keyHighlights: '10 climbing and ziplining courses; trails for all ages including kids; scenic Great Gorge setting; free parking; seasonal operations',
    insiderTips: 'Book in advance for popular time slots. The purple trails are great for younger kids. Wear closed-toe shoes and comfortable clothing.',
    entryFee: '$35-$55 per person depending on course level',
    averageSpend: 100,
    bestSeasons: 'Spring through Fall',
    bestDay: 'Weekdays for shorter waits',
    parkingInfo: 'Free parking available',
    evCharging: 'Not available on-site',
    googleRating: "4.5",
    tripadvisorRating: "4.3",
    overallSentiment: 'Positive; families enjoy the adventure and scenic views',
    nearbyRestaurants: [
      { name: 'Mountain Creek restaurants', description: 'On-site at resort', distance: 'Nearby' }
    ],
    averageVisitDuration: '2-3 hours',
    upcomingEvents: 'Seasonal operations (check website)',
    imageUrl: '/images/treetop_adventure_zi_6b0d9a83.jpg',
    visited: false
  },
  {
    name: 'Darlington County Park',
    overview: 'Family-friendly county park centered on two lifeguarded swimming lakes with sandy beaches, the seasonal Wibit Splash Zone inflatable water course, picnic areas, playgrounds, and open lawns. A low-stress beach-day alternative.',
    address: '600 Darlington Ave, Mahwah, NJ 07430',
    googleMapsUrl: 'https://maps.google.com/?q=Darlington%20County%20Park,%20600%20Darlington%20Ave,%20Mahwah,%20NJ',
    distanceMiles: "35",
    driveTimeMinutes: 50,
    category: 'Park',
    subcategory: 'County Park / Swimming',
    keyHighlights: 'Two lifeguarded swimming lakes; sandy beaches; Wibit Splash Zone; shallow roped areas for kids; picnic areas; playgrounds; on-site restrooms',
    insiderTips: 'Arrive early on hot weekends to secure parking and good beach spots. Bring your own picnic to save money. The Wibit course has age/height requirements.',
    entryFee: 'Parking fee $5-10 (varies by residency); Wibit additional fee',
    averageSpend: 40,
    bestSeasons: 'Summer (Memorial Day to Labor Day)',
    bestDay: 'Weekdays for less crowded beaches',
    parkingInfo: 'On-site parking available; fills up on hot weekends',
    evCharging: 'Not available',
    googleRating: "4.4",
    tripadvisorRating: "4.2",
    overallSentiment: 'Positive; great summer destination for families with young kids',
    nearbyRestaurants: [
      { name: 'Mahwah area restaurants', description: 'Various options nearby', distance: '~10 min drive' }
    ],
    averageVisitDuration: '4-6 hours',
    upcomingEvents: 'Seasonal swimming (Memorial Day to Labor Day)',
    imageUrl: '/images/swimming_lake_beach__4c4a20f3.jpg',
    visited: false
  },
  {
    name: 'Highlands Natural Pool',
    overview: 'Unique, Olympic-sized, stream-fed, chemical-free swimming pool in a forested setting beside Norvin Green State Forest. Low-tech and family-focused with lifeguards, a roped shallow area, picnic tables, and adjacent hiking.',
    address: '180 Snake Den Rd, Ringwood, NJ 07456',
    googleMapsUrl: 'https://www.google.com/maps/place/Highlands+Natural+Pool,+180+Snake+Den+Rd,+Ringwood+NJ',
    distanceMiles: "45",
    driveTimeMinutes: 65,
    category: 'Outdoor Recreation',
    subcategory: 'Natural Swimming Pool',
    keyHighlights: 'Chemical-free stream-fed pool; Olympic-sized; forested natural setting; lifeguards on duty; shallow area for young kids; adjacent hiking trails; no alcohol/loud music policy',
    insiderTips: 'Arrive early as parking is limited. Bring cash for entry fee. The water can be cold—bring towels. Limited or no cell service. Great for combining with a nature hike.',
    entryFee: '$10-15 per person',
    averageSpend: 30,
    bestSeasons: 'Summer (June to Labor Day)',
    bestDay: 'Weekdays for a peaceful experience',
    parkingInfo: 'Limited parking; arrive early',
    evCharging: 'Not available',
    googleRating: "4.6",
    tripadvisorRating: "4.5",
    overallSentiment: 'Very positive; families love the natural setting and peaceful atmosphere',
    nearbyRestaurants: [
      { name: 'Bring your own picnic', description: 'Limited food options nearby', distance: 'N/A' }
    ],
    averageVisitDuration: '3-5 hours',
    upcomingEvents: 'Open seasonally June-Labor Day',
    imageUrl: '/images/natural_swimming_poo_a319ea2e.jpg',
    visited: false
  },
  {
    name: 'Please Touch Museum',
    overview: 'One of Philadelphia\'s most beloved children\'s museums, designed for kids under age 10. Offers fully interactive, sensory-rich exhibits that encourage hands-on play and learning through imagination, art, and science.',
    address: '4231 Avenue of the Republic, Philadelphia, PA 19131',
    googleMapsUrl: 'https://www.google.com/maps/place/Please+Touch+Museum',
    distanceMiles: "55",
    driveTimeMinutes: 70,
    category: 'Museum',
    subcategory: 'Childrens Museum',
    keyHighlights: 'Designed for kids under 10; themed zones (miniature city, water play, space exploration); Alice in Wonderland exhibit; hands-on sensory-rich experiences',
    insiderTips: 'Book timed entry tickets in advance. Arrive at opening for the best experience. Bring a change of clothes for water play areas. Weekday mornings are less crowded.',
    entryFee: 'Adults and Children: ~$25, Free for under 1',
    averageSpend: 80,
    bestSeasons: 'Year-round (indoor)',
    bestDay: 'Weekday mornings',
    parkingInfo: 'On-site paid parking available',
    evCharging: 'Limited availability',
    googleRating: "4.6",
    tripadvisorRating: "4.5",
    overallSentiment: 'Excellent; parents praise the engaging activities and educational value',
    nearbyRestaurants: [
      { name: 'Museum cafe', description: 'On-site dining', distance: 'Inside' },
      { name: 'Philadelphia area restaurants', description: 'Various options', distance: 'Nearby' }
    ],
    averageVisitDuration: '3-4 hours',
    upcomingEvents: 'Rotating exhibits and special programming',
    imageUrl: '/images/children_museum_play_aadb7d82.jpg',
    visited: false
  },
  {
    name: 'Pochuck Boardwalk (Appalachian Trail)',
    overview: 'Nearly flat 0.9-mile boardwalk through marsh along the Appalachian Trail, featuring a 110-ft suspension bridge. Great for spotting turtles, birds, and wildflowers. A quintessential kid-friendly stretch of the AT.',
    address: 'NJ-517 (Wawayanda Rd) at Meadowlark Dr, Glenwood, Vernon Township, NJ 07418',
    googleMapsUrl: 'https://www.google.com/maps/place/Pochuck+Boardwalk',
    distanceMiles: "60",
    driveTimeMinutes: 85,
    category: 'Outdoor Recreation',
    subcategory: 'Hiking Trail / Nature Boardwalk',
    keyHighlights: 'Nearly flat 0.9-mile boardwalk; 110-ft suspension bridge; turtles, birds, wildflowers; part of Appalachian Trail; kid-friendly and stroller-accessible',
    insiderTips: 'Wear sturdy shoes even though it\'s flat. Bring bug spray in summer. The suspension bridge is a highlight—great for photos. Best in spring/fall for wildlife.',
    entryFee: 'Free',
    averageSpend: 10,
    bestSeasons: 'Spring and Fall for wildlife; Summer mornings',
    bestDay: 'Any day; weekdays for fewer hikers',
    parkingInfo: 'Small parking area at trailhead',
    evCharging: 'Not available',
    googleRating: "4.7",
    tripadvisorRating: "4.6",
    overallSentiment: 'Excellent; families love the accessible nature walk and suspension bridge',
    nearbyRestaurants: [
      { name: 'Vernon area restaurants', description: 'Various options', distance: '~15 min drive' }
    ],
    averageVisitDuration: '1-2 hours',
    upcomingEvents: 'Open year-round (best spring-fall)',
    imageUrl: '/images/wooden_boardwalk_nat_19446e46.jpg',
    visited: false
  },
  {
    name: 'Mountain Creek Zip Tours',
    overview: 'Guided 2-hour zipline tour at Mountain Creek Resort in Vernon, NJ featuring multiple ziplines (200–1,500 ft) over a mountaintop lake and panoramic tri-state views. Note: weight limits mean most 5-year-olds are too light.',
    address: 'Mountain Creek Resort, Vernon, NJ',
    googleMapsUrl: 'https://www.google.com/maps/place/Mountain+Creek+Resort',
    distanceMiles: "55",
    driveTimeMinutes: 75,
    category: 'Outdoor Recreation',
    subcategory: 'Zipline Tour',
    keyHighlights: '2-hour guided tour; multiple ziplines up to 1,500 ft; mountaintop lake views; tri-state panoramic views; Cabriolet lift ride to start',
    insiderTips: 'Check weight/height requirements before booking—most young kids are too light. Pair with other Mountain Creek activities. Book in advance for summer weekends.',
    entryFee: '$80-100 per person',
    averageSpend: 150,
    bestSeasons: 'Spring through Fall',
    bestDay: 'Weekdays for smaller groups',
    parkingInfo: 'Resort parking available',
    evCharging: 'Limited availability at resort',
    googleRating: "4.5",
    tripadvisorRating: "4.3",
    overallSentiment: 'Positive; thrilling experience with beautiful views (check age requirements)',
    nearbyRestaurants: [
      { name: 'Mountain Creek Lodge restaurants', description: 'On-site dining', distance: 'At resort' }
    ],
    averageVisitDuration: '2-3 hours',
    upcomingEvents: 'Seasonal operations',
    imageUrl: '/images/mountain_zipline_adv_05df36b9.jpg',
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
    insiderTips: 'Purchase tickets online to save money and skip lines. Visit on weekday mornings for smaller crowds. The shark tunnel is best experienced early.',
    entryFee: 'Adults: $35, Children (2-12): $25, under 2 free',
    averageSpend: 120,
    bestSeasons: 'Year-round indoor attraction',
    bestDay: 'Tuesday or Wednesday mornings',
    parkingInfo: 'Paid parking garage adjacent ($15-20)',
    evCharging: 'EV charging at nearby parking facilities',
    googleRating: "4.4",
    tripadvisorRating: "4.0",
    overallSentiment: 'Very positive; visitors love the hippos and shark tunnel',
    nearbyRestaurants: [
      { name: 'Chickies & Petes', description: 'Family sports bar, famous crabfries', distance: 'Adjacent' },
      { name: 'Iron Hill Brewery', description: 'Craft brewery with full menu', distance: '0.2 mi' }
    ],
    averageVisitDuration: '3-4 hours',
    upcomingEvents: 'Penguin Encounter experiences, Dive with Sharks programs',
    imageUrl: '/images/aquarium_sharks_unde_c8aeb6d6.jpg',
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
    insiderTips: 'Wear comfortable walking shoes. Pick up a family guide at entrance for kid-friendly descriptions. The Peacock Cafe requires reservations on weekends.',
    entryFee: 'Adults: $20, Children (under 10): Free, Students/Seniors: $18',
    averageSpend: 75,
    bestSeasons: 'Spring (blooming gardens) and Fall (autumn colors)',
    bestDay: 'Friday for quieter experience',
    parkingInfo: 'Free on-site parking lot',
    evCharging: 'No dedicated EV charging currently',
    googleRating: "4.6",
    tripadvisorRating: "4.5",
    overallSentiment: 'Excellent; visitors praise the beautiful setting and diverse artwork',
    nearbyRestaurants: [
      { name: 'Rats Restaurant', description: 'Fine dining on-site inspired by Monets Giverny' },
      { name: 'Van Goghs Ear Cafe', description: 'Casual cafe with sandwiches and pastries' }
    ],
    averageVisitDuration: '2-3 hours',
    upcomingEvents: 'Summer Concert Series, Holiday Light Show (December)',
    imageUrl: '/images/sculpture_garden_out_8ffaa6d4.jpg',
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
      const { search, category, sort, kidFriendly, indoorOutdoor, maxDistance, minRating, wheelchairAccessible, favoritesOnly } = req.query as any;
      
      // Build filter options
      let favoriteIds: number[] | undefined;
      if (favoritesOnly === 'true') {
        favoriteIds = await storage.getFavorites();
      }

      const places = await storage.getPlaces({
        search,
        category,
        sort,
        kidFriendly: kidFriendly === 'true',
        indoorOutdoor: indoorOutdoor as 'indoor' | 'outdoor' | 'all' | undefined,
        maxDistance: maxDistance ? parseFloat(maxDistance) : undefined,
        minRating: minRating ? parseFloat(minRating) : undefined,
        wheelchairAccessible: wheelchairAccessible === 'true',
        favoriteIds,
      });
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

  // === Google Places Review Analysis API ===
  app.get("/api/places/:id/reviews", async (req, res) => {
    try {
      const place = await storage.getPlace(Number(req.params.id));
      if (!place) {
        return res.status(404).json({ message: "Place not found" });
      }

      const analysis = await getReviewAnalysis(place.name, place.address || undefined);
      res.json(analysis);
    } catch (error) {
      console.error("Error fetching review analysis:", error);
      res.status(500).json({ message: "Failed to analyze reviews" });
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

  // === Import from Google Maps URL ===
  app.post("/api/places/import-url", async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ success: false, error: "URL is required" });
      }
      
      const result = await lookupPlaceFromUrl(url);
      
      if (!result.success || !result.place) {
        return res.status(400).json({ success: false, error: result.error || "Failed to lookup place" });
      }
      
      // Validate and fill required fields
      const validatedPlace = validateAndFillPlace(result.place);
      if (!validatedPlace) {
        return res.status(400).json({ success: false, error: "Could not determine place name from URL" });
      }
      
      // Create the place in database
      const place = await storage.createPlace(validatedPlace);
      
      res.json({ success: true, place });
    } catch (error) {
      console.error("Import URL error:", error);
      res.status(500).json({ success: false, error: "Failed to import from URL" });
    }
  });

  // === Import from Voice Transcript ===
  app.post("/api/places/import-voice", async (req, res) => {
    try {
      const { transcript } = req.body;
      
      if (!transcript) {
        return res.status(400).json({ success: false, error: "Voice transcript is required" });
      }
      
      const result = await processVoiceTranscript(transcript);
      
      if (!result.success || !result.place) {
        return res.status(400).json({ success: false, error: result.error || "Failed to process voice input" });
      }
      
      // Validate and fill required fields
      const validatedPlace = validateAndFillPlace(result.place);
      if (!validatedPlace) {
        return res.status(400).json({ success: false, error: "Could not determine place name from voice input" });
      }
      
      // Create the place in database
      const place = await storage.createPlace(validatedPlace);
      
      res.json({ success: true, place });
    } catch (error) {
      console.error("Import voice error:", error);
      res.status(500).json({ success: false, error: "Failed to import from voice" });
    }
  });

  // === Lookup place by name (for enhanced screenshot extraction) ===
  app.post("/api/places/lookup", async (req, res) => {
    try {
      const { name, context } = req.body;
      
      if (!name) {
        return res.status(400).json({ success: false, error: "Place name is required" });
      }
      
      const result = await lookupPlaceByName(name, context);
      
      if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
      }
      
      res.json({ success: true, place: result.place });
    } catch (error) {
      console.error("Lookup error:", error);
      res.status(500).json({ success: false, error: "Failed to lookup place" });
    }
  });

  // === Favorites API ===
  app.get("/api/favorites", async (req, res) => {
    try {
      const favoriteIds = await storage.getFavorites();
      res.json(favoriteIds);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  app.post("/api/favorites/:placeId", async (req, res) => {
    try {
      const placeId = Number(req.params.placeId);
      const favorite = await storage.addFavorite(placeId);
      res.json(favorite);
    } catch (error) {
      console.error("Error adding favorite:", error);
      res.status(500).json({ message: "Failed to add favorite" });
    }
  });

  app.delete("/api/favorites/:placeId", async (req, res) => {
    try {
      const placeId = Number(req.params.placeId);
      await storage.removeFavorite(placeId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing favorite:", error);
      res.status(500).json({ message: "Failed to remove favorite" });
    }
  });

  return httpServer;
}
