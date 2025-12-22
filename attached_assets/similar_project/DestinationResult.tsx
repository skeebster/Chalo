// src/components/DestinationResult.tsx
'use client'
import { SearchResult } from '@/types/search'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MapPin, Clock, Calendar, Car, Utensils, Info, DollarSign, Lightbulb, Link } from 'lucide-react'

interface DestinationResultProps {
  result: SearchResult
}

export function DestinationResult({ result }: DestinationResultProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-semibold">{result.name}</h2>
        <div className="flex items-center text-muted-foreground">
          <MapPin className="h-4 w-4 mr-1" />
          <span>{result.travelInfo.distanceFromSomerset}</span>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-9 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attractions">Attractions</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
          <TabsTrigger value="bestTimes">Best Times</TabsTrigger>
          <TabsTrigger value="parking">Parking & Access</TabsTrigger>
          <TabsTrigger value="tips">Insider Tips</TabsTrigger>
          <TabsTrigger value="travel">Travel Info</TabsTrigger>
          <TabsTrigger value="dining">Dining</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
        </TabsList>

        <Card className="p-4">
          <TabsContent value="overview" className="mt-0">
            <div className="flex items-center mb-4">
              <Info className="h-5 w-5 mr-2" />
              <h3 className="text-xl font-medium">Destination Overview</h3>
            </div>
            <p className="whitespace-pre-line">{result.overview}</p>
          </TabsContent>

          <TabsContent value="attractions" className="mt-0">
            <div className="flex items-center mb-4">
              <MapPin className="h-5 w-5 mr-2" />
              <h3 className="text-xl font-medium">Main Attractions & Activities</h3>
            </div>
            <div className="space-y-4">
              {result.attractions.map((attraction, index) => (
                <div key={index} className="border-b pb-3 last:border-0">
                  <h4 className="font-medium">{attraction.name}</h4>
                  <p className="text-sm text-muted-foreground mb-1">{attraction.description}</p>
                  <div className="flex flex-wrap gap-x-4 text-sm">
                    <span>Availability: {attraction.seasonalAvailability}</span>
                    <span>Rating: {attraction.popularityRating}/5</span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="costs" className="mt-0">
            <div className="flex items-center mb-4">
              <DollarSign className="h-5 w-5 mr-2" />
              <h3 className="text-xl font-medium">Estimated Costs</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Entry Fee</span>
                <span className="font-medium">{result.costs.entryFee}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Parking Fee</span>
                <span className="font-medium">{result.costs.parkingFee}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Additional Costs</span>
                <span className="font-medium">{result.costs.additionalCosts}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Average Spending</span>
                <span className="font-medium">{result.costs.averageSpending}</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bestTimes" className="mt-0">
            <div className="flex items-center mb-4">
              <Calendar className="h-5 w-5 mr-2" />
              <h3 className="text-xl font-medium">Best Times to Visit</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Best Season</span>
                <span className="font-medium">{result.bestTimes.yearSeason}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Best Day of Week</span>
                <span className="font-medium">{result.bestTimes.weekDay}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Best Time of Day</span>
                <span className="font-medium">{result.bestTimes.timeOfDay}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Special Events</span>
                <span className="font-medium">{result.bestTimes.specialEvents}</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="parking" className="mt-0">
            <div className="flex items-center mb-4">
              <Car className="h-5 w-5 mr-2" />
              <h3 className="text-xl font-medium">EV Parking & Accessibility</h3>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">EV Charging</span>
                <span className="font-medium">{result.parking.evCharging}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Accessibility</span>
                <span className="font-medium">{result.parking.accessibility}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">General Parking</span>
                <span className="font-medium">{result.parking.generalParking}</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tips" className="mt-0">
            <div className="flex items-center mb-4">
              <Lightbulb className="h-5 w-5 mr-2" />
              <h3 className="text-xl font-medium">Insider Tips & Preparation</h3>
            </div>
            <ul className="space-y-2 list-disc pl-5">
              {result.tips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </TabsContent>

          <TabsContent value="travel" className="mt-0">
            <div className="flex items-center mb-4">
              <Clock className="h-5 w-5 mr-2" />
              <h3 className="text-xl font-medium">Travel Time & Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Distance from Somerset</span>
                <span className="font-medium">{result.travelInfo.distanceFromSomerset}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Travel Time</span>
                <span className="font-medium">{result.travelInfo.travelTime}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Directions</span>
                <span className="font-medium">{result.travelInfo.directions}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Public Transportation</span>
                <span className="font-medium">{result.travelInfo.publicTransportation}</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="dining" className="mt-0">
            <div className="flex items-center mb-4">
              <Utensils className="h-5 w-5 mr-2" />
              <h3 className="text-xl font-medium">Top Dining Options</h3>
            </div>
            <div className="space-y-4">
              {result.diningOptions.map((option, index) => (
                <div key={index} className="border-b pb-3 last:border-0">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">{option.name}</h4>
                    <span className="text-sm bg-primary/10 text-primary px-2 py-0.5 rounded">
                      {option.rating}/5
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{option.cuisine}</p>
                  <div className="flex flex-wrap gap-x-4 text-sm mt-1">
                    <span>Price: {option.priceRange}</span>
                    <span>{option.specialFeatures}</span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sources" className="mt-0">
            <div className="flex items-center mb-4">
              <Link className="h-5 w-5 mr-2" />
              <h3 className="text-xl font-medium">Information Sources</h3>
            </div>
            <div className="space-y-4">
              {result.sources.map((source, index) => (
                <div key={index} className="border-b pb-3 last:border-0">
                  <h4 className="font-medium">
                    <a 
                      href={source.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center"
                    >
                      {source.title}
                      <Link className="h-3 w-3 ml-1" />
                    </a>
                  </h4>
                  <p className="text-sm text-muted-foreground">{source.description}</p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Card>
      </Tabs>
    </div>
  )
}
