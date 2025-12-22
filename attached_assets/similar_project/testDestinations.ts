// src/lib/testDestinations.ts
import { processImprovedDestinationData } from './improvedDataProcessor';
import { performQualityChecks } from './dataValidation';
import { SearchResult } from '@/types/search';

/**
 * Test the improved data processing with multiple sample destinations
 * @returns Test results for multiple destinations
 */
export async function testMultipleDestinations() {
  console.log('Testing multiple destinations...');
  
  // List of destinations to test
  const destinations = [
    'Cape May, NJ',
    'Atlantic City, NJ',
    'Philadelphia, PA',
    'New York, NY',
    'Princeton, NJ'
  ];
  
  const results: {
    destination: string;
    data: SearchResult;
    qualityIssues: string[];
    passed: boolean;
  }[] = [];
  
  // Process each destination
  for (const destination of destinations) {
    console.log(`Testing destination: ${destination}`);
    
    try {
      // Process the destination data
      const data = await processImprovedDestinationData(destination);
      
      // Perform quality checks
      const qualityIssues = performQualityChecks(data);
      
      // Determine if the test passed
      const passed = qualityIssues.length <= 2; // Allow up to 2 quality issues
      
      // Add to results
      results.push({
        destination,
        data,
        qualityIssues,
        passed
      });
      
      console.log(`Test for ${destination} ${passed ? 'passed' : 'failed'} with ${qualityIssues.length} quality issues`);
    } catch (error) {
      console.error(`Error testing ${destination}:`, error);
      
      // Add failed result
      results.push({
        destination,
        data: {
          name: destination,
          overview: `Error processing ${destination}`,
          attractions: [],
          costs: {
            entryFee: "Error",
            parkingFee: "Error",
            additionalCosts: "Error",
            averageSpending: "Error"
          },
          bestTimes: {
            yearSeason: "Error",
            weekDay: "Error",
            timeOfDay: "Error",
            specialEvents: "Error"
          },
          parking: {
            evCharging: "Error",
            accessibility: "Error",
            generalParking: "Error"
          },
          tips: ["Error"],
          travelInfo: {
            distanceFromSomerset: "Error",
            travelTime: "Error",
            directions: "Error",
            publicTransportation: "Error"
          },
          diningOptions: [],
          sources: [],
          visualElements: {
            mapUrl: "",
            ratingVisuals: false,
            images: []
          }
        },
        qualityIssues: ['Error processing destination'],
        passed: false
      });
    }
  }
  
  // Calculate overall test results
  const passedCount = results.filter(result => result.passed).length;
  const totalCount = results.length;
  const passRate = (passedCount / totalCount) * 100;
  
  console.log(`Test results: ${passedCount}/${totalCount} destinations passed (${passRate.toFixed(2)}%)`);
  
  return {
    results,
    passedCount,
    totalCount,
    passRate
  };
}

/**
 * Run a test for a specific destination
 * @param destination Name of the destination to test
 * @returns Test results for the destination
 */
export async function testDestination(destination: string) {
  console.log(`Testing destination: ${destination}`);
  
  try {
    // Process the destination data
    const data = await processImprovedDestinationData(destination);
    
    // Perform quality checks
    const qualityIssues = performQualityChecks(data);
    
    // Determine if the test passed
    const passed = qualityIssues.length <= 2; // Allow up to 2 quality issues
    
    console.log(`Test for ${destination} ${passed ? 'passed' : 'failed'} with ${qualityIssues.length} quality issues`);
    
    return {
      destination,
      data,
      qualityIssues,
      passed
    };
  } catch (error) {
    console.error(`Error testing ${destination}:`, error);
    
    return {
      destination,
      data: null,
      qualityIssues: ['Error processing destination'],
      passed: false
    };
  }
}
