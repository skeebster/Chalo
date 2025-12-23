import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Place } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Calendar, Clock, DollarSign, ExternalLink, ThumbsUp, ThumbsDown, Car, Info, Lightbulb, Star, Utensils, Zap, ParkingCircle, Sun, CheckCircle2, MessageCircle, TrendingUp, Sparkles, AlertCircle, Train, Heart, Camera, ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { NearbyRestaurant } from "@shared/schema";
import { getDisplayImageUrl, DEFAULT_PLACE_IMAGE } from "@/lib/image-utils";

interface PlacePhoto {
  photoReference: string;
  url: string;
  width: number;
  height: number;
  attributions: string[];
}

interface PlaceDetailProps {
  place: Place | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ReviewInsight {
  sentimentScore: number;
  sentimentLabel: string;
  summary: string;
  pros: string[];
  cons: string[];
  visitorTips: string[];
  noteworthyMentions: string[];
}

interface ReviewAnalysis {
  rating: number | null;
  totalReviews: number | null;
  insights: ReviewInsight | null;
  googleMapsUrl: string | null;
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

function getSentimentColor(score: number): string {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-lime-400";
  if (score >= 40) return "text-yellow-400";
  if (score >= 20) return "text-orange-400";
  return "text-red-400";
}


function getSentimentBgColor(score: number): string {
  if (score >= 80) return "bg-green-500/20 border-green-500/30";
  if (score >= 60) return "bg-lime-500/20 border-lime-500/30";
  if (score >= 40) return "bg-yellow-500/20 border-yellow-500/30";
  if (score >= 20) return "bg-orange-500/20 border-orange-500/30";
  return "bg-red-500/20 border-red-500/30";
}

export function PlaceDetail({ place, open, onOpenChange }: PlaceDetailProps) {
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const { data: reviewData, isLoading: reviewsLoading } = useQuery<ReviewAnalysis>({
    queryKey: ['/api/places', place?.id, 'reviews'],
    enabled: open && !!place?.id,
  });

  const { data: photosData, isLoading: photosLoading, refetch: fetchPhotos } = useQuery<{ success: boolean; photos?: PlacePhoto[]; error?: string }>({
    queryKey: ['/api/places', place?.id, 'photos'],
    enabled: false, // Only fetch when user clicks button
  });

  const { data: favorites = [] } = useQuery<number[]>({
    queryKey: ['/api/favorites'],
  });

  const isFavorite = place ? favorites.includes(place.id) : false;

  const addFavorite = useMutation({
    mutationFn: async (placeId: number) => {
      await apiRequest('POST', `/api/favorites/${placeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
    },
  });

  const removeFavorite = useMutation({
    mutationFn: async (placeId: number) => {
      await apiRequest('DELETE', `/api/favorites/${placeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
    },
  });

  const updatePlaceImage = useMutation({
    mutationFn: async ({ placeId, imageUrl }: { placeId: number; imageUrl: string }) => {
      await apiRequest('PUT', `/api/places/${placeId}`, { imageUrl });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/places'] });
      setShowPhotoGallery(false);
    },
  });

  const toggleFavorite = () => {
    if (!place) return;
    if (isFavorite) {
      removeFavorite.mutate(place.id);
    } else {
      addFavorite.mutate(place.id);
    }
  };

  const handleFetchPhotos = () => {
    setShowPhotoGallery(true);
    setCurrentPhotoIndex(0);
    fetchPhotos();
  };

  const handleSelectPhoto = (photoReference: string) => {
    if (!place) return;
    // Store the photo reference, not the proxied URL - the display will create the proxy URL
    updatePlaceImage.mutate({ placeId: place.id, imageUrl: `googleref:${photoReference}` });
  };

  const photos = photosData?.photos || [];

  if (!place) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[90vh] p-0 overflow-hidden bg-card border-white/10" aria-describedby={undefined}>
        <VisuallyHidden>
          <DialogTitle>{place.name}</DialogTitle>
        </VisuallyHidden>
        
        <ScrollArea className="h-full">
          {/* Hero Image - scrolls with content */}
          <div className="relative h-48 sm:h-64 w-full">
            {showPhotoGallery && photos.length > 0 ? (
              <>
                {/* Photo Gallery Mode */}
                <img 
                  src={photos[currentPhotoIndex].url} 
                  alt={`${place.name} photo ${currentPhotoIndex + 1}`} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/30" />
                
                {/* Gallery Navigation */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="bg-black/40 backdrop-blur-sm border border-white/20 text-white gap-1"
                    onClick={() => {
                      // Auto-save the currently viewed photo as cover when closing
                      handleSelectPhoto(photos[currentPhotoIndex].photoReference);
                      setShowPhotoGallery(false);
                    }}
                    disabled={updatePlaceImage.isPending}
                    data-testid="button-close-gallery"
                  >
                    {updatePlaceImage.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Done
                  </Button>
                  <Badge className="bg-black/60 text-white border-none">
                    {currentPhotoIndex + 1} / {photos.length}
                  </Badge>
                  <div className="text-xs text-white/70 bg-black/40 backdrop-blur-sm px-2 py-1 rounded">
                    Scroll to select cover
                  </div>
                </div>

                {/* Photo Navigation Arrows */}
                {photos.length > 1 && (
                  <>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 backdrop-blur-sm border border-white/20 text-white"
                      onClick={() => setCurrentPhotoIndex(i => (i > 0 ? i - 1 : photos.length - 1))}
                      data-testid="button-prev-photo"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 backdrop-blur-sm border border-white/20 text-white"
                      onClick={() => setCurrentPhotoIndex(i => (i < photos.length - 1 ? i + 1 : 0))}
                      data-testid="button-next-photo"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </>
                )}

                {/* Photo Thumbnails */}
                <div className="absolute bottom-4 left-4 right-4 flex gap-2 justify-center overflow-x-auto">
                  {photos.map((photo, idx) => (
                    <button
                      key={photo.photoReference}
                      onClick={() => setCurrentPhotoIndex(idx)}
                      className={`w-12 h-12 rounded-md overflow-hidden border-2 shrink-0 transition-all ${
                        idx === currentPhotoIndex ? 'border-primary ring-2 ring-primary/50' : 'border-white/30 opacity-70'
                      }`}
                      data-testid={`button-thumbnail-${idx}`}
                    >
                      <img src={photo.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </>
            ) : showPhotoGallery && photosLoading ? (
              <>
                {/* Loading State */}
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Finding photos...</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-4 left-4 bg-black/40 backdrop-blur-sm border border-white/20 text-white gap-1"
                  onClick={() => setShowPhotoGallery(false)}
                  data-testid="button-cancel-loading"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Cancel
                </Button>
              </>
            ) : (
              <>
                {/* Default Image View */}
                <img 
                  src={getDisplayImageUrl(place.imageUrl, DEFAULT_PLACE_IMAGE)} 
                  alt={place.name} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                
                {/* Action Buttons */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="bg-black/40 backdrop-blur-sm border border-white/20 text-white"
                    onClick={handleFetchPhotos}
                    data-testid="button-fetch-photos"
                  >
                    <Camera className="w-5 h-5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className={`bg-black/40 backdrop-blur-sm border border-white/20 ${isFavorite ? 'text-red-500' : 'text-white'}`}
                    onClick={toggleFavorite}
                    data-testid="button-favorite"
                  >
                    <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                  </Button>
                </div>
                
                <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6">
                  <div className="flex gap-2 mb-2 flex-wrap">
                    <Badge className="bg-primary/90 hover:bg-primary">{place.category}</Badge>
                    {place.subcategory && <Badge variant="outline" className="text-white border-white/20 bg-black/40 backdrop-blur-md">{place.subcategory}</Badge>}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-display font-bold text-white shadow-sm">{place.name}</h2>
                  {place.address && (
                    <div className="flex items-center gap-2 text-white/80 mt-1 text-xs sm:text-sm">
                      <MapPin className="w-4 h-4 shrink-0" />
                      <span className="line-clamp-1">{place.address}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
            {/* Overview - Now at the top */}
            {place.overview && (
              <section>
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary" /> Overview
                </h3>
                <p className="text-muted-foreground leading-relaxed">{place.overview}</p>
              </section>
            )}

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <StatBox 
                icon={Clock} 
                label="Drive Time" 
                value={`${place.driveTimeMinutes || '--'} min`} 
                onClick={() => {
                  const homeAddress = "8 Canvass Ct, Somerset, NJ 08873";
                  const destination = encodeURIComponent(place.address || place.name);
                  const origin = encodeURIComponent(homeAddress);
                  window.open(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`, '_blank');
                }}
              />
              <StatBox 
                icon={Car} 
                label="Distance" 
                value={`${place.distanceMiles || '--'} mi`}
                onClick={() => {
                  const homeAddress = "8 Canvass Ct, Somerset, NJ 08873";
                  const destination = encodeURIComponent(place.address || place.name);
                  const origin = encodeURIComponent(homeAddress);
                  window.open(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`, '_blank');
                }}
              />
              <StatBox icon={DollarSign} label="Avg Spend" value={`$${place.averageSpend || '--'}`} />
              <StatBox 
                icon={Star} 
                label="Rating" 
                value={reviewData?.rating?.toFixed(1) || place.googleRating?.toString() || '--'} 
                subValue={reviewData?.totalReviews ? `(${reviewData.totalReviews.toLocaleString()})` : undefined}
              />
            </div>

            {/* AI-Powered Visitor Insights */}
            {reviewsLoading ? (
              <section>
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" /> Visitor Insights
                </h3>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </section>
            ) : reviewData?.insights ? (
              <>
                <section>
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" /> Visitor Insights
                    <Badge variant="outline" className="text-xs ml-2 text-muted-foreground border-muted-foreground/30">
                      AI-analyzed from {reviewData.totalReviews?.toLocaleString() || 'multiple'} reviews
                    </Badge>
                  </h3>
                  
                  {/* Sentiment Score */}
                  <div className={`p-4 rounded-xl border mb-4 ${getSentimentBgColor(reviewData.insights.sentimentScore)}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`text-3xl font-bold ${getSentimentColor(reviewData.insights.sentimentScore)}`}>
                        {reviewData.insights.sentimentScore}
                      </div>
                      <div>
                        <div className={`font-semibold ${getSentimentColor(reviewData.insights.sentimentScore)}`}>
                          {reviewData.insights.sentimentLabel}
                        </div>
                        <div className="text-xs text-muted-foreground">Overall Visitor Sentiment</div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {reviewData.insights.summary}
                    </p>
                  </div>

                  {/* Pros and Cons */}
                  <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                    {reviewData.insights.pros.length > 0 && (
                      <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl">
                        <div className="flex items-center gap-2 mb-3">
                          <ThumbsUp className="w-4 h-4 text-green-400" />
                          <span className="font-semibold text-green-400 text-sm">What Visitors Love</span>
                        </div>
                        <ul className="space-y-2">
                          {reviewData.insights.pros.map((pro, i) => (
                            <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                              <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                              <span>{pro}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {reviewData.insights.cons.length > 0 && (
                      <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl">
                        <div className="flex items-center gap-2 mb-3">
                          <ThumbsDown className="w-4 h-4 text-orange-400" />
                          <span className="font-semibold text-orange-400 text-sm">Things to Consider</span>
                        </div>
                        <ul className="space-y-2">
                          {reviewData.insights.cons.map((con, i) => (
                            <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                              <AlertCircle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                              <span>{con}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Noteworthy Mentions */}
                  {reviewData.insights.noteworthyMentions.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-white">Worth Checking Out</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {reviewData.insights.noteworthyMentions.map((item, i) => (
                          <Badge key={i} className="bg-primary/20 text-primary border-primary/30 text-sm py-1.5 px-3">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Visitor Tips from Reviews */}
                  {reviewData.insights.visitorTips.length > 0 && (
                    <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <Lightbulb className="w-4 h-4 text-blue-400" />
                        <span className="font-semibold text-blue-400 text-sm">Tips from Recent Visitors</span>
                      </div>
                      <ul className="space-y-2">
                        {reviewData.insights.visitorTips.map((tip, i) => (
                          <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Link to Google Reviews */}
                  {reviewData.googleMapsUrl && (
                    <div className="mt-3 text-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-muted-foreground gap-2"
                        onClick={() => window.open(reviewData.googleMapsUrl!, '_blank')}
                      >
                        <MessageCircle className="w-4 h-4" />
                        Read all reviews on Google
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </section>
                <Separator className="bg-white/10" />
              </>
            ) : null}


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
              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
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

            {/* Public Transit */}
            {place.publicTransit && (
              <>
                <Separator className="bg-white/10" />
                <section>
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Train className="w-5 h-5 text-primary" /> Public Transit
                  </h3>
                  <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                    <p className="text-sm text-muted-foreground">{place.publicTransit}</p>
                  </div>
                </section>
              </>
            )}

            {/* Nearby Restaurants */}
            {place.nearbyRestaurants && place.nearbyRestaurants.length > 0 && (
              <>
                <Separator className="bg-white/10" />
                <section>
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-primary" /> Nearby Restaurants
                  </h3>
                  <div className="grid gap-3">
                    {(place.nearbyRestaurants as NearbyRestaurant[]).map((restaurant, i) => {
                      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name + (place.address ? ' near ' + place.address : ''))}`;
                      
                      return (
                        <div 
                          key={i} 
                          className="flex items-start gap-3 bg-white/5 p-4 rounded-lg border border-white/5 hover-elevate cursor-pointer"
                          onClick={() => window.open(mapsUrl, '_blank')}
                          data-testid={`restaurant-card-${i}`}
                        >
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                            <Utensils className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-white">{restaurant.name}</span>
                              {restaurant.rating && (
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                  <span className="text-xs text-yellow-400">{restaurant.rating}</span>
                                </div>
                              )}
                              <ExternalLink className="w-3 h-3 text-muted-foreground" />
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {restaurant.cuisine && (
                                <span className="text-xs text-muted-foreground">{restaurant.cuisine}</span>
                              )}
                              {restaurant.priceRange && (
                                <Badge variant="outline" className="text-xs text-green-400 border-green-400/30">{restaurant.priceRange}</Badge>
                              )}
                              {restaurant.distance && (
                                <Badge variant="secondary" className="text-xs">{restaurant.distance}</Badge>
                              )}
                            </div>
                            {restaurant.description && (
                              <p className="text-xs text-muted-foreground mt-1">{restaurant.description}</p>
                            )}
                            {restaurant.specialFeatures && restaurant.specialFeatures.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {restaurant.specialFeatures.map((feature, j) => (
                                  <Badge key={j} variant="outline" className="text-xs bg-primary/10 border-primary/20 text-primary">
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </>
            )}

            {/* Fallback Overall Sentiment (when no AI insights) */}
            {place.overallSentiment && !reviewData?.insights && !reviewsLoading && (
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

function StatBox({ icon: Icon, label, value, subValue, onClick }: { icon: any, label: string, value: string, subValue?: string, onClick?: () => void }) {
  const Component = onClick ? 'button' : 'div';
  return (
    <Component 
      className={`bg-white/5 border border-white/5 p-3 rounded-xl flex flex-col items-center justify-center text-center ${onClick ? 'cursor-pointer hover:bg-white/10 transition-colors' : ''}`}
      onClick={onClick}
      data-testid={onClick ? `stat-${label.toLowerCase().replace(' ', '-')}` : undefined}
    >
      <Icon className="w-5 h-5 text-primary mb-1" />
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className="font-bold text-white">{value}</span>
      {subValue && <span className="text-xs text-muted-foreground">{subValue}</span>}
    </Component>
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
