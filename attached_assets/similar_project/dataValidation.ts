// src/lib/dataValidation.ts
import { SearchResult, Attraction, DiningOption } from '@/types/search';

/**
 * Validates a search result to ensure all required data is present and accurate
 * @param result The search result to validate
 * @returns Validated search result with any corrections applied
 */
export function validateSearchResult(result: SearchResult): SearchResult {
  // Create a deep copy to avoid modifying the original
  const validatedResult = JSON.parse(JSON.stringify(result)) as SearchResult;
  
  // Validate basic information
  validatedResult.name = validateString(validatedResult.name, 'Unknown Destination');
  validatedResult.overview = validateString(validatedResult.overview, `Information about ${validatedResult.name}`);
  
  // Validate attractions
  validatedResult.attractions = validateAttractions(validatedResult.attractions, validatedResult.name);
  
  // Validate costs
  validatedResult.costs = {
    entryFee: validateString(validatedResult.costs?.entryFee, 'Information not available'),
    parkingFee: validateString(validatedResult.costs?.parkingFee, 'Information not available'),
    additionalCosts: validateString(validatedResult.costs?.additionalCosts, 'Information not available'),
    averageSpending: validateString(validatedResult.costs?.averageSpending, 'Information not available')
  };
  
  // Validate best times
  validatedResult.bestTimes = {
    yearSeason: validateString(validatedResult.bestTimes?.yearSeason, 'Information not available'),
    weekDay: validateString(validatedResult.bestTimes?.weekDay, 'Information not available'),
    timeOfDay: validateString(validatedResult.bestTimes?.timeOfDay, 'Information not available'),
    specialEvents: validateString(validatedResult.bestTimes?.specialEvents, 'Information not available')
  };
  
  // Validate parking
  validatedResult.parking = {
    evCharging: validateString(validatedResult.parking?.evCharging, 'Information not available'),
    accessibility: validateString(validatedResult.parking?.accessibility, 'Information not available'),
    generalParking: validateString(validatedResult.parking?.generalParking, 'Information not available')
  };
  
  // Validate tips
  validatedResult.tips = validateTips(validatedResult.tips, validatedResult.name);
  
  // Validate travel info
  validatedResult.travelInfo = {
    distanceFromSomerset: validateString(validatedResult.travelInfo?.distanceFromSomerset, 'Information not available'),
    travelTime: validateString(validatedResult.travelInfo?.travelTime, 'Information not available'),
    directions: validateString(validatedResult.travelInfo?.directions, 'Information not available'),
    publicTransportation: validateString(validatedResult.travelInfo?.publicTransportation, 'Information not available')
  };
  
  // Validate dining options
  validatedResult.diningOptions = validateDiningOptions(validatedResult.diningOptions, validatedResult.name);
  
  // Validate sources
  validatedResult.sources = validateSources(validatedResult.sources, validatedResult.name);
  
  // Validate visual elements
  validatedResult.visualElements = {
    mapUrl: validateString(validatedResult.visualElements?.mapUrl, `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(validatedResult.name)}&zoom=13&size=600x300&maptype=roadmap`),
    ratingVisuals: validatedResult.visualElements?.ratingVisuals ?? true,
    images: validateArray(validatedResult.visualElements?.images, [`https://source.unsplash.com/featured/?${encodeURIComponent(validatedResult.name)}`])
  };
  
  return validatedResult;
}

/**
 * Validates a string value and provides a default if invalid
 * @param value The string to validate
 * @param defaultValue Default value to use if invalid
 * @returns Validated string
 */
function validateString(value: string | undefined, defaultValue: string): string {
  if (!value || value.trim() === '' || value.includes('undefined') || value.includes('null')) {
    return defaultValue;
  }
  return value;
}

/**
 * Validates an array and provides a default if invalid
 * @param value The array to validate
 * @param defaultValue Default array to use if invalid
 * @returns Validated array
 */
function validateArray<T>(value: T[] | undefined, defaultValue: T[]): T[] {
  if (!value || !Array.isArray(value) || value.length === 0) {
    return defaultValue;
  }
  return value;
}

/**
 * Validates attractions and ensures they are specific to the destination
 * @param attractions The attractions to validate
 * @param destinationName The name of the destination
 * @returns Validated attractions
 */
function validateAttractions(attractions: Attraction[] | undefined, destinationName: string): Attraction[] {
  if (!attractions || !Array.isArray(attractions) || attractions.length === 0) {
    return [{
      name: `${destinationName} Main Attraction`,
      description: `Information about attractions in ${destinationName} is being updated.`,
      seasonalAvailability: 'Information not available',
      popularityRating: 4.0
    }];
  }
  
  // Check each attraction for generic content
  return attractions.map(attraction => {
    // Check if the attraction name is generic
    const isGenericName = 
      attraction.name.includes('Main Attraction') ||
      attraction.name.includes('Additional Attraction') ||
      attraction.name.includes('Local Parks') ||
      attraction.name.includes('Cultural and Heritage Sites') ||
      attraction.name.includes('Shopping Districts');
    
    // Check if the description is generic
    const isGenericDescription =
      attraction.description.includes('Additional attractions in the') ||
      attraction.description.includes('Contact the local visitor center');
    
    // If either name or description is generic, mark it as needing verification
    if (isGenericName || isGenericDescription) {
      return {
        name: isGenericName ? `Attraction in ${destinationName}` : attraction.name,
        description: isGenericDescription ? 
          `This attraction information needs verification. Please check the official ${destinationName} tourism website for accurate details.` : 
          attraction.description,
        seasonalAvailability: validateString(attraction.seasonalAvailability, 'Information not available'),
        popularityRating: attraction.popularityRating || 4.0
      };
    }
    
    return {
      name: validateString(attraction.name, `Attraction in ${destinationName}`),
      description: validateString(attraction.description, `Information about this attraction in ${destinationName} is being updated.`),
      seasonalAvailability: validateString(attraction.seasonalAvailability, 'Information not available'),
      popularityRating: attraction.popularityRating || 4.0
    };
  });
}

/**
 * Validates tips and ensures they are specific to the destination
 * @param tips The tips to validate
 * @param destinationName The name of the destination
 * @returns Validated tips
 */
function validateTips(tips: string[] | undefined, destinationName: string): string[] {
  if (!tips || !Array.isArray(tips) || tips.length === 0) {
    return [`Check the official ${destinationName} tourism website for current visitor information and tips.`];
  }
  
  // Check each tip for generic content
  return tips.filter(tip => {
    // Filter out completely generic tips
    const isCompletelyGeneric = 
      tip.includes('Arrive early to popular attractions to avoid crowds') ||
      tip.includes('Many restaurants offer early bird specials') ||
      tip.includes('The visitor center offers free maps') ||
      tip.includes('Public water fountains are available') ||
      tip.includes('Most beaches have free public restrooms') ||
      tip.includes('The local bus system is reliable') ||
      tip.includes('Many attractions offer discounted tickets') ||
      tip.includes('The best sunset views are from') ||
      tip.includes('Local seafood is freshest at restaurants') ||
      tip.includes('Free public Wi-Fi is available');
    
    return !isCompletelyGeneric;
  }).map(tip => {
    // Check if the tip contains the destination name
    if (!tip.includes(destinationName)) {
      return `When visiting ${destinationName}: ${tip}`;
    }
    return tip;
  });
}

/**
 * Validates dining options and ensures they are specific to the destination
 * @param diningOptions The dining options to validate
 * @param destinationName The name of the destination
 * @returns Validated dining options
 */
function validateDiningOptions(diningOptions: DiningOption[] | undefined, destinationName: string): DiningOption[] {
  if (!diningOptions || !Array.isArray(diningOptions) || diningOptions.length === 0) {
    return [{
      name: `Restaurant in ${destinationName}`,
      cuisine: 'Local cuisine',
      priceRange: '$$',
      rating: 4.0,
      specialFeatures: `Information about restaurants in ${destinationName} is being updated.`
    }];
  }
  
  // Check each dining option for generic content
  return diningOptions.map(dining => {
    // Check if the dining name is generic
    const isGenericName = 
      dining.name.includes('Local') ||
      dining.name.startsWith('Restaurant');
    
    // Check if the special features are generic
    const isGenericFeatures =
      dining.specialFeatures.includes('Popular local dining option') ||
      dining.specialFeatures.includes('Contact the visitor center');
    
    // If either name or features is generic, mark it as needing verification
    if (isGenericName || isGenericFeatures) {
      return {
        name: isGenericName ? `Restaurant in ${destinationName}` : dining.name,
        cuisine: dining.cuisine || 'Local cuisine',
        priceRange: dining.priceRange || '$$',
        rating: dining.rating || 4.0,
        specialFeatures: isGenericFeatures ? 
          `This restaurant information needs verification. Please check recent reviews or the official ${destinationName} tourism website for accurate details.` : 
          dining.specialFeatures
      };
    }
    
    return {
      name: validateString(dining.name, `Restaurant in ${destinationName}`),
      cuisine: validateString(dining.cuisine, 'Local cuisine'),
      priceRange: validateString(dining.priceRange, '$$'),
      rating: dining.rating || 4.0,
      specialFeatures: validateString(dining.specialFeatures, `Information about this restaurant in ${destinationName} is being updated.`)
    };
  });
}

/**
 * Validates sources and ensures they are specific to the destination
 * @param sources The sources to validate
 * @param destinationName The name of the destination
 * @returns Validated sources
 */
function validateSources(sources: any[] | undefined, destinationName: string): any[] {
  if (!sources || !Array.isArray(sources) || sources.length === 0) {
    return [{
      title: `${destinationName} Official Tourism Website`,
      url: `https://www.google.com/search?q=${encodeURIComponent(destinationName)}+official+tourism+website`,
      description: 'Official tourism information'
    }];
  }
  
  // Ensure each source has the required fields
  return sources.map(source => {
    return {
      title: validateString(source.title, `Information about ${destinationName}`),
      url: validateString(source.url, `https://www.google.com/search?q=${encodeURIComponent(source.title || destinationName)}`),
      description: validateString(source.description, 'Source of information')
    };
  });
}

/**
 * Checks if content is likely to be generic by looking for common patterns
 * @param content The content to check
 * @param destinationName The name of the destination
 * @returns True if the content appears to be generic
 */
export function isGenericContent(content: string, destinationName: string): boolean {
  // Check for common patterns in generic content
  const genericPatterns = [
    'Contact the local visitor center',
    'Check the official website',
    'Information not available',
    'Information is being updated',
    'Additional attractions in the',
    'Popular local dining option',
    'This information needs verification'
  ];
  
  // Check if any generic pattern is found
  for (const pattern of genericPatterns) {
    if (content.includes(pattern)) {
      return true;
    }
  }
  
  // Check if the content is just a template with the destination name
  const templatePatterns = [
    `${destinationName} is a popular destination`,
    `${destinationName} offers visitors`,
    `When visiting ${destinationName}`,
    `Information about ${destinationName}`,
    `Attractions in ${destinationName}`,
    `Restaurants in ${destinationName}`
  ];
  
  // Check if any template pattern is found
  for (const pattern of templatePatterns) {
    if (content.includes(pattern)) {
      // If the content is just slightly longer than the template, it's likely generic
      if (content.length < pattern.length + 50) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Performs quality checks on a search result to identify potential issues
 * @param result The search result to check
 * @returns List of quality issues found
 */
export function performQualityChecks(result: SearchResult): string[] {
  const issues: string[] = [];
  
  // Check overview for generic content
  if (isGenericContent(result.overview, result.name)) {
    issues.push(`Overview appears to be generic content`);
  }
  
  // Check attractions for generic content
  const genericAttractions = result.attractions.filter(
    attraction => isGenericContent(attraction.description, result.name)
  );
  if (genericAttractions.length > 0) {
    issues.push(`${genericAttractions.length} attractions have generic descriptions`);
  }
  
  // Check costs for generic content
  if (isGenericContent(result.costs.entryFee, result.name) ||
      isGenericContent(result.costs.parkingFee, result.name) ||
      isGenericContent(result.costs.additionalCosts, result.name) ||
      isGenericContent(result.costs.averageSpending, result.name)) {
    issues.push(`Cost information appears to be generic`);
  }
  
  // Check best times for generic content
  if (isGenericContent(result.bestTimes.yearSeason, result.name) ||
      isGenericContent(result.bestTimes.weekDay, result.name) ||
      isGenericContent(result.bestTimes.timeOfDay, result.name) ||
      isGenericContent(result.bestTimes.specialEvents, result.name)) {
    issues.push(`Best times information appears to be generic`);
  }
  
  // Check parking for generic content
  if (isGenericContent(result.parking.evCharging, result.name) ||
      isGenericContent(result.parking.accessibility, result.name) ||
      isGenericContent(result.parking.generalParking, result.name)) {
    issues.push(`Parking information appears to be generic`);
  }
  
  // Check tips for generic content
  const genericTips = result.tips.filter(
    tip => isGenericContent(tip, result.name)
  );
  if (genericTips.length > 0) {
    issues.push(`${genericTips.length} tips appear to be generic`);
  }
  
  // Check travel info for generic content
  if (isGenericContent(result.travelInfo.distanceFromSomerset, result.name) ||
      isGenericContent(result.travelInfo.travelTime, result.name) ||
      isGenericContent(result.travelInfo.directions, result.name) ||
      isGenericContent(result.travelInfo.publicTransportation, result.name)) {
    issues.push(`Travel information appears to be generic`);
  }
  
  // Check dining options for generic content
  const genericDining = result.diningOptions.filter(
    dining => isGenericContent(dining.specialFeatures, result.name)
  );
  if (genericDining.length > 0) {
    issues.push(`${genericDining.length} dining options have generic descriptions`);
  }
  
  return issues;
}
