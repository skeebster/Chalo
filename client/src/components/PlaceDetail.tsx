import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Place } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MapPin, Calendar, Clock, DollarSign, ExternalLink, ThumbsUp, Car, Info, Lightbulb, Star, Utensils, Zap, ParkingCircle, Sun, CheckCircle2 } from "lucide-react";

interface PlaceDetailProps {
  place: Place | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function parseTextToBullets(text: string): string[] {
  if (!text) return [];
  
  let items = text
    .split(/[•\n]/)
    .map(item => item.trim())
    .filter(item => item.length > 0);
  
  if (items.length === 1 && items[0].includes('. ')) {
    const sentences = items[0].split(/\.\s+/).filter(s => s.length > 10);
    if (sentences.length > 2) {
      items = sentences.map(s => s.endsWith('.') ? s : s + '.');
    }
  }
  
  return items;
}

function parseHighlights(text: string): string[] {
  if (!text) return [];
  return text.split(/[;,]/).map(item => item.trim()).filter(item => item.length > 0);
}

function extractFoodItems(description: string): string[] {
  if (!description) return [];
  
  const foodKeywords = [
    'burger', 'burgers', 'pizza', 'pancakes', 'breakfast', 'sandwiches', 'tacos', 
    'burritos', 'wings', 'chicken', 'seafood', 'sushi', 'pasta', 'steak', 'salads',
    'soup', 'dessert', 'ice cream', 'coffee', 'chai', 'smoothies', 'fries', 'crabfries',
    'wraps', 'bowls', 'nuggets', 'ribs', 'bbq', 'mexican', 'italian', 'indian',
    'chinese', 'thai', 'japanese', 'comfort food', 'brunch', 'deli', 'bakery'
  ];
  
  const items: string[] = [];
  const lowerDesc = description.toLowerCase();
  
  const knownForMatch = description.match(/(?:known for|famous for|best|specializes in|serving|offers?)\s+([^,.$]+)/i);
  if (knownForMatch) {
    const found = knownForMatch[1].trim();
    if (found.length > 3 && found.length < 40) {
      items.push(found.charAt(0).toUpperCase() + found.slice(1));
    }
  }
  
  for (const keyword of foodKeywords) {
    if (lowerDesc.includes(keyword) && !items.some(i => i.toLowerCase().includes(keyword))) {
      if (items.length < 3) {
        items.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
      }
    }
  }
  
  return items.slice(0, 3);
}

export function PlaceDetail({ place, open, onOpenChange }: PlaceDetailProps) {
  if (!place) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[85vh] p-0 overflow-hidden bg-card border-white/10">
        <div className="relative h-64 w-full shrink-0">
          <img 
            src={place.imageUrl || "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&auto=format&fit=crop&q=60"} 
            alt={place.name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
          
          <div className="absolute bottom-4 left-6 right-6">
            <div className="flex gap-2 mb-2">
              <Badge className="bg-primary/90 hover:bg-primary">{place.category}</Badge>
              {place.subcategory && <Badge variant="outline" className="text-white border-white/20 bg-black/40 backdrop-blur-md">{place.subcategory}</Badge>}
            </div>
            <h2 className="text-3xl font-display font-bold text-white shadow-sm">{place.name}</h2>
            {place.address && (
              <div className="flex items-center gap-2 text-white/80 mt-1 text-sm">
                <MapPin className="w-4 h-4" />
                {place.address}
              </div>
            )}
          </div>
        </div>

        <ScrollArea className="h-full">
          <div className="p-6 space-y-8">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatBox icon={Clock} label="Drive Time" value={`${place.driveTimeMinutes || '--'} min`} />
              <StatBox icon={Car} label="Distance" value={`${place.distanceMiles || '--'} mi`} />
              <StatBox icon={DollarSign} label="Avg Spend" value={`$${place.averageSpend || '--'}`} />
              <StatBox icon={ThumbsUp} label="Rating" value={place.googleRating?.toString() || '--'} />
            </div>

            {/* Overview */}
            <section>
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" /> Overview
              </h3>
              <p className="text-muted-foreground leading-relaxed">{place.overview || "No overview available."}</p>
            </section>

            <Separator className="bg-white/10" />

            {/* Highlights */}
            {place.keyHighlights && (
              <section>
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary" /> Highlights
                </h3>
                <div className="flex flex-wrap gap-2">
                  {parseHighlights(place.keyHighlights).map((highlight, i) => (
                    <Badge key={i} variant="secondary" className="text-xs py-1.5 px-3">
                      {highlight}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            <Separator className="bg-white/10" />

            {/* Insider Tips */}
            {place.insiderTips && (
              <section>
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-primary" /> Insider Tips
                </h3>
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 space-y-3">
                  {parseTextToBullets(place.insiderTips).map((tip, i) => (
                    <div key={i} className="flex gap-3">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-sm text-muted-foreground leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <Separator className="bg-white/10" />

            {/* Practical Info Grid */}
            <section>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" /> Practical Information
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {place.bestSeasons && (
                  <InfoCard icon={Sun} label="Best Seasons" value={place.bestSeasons} />
                )}
                {place.bestDay && (
                  <InfoCard icon={Calendar} label="Best Day to Visit" value={place.bestDay} />
                )}
                {place.entryFee && (
                  <InfoCard icon={DollarSign} label="Entry Fee" value={place.entryFee} />
                )}
                {place.parkingInfo && (
                  <InfoCard icon={ParkingCircle} label="Parking" value={place.parkingInfo} />
                )}
                {place.evCharging && (
                  <InfoCard icon={Zap} label="EV Charging" value={place.evCharging} />
                )}
                {place.averageVisitDuration && (
                  <InfoCard icon={Clock} label="Visit Duration" value={place.averageVisitDuration} />
                )}
              </div>
            </section>

            {/* Nearby Restaurants */}
            {place.nearbyRestaurants && place.nearbyRestaurants.length > 0 && (
              <>
                <Separator className="bg-white/10" />
                <section>
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-primary" /> Nearby Restaurants
                  </h3>
                  <div className="grid gap-3">
                    {place.nearbyRestaurants.map((restaurant, i) => {
                      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name + (place.address ? ' near ' + place.address : ''))}`;
                      const foodItems = extractFoodItems(restaurant.description || '');
                      
                      return (
                        <div 
                          key={i} 
                          className="flex items-start gap-3 bg-white/5 p-3 rounded-lg border border-white/5 hover-elevate cursor-pointer"
                          onClick={() => window.open(mapsUrl, '_blank')}
                          data-testid={`restaurant-card-${i}`}
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                            <Utensils className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white text-sm">{restaurant.name}</span>
                              <ExternalLink className="w-3 h-3 text-muted-foreground" />
                            </div>
                            {restaurant.description && (
                              <span className="text-xs text-muted-foreground block mt-0.5">{restaurant.description}</span>
                            )}
                            {foodItems.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {foodItems.map((food, j) => (
                                  <Badge key={j} variant="outline" className="text-xs bg-primary/10 border-primary/20 text-primary">
                                    {food}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          {restaurant.distance && (
                            <Badge variant="secondary" className="text-xs shrink-0">{restaurant.distance}</Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              </>
            )}

            {/* Overall Sentiment */}
            {place.overallSentiment && (
              <>
                <Separator className="bg-white/10" />
                <section>
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <ThumbsUp className="w-5 h-5 text-primary" /> What Visitors Say
                  </h3>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <p className="text-sm text-muted-foreground italic">"{place.overallSentiment}"</p>
                  </div>
                </section>
              </>
            )}

            {/* Action Bar */}
            <div className="pt-4 flex justify-end gap-3">
              {place.googleMapsUrl && (
                <Button variant="outline" className="gap-2" onClick={() => window.open(place.googleMapsUrl!, '_blank')}>
                  <MapPin className="w-4 h-4" />
                  Open in Maps
                </Button>
              )}
              {/* Future feature: Add to Plan */}
              <Button className="gap-2">
                <Calendar className="w-4 h-4" />
                Add to Plan
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function StatBox({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="bg-white/5 border border-white/5 p-3 rounded-xl flex flex-col items-center justify-center text-center">
      <Icon className="w-5 h-5 text-primary mb-1" />
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className="font-bold text-white">{value}</span>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">{label}</span>
          <p className="text-sm text-white leading-relaxed">{value}</p>
        </div>
      </div>
    </div>
  );
}
