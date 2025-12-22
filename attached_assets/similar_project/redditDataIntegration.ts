// src/lib/redditDataIntegration.ts
import axios from 'axios';

/**
 * Enhanced Reddit data integration for the weekend planner tool
 * Fetches and processes Reddit data for a given destination
 */
export async function fetchEnhancedRedditData(destinationName: string) {
  try {
    // In a real implementation, this would use the Reddit API
    // For now, we'll simulate the API response
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simulate Reddit API response
    return {
      subreddits: ['travel', 'NewJersey', 'FoodRecommendations', 'FamilyTravel', 'roadtrip'],
      posts: [
        {
          title: `Hidden gems in ${destinationName}`,
          content: `I've been to ${destinationName} 5 times and these are my favorite spots that tourists don't know about: 
          1. The secluded beach on the north side that's only accessible by a hidden trail
          2. The family-owned Italian restaurant on Oak Street with the best homemade pasta
          3. The lookout point at sunset that gives you panoramic views without the crowds
          4. The local craft brewery that does free tastings on Thursdays
          5. The historic walking tour led by a retired history professor (not the commercial tours)`,
          upvotes: 245,
          comments: 78,
          url: `https://www.reddit.com/r/travel/comments/hidden_gems_in_${destinationName.toLowerCase().replace(/\s+/g, '_')}`,
          subreddit: 'travel',
          author: 'TravelExplorer92',
          date: '2025-03-15'
        },
        {
          title: `${destinationName} parking tips`,
          content: `Pro tip: Don't park at the main lot, it's always full and overpriced ($25/day). Instead, use the secondary lot on Oak Street ($10/day) or the free street parking on Maple Avenue (2 blocks further but worth the savings). If you're staying overnight, many B&Bs offer free parking passes for guests - ask when booking. For EV owners, there are 4 charging stations at the visitor center and 2 at the main shopping center.`,
          upvotes: 189,
          comments: 42,
          url: `https://www.reddit.com/r/NewJersey/comments/${destinationName.toLowerCase().replace(/\s+/g, '_')}_parking_tips`,
          subreddit: 'NewJersey',
          author: 'NJLocalExpert',
          date: '2025-03-22'
        },
        {
          title: `Best time to visit ${destinationName}?`,
          content: `Locals say September is the best month. Weather is still warm (70-80°F), crowds are gone after Labor Day, and prices drop significantly (30-40% less for accommodations). Most attractions remain open but without the lines. The water is still warm enough for swimming, and restaurants don't require hour-long waits for a table. If you can't make September, early June is the next best option - before the major summer crowds but with great weather.`,
          upvotes: 132,
          comments: 56,
          url: `https://www.reddit.com/r/travel/comments/best_time_to_visit_${destinationName.toLowerCase().replace(/\s+/g, '_')}`,
          subreddit: 'travel',
          author: 'SeasonalTraveler',
          date: '2025-02-18'
        },
        {
          title: `${destinationName} food recommendations`,
          content: `Skip the tourist traps on Main Street. The best seafood is at Captain's Cove (get the daily catch), and for breakfast you can't beat Morning Glory Cafe (arrive before 9am to avoid the line). For budget options, the food trucks at Harbor Park offer amazing value - especially the fish tacos from Sea Breeze truck. The Farmer's Market on Saturdays has great local food vendors and artisanal products. For fine dining, make reservations at The Lighthouse Restaurant at least 2 weeks in advance.`,
          upvotes: 210,
          comments: 65,
          url: `https://www.reddit.com/r/FoodRecommendations/comments/${destinationName.toLowerCase().replace(/\s+/g, '_')}_food`,
          subreddit: 'FoodRecommendations',
          author: 'FoodieExplorer',
          date: '2025-04-01'
        },
        {
          title: `Things to do in ${destinationName} with kids`,
          content: `The interactive museum was a hit with my 7 and 10 year olds - they have hands-on exhibits and special weekend workshops. The nature center also has great programs on weekends with guided walks designed for children. The mini-golf course near the boardwalk is themed and reasonably priced. For rainy days, check out the indoor play center at the community complex. The best beach for kids is the south bay beach - calmer waters and tide pools for exploring. Many restaurants have kids-eat-free specials on Tuesdays.`,
          upvotes: 178,
          comments: 34,
          url: `https://www.reddit.com/r/FamilyTravel/comments/things_to_do_in_${destinationName.toLowerCase().replace(/\s+/g, '_')}_with_kids`,
          subreddit: 'FamilyTravel',
          author: 'TravelingParent',
          date: '2025-03-05'
        },
        {
          title: `Weekend trip to ${destinationName} - itinerary advice`,
          content: `Planning a 3-day weekend in ${destinationName} next month. Current itinerary:
          Day 1: Arrive Friday afternoon, check into B&B, explore downtown, dinner at seafood place
          Day 2: Beach morning, historical tour afternoon, sunset cruise
          Day 3: Nature preserve hike, lunch, then head home
          
          Is this too packed? Any must-see attractions I'm missing? Best place for the sunset cruise? Looking for a mix of relaxation and activities.`,
          upvotes: 95,
          comments: 47,
          url: `https://www.reddit.com/r/roadtrip/comments/weekend_trip_to_${destinationName.toLowerCase().replace(/\s+/g, '_')}`,
          subreddit: 'roadtrip',
          author: 'WeekendPlanner',
          date: '2025-03-28'
        },
        {
          title: `${destinationName} accessibility information`,
          content: `For those with mobility issues, I wanted to share my experience visiting ${destinationName} last month. The main boardwalk is fully accessible with ramps at every entrance. Beach wheelchairs are available free of charge - reserve at the main pavilion 24hrs in advance. Most restaurants downtown have step-free entrances, but call ahead for the historic buildings. The visitor center has detailed accessibility maps. The scenic drive route has 5 accessible viewpoints with paved paths. The nature center has a 1-mile paved trail suitable for wheelchairs and strollers.`,
          upvotes: 156,
          comments: 28,
          url: `https://www.reddit.com/r/travel/comments/${destinationName.toLowerCase().replace(/\s+/g, '_')}_accessibility`,
          subreddit: 'travel',
          author: 'AccessibleTraveler',
          date: '2025-02-25'
        },
        {
          title: `${destinationName} on a budget - possible?`,
          content: `Is it possible to enjoy ${destinationName} without spending a fortune? Looking for budget accommodation, free/cheap activities, and affordable dining options. Traveling with my partner in May, can only spend about $500 total for a 3-day weekend (not including transportation to get there). Any tips from budget travelers who've visited recently?`,
          upvotes: 143,
          comments: 62,
          url: `https://www.reddit.com/r/Shoestring/comments/${destinationName.toLowerCase().replace(/\s+/g, '_')}_on_a_budget`,
          subreddit: 'Shoestring',
          author: 'BudgetWanderer',
          date: '2025-03-10'
        },
        {
          title: `Photography spots in ${destinationName}`,
          content: `Photographer heading to ${destinationName} next week. Looking for recommendations on the best photography spots, particularly for:
          - Sunrise/sunset locations
          - Wildlife opportunities
          - Interesting architecture
          - Landscape vistas
          
          Also, any permits needed for tripods or commercial photography? Best time of day for the main attractions? Any local photographers willing to share their favorite hidden spots?`,
          upvotes: 87,
          comments: 31,
          url: `https://www.reddit.com/r/photography/comments/photo_spots_${destinationName.toLowerCase().replace(/\s+/g, '_')}`,
          subreddit: 'photography',
          author: 'LandscapeShooter',
          date: '2025-04-05'
        },
        {
          title: `${destinationName} vs other NJ destinations`,
          content: `How does ${destinationName} compare to other popular NJ destinations like Asbury Park, Cape May, or Long Beach Island? Planning a summer trip and trying to decide between them. Looking for a good mix of beaches, dining, and activities. Family-friendly is a plus. Which has the best value for money? Least crowded? Best food scene? Most to do on rainy days?`,
          upvotes: 112,
          comments: 73,
          url: `https://www.reddit.com/r/NewJersey/comments/${destinationName.toLowerCase().replace(/\s+/g, '_')}_comparison`,
          subreddit: 'NewJersey',
          author: 'JerseyShoreHopper',
          date: '2025-03-18'
        }
      ],
      comments: [
        {
          postTitle: `Hidden gems in ${destinationName}`,
          content: "Don't forget the artisan ice cream shop on Harbor Street - they make their waffle cones fresh and have unique flavors that change daily. It's pricey but worth it for a special treat.",
          upvotes: 78,
          author: 'IceCreamFanatic',
          date: '2025-03-15'
        },
        {
          postTitle: `${destinationName} food recommendations`,
          content: "I second the Captain's Cove recommendation. Their seafood boil is enough for two people and comes with the freshest shellfish. If you go Thursday-Saturday, they have live music on the deck starting at 7pm.",
          upvotes: 45,
          author: 'SeafoodLover',
          date: '2025-04-02'
        },
        {
          postTitle: `Best time to visit ${destinationName}?`,
          content: "Local here. September is definitely the best month, but I'd add that weekdays in May are also excellent. The weather is warming up, flowers are blooming, and it's before the Memorial Day rush that starts the tourist season.",
          upvotes: 67,
          author: 'LocalResident',
          date: '2025-02-19'
        }
      ]
    };
  } catch (error) {
    console.error('Error fetching enhanced Reddit data:', error);
    return null;
  }
}

/**
 * Extract attractions mentioned in Reddit posts
 */
export function extractRedditAttractions(redditData: any) {
  const attractions = [];
  
  if (!redditData || !redditData.posts) {
    return attractions;
  }
  
  // Look for posts about hidden gems, things to do, etc.
  const relevantPosts = redditData.posts.filter((post: any) => 
    post.title.includes('Hidden gems') || 
    post.title.includes('Things to do') ||
    post.title.includes('Weekend trip') ||
    post.content.includes('favorite spots') ||
    post.content.includes('must-see')
  );
  
  for (const post of relevantPosts) {
    // Look for numbered lists or bullet points in content
    const lines = post.content.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      // Check for numbered list items or bullet points
      if (/^\d+\./.test(trimmedLine) || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
        const attractionText = trimmedLine.replace(/^\d+\.\s*|-\s*|\*\s*/, '').trim();
        if (attractionText.length > 10) {
          attractions.push({
            name: attractionText.split(' - ')[0] || attractionText.substring(0, 30),
            description: attractionText,
            source: `Reddit (u/${post.author})`,
            upvotes: post.upvotes,
            url: post.url
          });
        }
      }
    }
  }
  
  return attractions;
}

/**
 * Extract insider tips from Reddit data
 */
export function extractRedditTips(redditData: any) {
  const tips = [];
  
  if (!redditData || !redditData.posts) {
    return tips;
  }
  
  // Extract tips from post titles and content
  for (const post of redditData.posts) {
    if (post.title.includes('tip') || 
        post.title.includes('advice') || 
        post.content.includes('Pro tip') ||
        post.content.includes('recommend') ||
        post.content.includes('best way to')
    ) {
      // For posts specifically about tips, extract key sentences
      const sentences = post.content.split(/\.\s+/);
      for (const sentence of sentences) {
        if (sentence.includes('tip') || 
            sentence.includes('recommend') || 
            sentence.includes('best') ||
            sentence.includes('don\'t miss') ||
            sentence.includes('avoid')
        ) {
          tips.push({
            content: sentence.trim() + '.',
            source: `Reddit (u/${post.author} in r/${post.subreddit})`,
            upvotes: post.upvotes,
            url: post.url
          });
        }
      }
    }
  }
  
  // Extract tips from comments
  if (redditData.comments) {
    for (const comment of redditData.comments) {
      if (comment.content.includes('tip') || 
          comment.content.includes('recommend') || 
          comment.content.includes('suggest') ||
          comment.content.includes('don\'t miss')
      ) {
        tips.push({
          content: comment.content,
          source: `Reddit (u/${comment.author}, comment)`,
          upvotes: comment.upvotes,
          postTitle: comment.postTitle
        });
      }
    }
  }
  
  return tips;
}

/**
 * Extract best times to visit from Reddit data
 */
export function extractRedditBestTimes(redditData: any) {
  let yearSeason = '';
  let weekDay = '';
  let timeOfDay = '';
  
  if (!redditData || !redditData.posts) {
    return { yearSeason, weekDay, timeOfDay };
  }
  
  // Look for posts about timing
  const timingPosts = redditData.posts.filter((post: any) => 
    post.title.includes('Best time') || 
    post.title.includes('When to visit') ||
    post.content.includes('best time') ||
    post.content.includes('best month') ||
    post.content.includes('best season')
  );
  
  for (const post of timingPosts) {
    const content = post.content.toLowerCase();
    
    // Extract season/month information
    if (content.includes('month') || 
        content.includes('season') || 
        content.includes('spring') || 
        content.includes('summer') || 
        content.includes('fall') || 
        content.includes('winter') ||
        content.includes('january') ||
        content.includes('february') ||
        content.includes('march') ||
        content.includes('april') ||
        content.includes('may') ||
        content.includes('june') ||
        content.includes('july') ||
        content.includes('august') ||
        content.includes('september') ||
        content.includes('october') ||
        content.includes('november') ||
        content.includes('december')
    ) {
      // Find the sentence containing season/month information
      const sentences = post.content.split(/\.\s+/);
      for (const sentence of sentences) {
        if (sentence.toLowerCase().includes('month') || 
            sentence.toLowerCase().includes('season') ||
            /\b(spring|summer|fall|winter|january|february|march|april|may|june|july|august|september|october|november|december)\b/i.test(sentence)
        ) {
          yearSeason = `Reddit (u/${post.author}): ${sentence.trim()}.`;
          break;
        }
      }
    }
    
    // Extract day of week information
    if (content.includes('weekday') || 
        content.includes('weekend') || 
        content.includes('monday') || 
        content.includes('tuesday') || 
        content.includes('wednesday') || 
        content.includes('thursday') || 
        content.includes('friday') || 
        content.includes('saturday') || 
        content.includes('sunday')
    ) {
      // Find the sentence containing day of week information
      const 
(Content truncated due to size limit. Use line ranges to read in chunks)