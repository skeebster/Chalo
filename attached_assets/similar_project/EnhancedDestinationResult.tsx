// src/components/EnhancedDestinationResult.tsx
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SearchResult, Attraction, DiningOption, SourceReference } from '@/types/search';

interface EnhancedDestinationResultProps {
  result: SearchResult;
}

const EnhancedDestinationResult: React.FC<EnhancedDestinationResultProps> = ({ result }) => {
  return (
    <div className="w-full max-w-6xl mx-auto">
      <Card className="w-full shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <CardTitle className="text-3xl font-bold">{result.name}</CardTitle>
          <CardDescription className="text-white text-opacity-90 text-lg">
            Weekend Destination Guide
          </CardDescription>
        </CardHeader>
        
        {/* Map and Overview Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          <div className="rounded-lg overflow-hidden shadow-md">
            {result.visualElements?.mapUrl && (
              <img 
                src={result.visualElements.mapUrl} 
                alt={`Map of ${result.name}`} 
                className="w-full h-64 object-cover"
              />
            )}
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Overview</h3>
            <p className="text-gray-700">{result.overview}</p>
            
            <div className="mt-4">
              <h4 className="font-medium text-gray-900">Travel from Somerset, NJ</h4>
              <p className="text-gray-700 mt-1">
                <span className="font-medium">Distance:</span> {result.travelInfo.distanceFromSomerset}
              </p>
              <p className="text-gray-700 mt-1">
                <span className="font-medium">Travel Time:</span> {result.travelInfo.travelTime}
              </p>
            </div>
          </div>
        </div>
        
        {/* Image Gallery */}
        {result.visualElements?.images && result.visualElements.images.length > 0 && (
          <div className="p-4">
            <h3 className="text-xl font-semibold mb-3">Destination Images</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {result.visualElements.images.map((image, index) => (
                <div key={index} className="rounded-lg overflow-hidden shadow-md h-40">
                  <img 
                    src={image} 
                    alt={`${result.name} - Image ${index + 1}`} 
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Detailed Information Tabs */}
        <CardContent className="p-4">
          <Tabs defaultValue="attractions" className="w-full">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 mb-4">
              <TabsTrigger value="attractions">Attractions</TabsTrigger>
              <TabsTrigger value="costs">Costs</TabsTrigger>
              <TabsTrigger value="bestTimes">Best Times</TabsTrigger>
              <TabsTrigger value="parking">Parking & Access</TabsTrigger>
              <TabsTrigger value="tips">Insider Tips</TabsTrigger>
              <TabsTrigger value="travel">Travel Info</TabsTrigger>
              <TabsTrigger value="dining">Dining</TabsTrigger>
              <TabsTrigger value="sources">Sources</TabsTrigger>
            </TabsList>
            
            {/* Attractions Tab */}
            <TabsContent value="attractions">
              <h3 className="text-xl font-semibold mb-3">Attractions & Things to Do</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.attractions.map((attraction, index) => (
                  <AttractionCard key={index} attraction={attraction} />
                ))}
              </div>
            </TabsContent>
            
            {/* Costs Tab */}
            <TabsContent value="costs">
              <h3 className="text-xl font-semibold mb-3">Cost Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Entry Fees</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{result.costs.entryFee}</p>
                  </CardContent>
                </Card>
                
                <Card className="shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Parking Fees</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{result.costs.parkingFee}</p>
                  </CardContent>
                </Card>
                
                <Card className="shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Additional Costs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{result.costs.additionalCosts}</p>
                  </CardContent>
                </Card>
                
                <Card className="shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Average Spending</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{result.costs.averageSpending}</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Best Times Tab */}
            <TabsContent value="bestTimes">
              <h3 className="text-xl font-semibold mb-3">Best Times to Visit</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Best Season / Time of Year</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{result.bestTimes.yearSeason}</p>
                  </CardContent>
                </Card>
                
                <Card className="shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Best Day of Week</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{result.bestTimes.weekDay}</p>
                  </CardContent>
                </Card>
                
                <Card className="shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Best Time of Day</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{result.bestTimes.timeOfDay}</p>
                  </CardContent>
                </Card>
                
                <Card className="shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Special Events</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{result.bestTimes.specialEvents}</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Parking & Accessibility Tab */}
            <TabsContent value="parking">
              <h3 className="text-xl font-semibold mb-3">Parking & Accessibility</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">General Parking</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{result.parking.generalParking}</p>
                  </CardContent>
                </Card>
                
                <Card className="shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">EV Charging</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{result.parking.evCharging}</p>
                  </CardContent>
                </Card>
                
                <Card className="shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Accessibility</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{result.parking.accessibility}</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Insider Tips Tab */}
            <TabsContent value="tips">
              <h3 className="text-xl font-semibold mb-3">Insider Tips & Preparation Advice</h3>
              <div className="grid grid-cols-1 gap-2">
                {result.tips.map((tip, index) => (
                  <Card key={index} className="shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mr-3">
                          <div className="bg-blue-100 text-blue-800 font-bold rounded-full w-8 h-8 flex items-center justify-center">
                            {index + 1}
                          </div>
                        </div>
                        <p className="text-gray-700">{tip}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            {/* Travel Info Tab */}
            <TabsContent value="travel">
              <h3 className="text-xl font-semibold mb-3">Travel Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Distance from Somerset</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{result.travelInfo.distanceFromSomerset}</p>
                  </CardContent>
                </Card>
                
                <Card className="shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Travel Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{result.travelInfo.travelTime}</p>
                  </CardContent>
                </Card>
                
                <Card className="shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Directions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{result.travelInfo.directions}</p>
                  </CardContent>
                </Card>
                
                <Card className="shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Public Transportation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{result.travelInfo.publicTransportation}</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Dining Tab */}
            <TabsContent value="dining">
              <h3 className="text-xl font-semibold mb-3">Top Dining Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.diningOptions.map((dining, index) => (
                  <DiningCard key={index} dining={dining} />
                ))}
              </div>
            </TabsContent>
            
            {/* Sources Tab */}
            <TabsContent value="sources">
              <h3 className="text-xl font-semibold mb-3">Information Sources</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.sources.map((source, index) => (
                  <SourceCard key={index} source={source} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="bg-gray-50 p-4 text-center text-gray-500 text-sm">
          Information last updated: {new Date().toLocaleDateString()}
        </CardFooter>
      </Card>
    </div>
  );
};

// Attraction Card Component
const AttractionCard: React.FC<{ attraction: Attraction }> = ({ attraction }) => {
  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          {attraction.name}
          <div className="ml-auto flex items-center">
            {[...Array(5)].map((_, i) => (
              <svg 
                key={i} 
                className={`w-4 h-4 ${i < Math.round(attraction.popularityRating) ? 'text-yellow-400' : 'text-gray-300'}`} 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
        </CardTitle>
        <CardDescription className="text-sm text-gray-500">
          {attraction.seasonalAvailability}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700">{attraction.description}</p>
      </CardContent>
    </Card>
  );
};

// Dining Card Component
const DiningCard: React.FC<{ dining: DiningOption }> = ({ dining }) => {
  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          {dining.name}
          <div className="ml-auto flex items-center">
            {[...Array(5)].map((_, i) => (
              <svg 
                key={i} 
                className={`w-4 h-4 ${i < Math.round(dining.rating) ? 'text-yellow-400' : 'text-gray-300'}`} 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
        </CardTitle>
        <CardDescription className="text-sm">
          <span className="text-gray-600">{dining.cuisine}</span>
          <span className="ml-2 font-medium text-gray-800">{dining.priceRange}</span>
        </CardDescription>
      </CardHeader>
      <CardCon
(Content truncated due to size limit. Use line ranges to read in chunks)