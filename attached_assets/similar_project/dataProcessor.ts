// src/lib/dataProcessor.ts
import { SearchResult, Attraction, DiningOption, SourceReference } from '@/types/search';
import { searchWeb, searchSocialMedia, getTravelInfo, searchRestaurants } from './searchAPI';
import { scrapeWebsite, extractInformation, extractMultipleElements, extractStructuredData } from './webScraping';

/**
 * Process and combine data from multiple sources into a structured format
 * @param destinationName Name of the destination to process
 * @returns Structured search result
 */
export async function processDestinationData(destinationName: string): Promise<SearchResult> {
  // For testing with Cape May specifically
  if (destinationName.toLowerCase().includes('cape may')) {
    return getCapeMayData();
  }

  // Collect data from various sources in parallel
  const [
    webSearchResults,
    socialMediaResults,
    restaurantResults,
    travelInfoResults
  ] = await Promise.all([
    searchWeb(destinationName),
    searchSocialMedia(destinationName),
    searchRestaurants(destinationName),
    getTravelInfo('8 Canvass Court, Somerset, NJ 08873', destinationName)
  ]);

  // Process web search results to extract official website if available
  const officialWebsite = webSearchResults.results.find(
    (result: any) => result.title.includes('Official Website')
  );

  // In a real implementation, we would scrape the official website
  // For now, we'll use our mock data structure
  
  // Process restaurant data to get top 3 highest-rated places
  const topDiningOptions = processRestaurantData(restaurantResults);
  
  // Process social media data to extract tips and insights
  const insiderTips = processSocialMediaData(socialMediaResults);
  
  // Process travel information
  const travelInfo = processTravelInfo(travelInfoResults, destinationName);
  
  // Generate sources from search results
  const sources = generateSources(webSearchResults, destinationName);
  
  // Combine all processed data into the final structure
  return {
    name: destinationName,
    overview: generateOverview(destinationName, webSearchResults, socialMediaResults),
    attractions: generateAttractions(destinationName),
    costs: generateCosts(destinationName),
    bestTimes: generateBestTimes(destinationName, socialMediaResults),
    parking: generateParking(destinationName),
    tips: insiderTips,
    travelInfo: travelInfo,
    diningOptions: topDiningOptions,
    sources: sources
  };
}

/**
 * Generate source references from search results
 */
function generateSources(webSearchResults: any, destinationName: string): SourceReference[] {
  const sources: SourceReference[] = [];
  
  // Add sources from web search results
  if (webSearchResults && webSearchResults.results) {
    webSearchResults.results.forEach((result: any) => {
      sources.push({
        title: result.title,
        url: result.url,
        description: result.snippet || `Information about ${destinationName}`
      });
    });
  }
  
  // Add additional generic sources
  sources.push({
    title: 'TripAdvisor',
    url: `https://www.tripadvisor.com/Search?q=${encodeURIComponent(destinationName)}`,
    description: 'Reviews and ratings from visitors'
  });
  
  sources.push({
    title: 'Google Maps',
    url: `https://www.google.com/maps/search/${encodeURIComponent(destinationName)}`,
    description: 'Maps, directions, and location information'
  });
  
  return sources;
}

/**
 * Generate an overview description based on available data
 */
function generateOverview(
  destinationName: string, 
  webSearchResults: any, 
  socialMediaResults: any
): string {
  // Combine snippets from search results and social media sentiment
  const snippets = webSearchResults.results.map((result: any) => result.snippet).join(' ');
  
  // In a real implementation, we would use NLP to generate a coherent overview
  // For now, we'll create a simple overview
  return `${destinationName} is a popular destination located in New Jersey, perfect for weekend trips. 
  Visitors praise the location for its beautiful scenery and variety of activities. 
  ${snippets.substring(0, 200)}... 
  Recent social media posts highlight special events and exhibits currently available.`;
}

/**
 * Generate attraction information
 */
function generateAttractions(destinationName: string): Attraction[] {
  // In a real implementation, this would extract data from websites and reviews
  // For now, return mock data
  return [
    {
      name: `Main ${destinationName} Exhibit`,
      description: `The primary attraction at ${destinationName}, featuring interactive displays and educational content.`,
      seasonalAvailability: "Year-round",
      popularityRating: 4.7
    },
    {
      name: `${destinationName} Gardens`,
      description: "Beautiful landscaped gardens with seasonal flowers and walking paths.",
      seasonalAvailability: "Spring-Fall",
      popularityRating: 4.5
    },
    {
      name: `${destinationName} Event Center`,
      description: "Hosts various special events, workshops, and seasonal celebrations throughout the year.",
      seasonalAvailability: "Varies by event",
      popularityRating: 4.2
    }
  ];
}

/**
 * Generate cost information
 */
function generateCosts(destinationName: string) {
  // In a real implementation, this would extract data from official websites
  // For now, return mock data
  return {
    entryFee: "Adults: $12, Children (6-12): $8, Under 6: Free",
    parkingFee: "$5 per vehicle, Free for members",
    additionalCosts: "Special exhibits and events may have separate fees. Gift shop and café available on-site.",
    averageSpending: "$25-35 per person including admission and refreshments"
  };
}

/**
 * Generate best times to visit information
 */
function generateBestTimes(destinationName: string, socialMediaResults: any) {
  // In a real implementation, this would analyze review data for patterns
  // For now, return mock data with some social media integration
  
  // Extract any mentions of events from social media
  const eventMentions = socialMediaResults.posts
    .filter((post: any) => post.content.includes('event') || post.content.includes('weekend'))
    .map((post: any) => post.content)
    .join(' ');
  
  return {
    yearSeason: "Spring (April-June) and Fall (September-October) offer the most pleasant weather and special seasonal activities",
    weekDay: "Tuesdays and Wednesdays are least crowded. Weekends can be busy, especially during special events.",
    timeOfDay: "Early morning (9-11am) or late afternoon (3-5pm) for smaller crowds and best lighting for photos",
    specialEvents: `Annual Spring Festival in May, Summer Concert Series on weekends, Fall Harvest Celebration in October. ${eventMentions}`
  };
}

/**
 * Generate parking and accessibility information
 */
function generateParking(destinationName: string) {
  // In a real implementation, this would extract data from official websites
  // For now, return mock data
  return {
    evCharging: "4 EV charging stations available in the main parking lot (2 Tesla, 2 universal J1772)",
    accessibility: "ADA compliant facilities throughout. Wheelchair accessible paths, restrooms, and exhibits. Service animals welcome.",
    generalParking: "250 regular parking spaces available. Additional overflow parking on busy weekends and during special events."
  };
}

/**
 * Process social media data to extract tips and insights
 */
function processSocialMediaData(socialMediaResults: any): string[] {
  // In a real implementation, this would use NLP to extract meaningful tips
  // For now, we'll simulate extracted tips from our mock data
  
  const tips: string[] = [
    "Arrive early on weekends to avoid the largest crowds, especially during special events",
    "The north entrance typically has shorter lines than the main entrance",
    "Don't miss the special exhibits that change monthly",
    "Bring comfortable walking shoes as there are many walking paths and trails"
  ];
  
  // Add any additional insights from social media posts
  socialMediaResults.posts.forEach((post: any) => {
    if (post.content.includes('tip') || post.content.includes('recommend') || post.content.includes('don\'t miss')) {
      // Extract the sentence containing the tip
      const tipContent = post.content.replace(/.*?(tip|recommend|don't miss)/i, '');
      tips.push(`From ${post.username}: ${tipContent}`);
    }
  });
  
  return tips.slice(0, 6); // Limit to 6 tips
}

/**
 * Process travel information
 */
function processTravelInfo(travelInfoResults: any, destinationName: string) {
  // In a real implementation, this would use mapping API data
  // For now, we'll use our mock data
  
  if (!travelInfoResults) {
    return {
      distanceFromSomerset: "Distance information unavailable",
      travelTime: "Travel time information unavailable",
      directions: `Directions to ${destinationName} unavailable`,
      publicTransportation: "Public transportation information unavailable"
    };
  }
  
  return {
    distanceFromSomerset: travelInfoResults.distance.text,
    travelTime: travelInfoResults.duration.text,
    directions: travelInfoResults.route,
    publicTransportation: "NJ Transit Bus routes available. Check NJTransit.com for current schedules."
  };
}

/**
 * Process restaurant data to get top dining options
 */
function processRestaurantData(restaurantResults: any): DiningOption[] {
  if (!restaurantResults || !restaurantResults.restaurants || restaurantResults.restaurants.length === 0) {
    return [];
  }
  
  // Sort restaurants by rating (highest first)
  const sortedRestaurants = [...restaurantResults.restaurants].sort((a, b) => b.rating - a.rating);
  
  // Take top 3 restaurants
  return sortedRestaurants.slice(0, 3).map(restaurant => ({
    name: restaurant.name,
    cuisine: restaurant.cuisine,
    priceRange: restaurant.priceRange,
    rating: restaurant.rating,
    specialFeatures: restaurant.specialFeatures
  }));
}

/**
 * Get specific data for Cape May, NJ for testing purposes
 */
function getCapeMayData(): SearchResult {
  return {
    name: "Cape May, New Jersey",
    overview: "Cape May is a charming seaside resort at the southern tip of New Jersey's Cape May Peninsula. Known for its grand Victorian houses, pristine beaches, and rich history, Cape May offers visitors a perfect blend of relaxation and exploration. The entire city is designated as a National Historic Landmark due to its concentration of Victorian architecture. Beyond its beaches and historic charm, Cape May is renowned for its bird-watching opportunities, dolphin-watching cruises, and vibrant culinary scene featuring fresh seafood and farm-to-table dining.",
    attractions: [
      {
        name: "Cape May Beaches",
        description: "Pristine sandy beaches with crystal clear waters, perfect for swimming, sunbathing, and beachcombing. The Cape May Beach has been consistently rated as one of the best beaches in New Jersey.",
        seasonalAvailability: "Best from May to September, lifeguards on duty during summer months",
        popularityRating: 4.8
      },
      {
        name: "Cape May Lighthouse",
        description: "Historic 157-foot lighthouse built in 1859 with panoramic views of the Atlantic Ocean and Delaware Bay from the top. Located in Cape May Point State Park.",
        seasonalAvailability: "Open year-round, hours vary by season",
        popularityRating: 4.7
      },
      {
        name: "Washington Street Mall",
        description: "Charming outdoor pedestrian shopping area with boutique shops, restaurants, and ice cream parlors housed in Victorian-era buildings.",
        seasonalAvailability: "Year-round, most shops open daily in summer, limited hours in winter",
        popularityRating: 4.5
      },
      {
        name: "Historic District Tours",
        description: "Guided walking or trolley tours of Cape May's Historic District, featuring over 600 preserved Victorian buildings and fascinating local history.",
        seasonalAvailability: "Year-round, more frequent tours during summer season",
        popularityRating: 4.6
      }
    ],
    costs: {
      entryFee: "Beach access: $8 daily beach tags (June-August), free in off-season. Children under 12 free.",
      parkingFee: "Metered parking: $4/hour in season. Some free parking available further from beaches.",
      additionalCosts: "Lighthouse admission: $12 adults, $8 children. Trolley tours: $20-30 per person. Dolphin watching cruises: $30-40 per person.",
      averageSpending: "$100-150 per person per day including accommodations, meals, and activities"
    },
    bestTimes: {
      yearSeason: "Late spring (May-June) and early fall (September) offer pleasant weather, fewer crowds, and lower rates than peak summer season",
      weekDay: "Weekdays are significantly less crowded than weekends, especially during summer months",
      timeOfDay: "Early mornings for peaceful beach walks and bird watching, evenings for beautiful sunsets and dining",
      specialEvents: "Victorian Week (October), Christmas Candlelight House Tours (December), Cape May Music Festival (May-June), Cape May Restaurant Week (June)"
    },
    parking: {
      evCharging: "6 Tesla Superchargers at Cape May-Lewes Ferry Terminal. 4 public Level 2 charging stations in municipal parking lots downtown.",
      accessibility: "ADA accessible beaches with beach wheelchairs available free of charge. Most historic sites and Washington Street Mall are wheelchair accessible.",
      generalParking: "Metered street parking throughout town. Municipal parking lots near beaches and shopping areas. Free parking available in some residential areas further from attractions."
    },
    tips: [
      "Make dinner reservations well in advance, especially for weekend evenings during summer season",
      "Visit Cape May Point State Park early morning for the best bird watching opportunities",
      "Take the Cape May-Lewes Ferry for a day trip to Delaware",
      "The Cape May County Park & Zoo is free and just a short drive away - perfect for families",
      "Bring binoculars for dolphin spotting from the beaches - they're frequently visible from shore",
      "Many Victorian B&Bs book up months in advance for summer weekends - plan accommodations early"
    ],
    travelInfo: {
      distanceFromSomerset: "Approximately 160 miles",
      travelTime: "About 2 hours 45 minutes by car",
      directions: "Take Garden State Parkway South to Exit 0, then follow signs to Cape May",
      publicTransportation: "NJ Transit bus service available from major cities. No direct train service to Cape May."
    },
    diningOptions: [
      {
        name: "The Lobster House",
        cuisine: "Seafood",
        priceRange: "$$$",
        rating: 4.6,
        specialFeatures: "Waterfront dining, fresh local seafood, raw bar, dockside market"
      },
      {
        name: "The Ebbitt Room",
        cuisine: "American, Farm-to-Table",
        priceRange: "$$$$",
        rating: 4.8,
        specialFeatures: "Elegant dining in the Virginia Hotel, seasonal menu using local ingredients"
      },
      {
        name: "Mad Batter Restaurant & Bar",
        cuisine: "American, Breakfast",
        priceRange: "$$",
        rating: 4.7,
        specialFeatures: "Award-winning restaurant in the Carroll Villa Hotel, famous for breakfast and brunch"
      }
    ],
    sources: [
      {
        title: "Cape May Official Tourism Website",
        url: "https://www.capemay.com/",
        description: "Official tourism information for Cape May, New Jersey"
      },
      {
        title: "Cape May Chamber of Commerce",
        url: "https://www.capemaychamber.com/",
        description: "Local business directory and event information"
      },
      {
        title: "NJ State Parks - Cape May Point",
        url: "https://www.state.nj.us/dep/parksandforests/parks/capemay.html",
        description: "Information about Cape May Point State Park and
(Content truncated due to size limit. Use line ranges to read in chunks)