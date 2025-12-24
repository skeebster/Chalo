import { Navbar } from "@/components/Navbar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Place, TripItinerary, ItineraryActivity } from "@shared/schema";
import { useState } from "react";
import { 
  Loader2, Calendar, Clock, Car, MapPin, Sparkles, 
  Plus, X, ChevronRight, Coffee, Utensils, Star,
  Lightbulb, CheckCircle2, Route, Trash2, Save,
  CalendarPlus, Play, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function getActivityIcon(type: string) {
  switch (type) {
    case 'arrival': return MapPin;
    case 'activity': return Star;
    case 'meal': return Utensils;
    case 'drive': return Car;
    case 'tip': return Lightbulb;
    case 'departure': return CheckCircle2;
    default: return Clock;
  }
}

function getActivityColor(type: string) {
  switch (type) {
    case 'arrival': return 'text-green-400 bg-green-500/20 border-green-500/30';
    case 'activity': return 'text-primary bg-primary/20 border-primary/30';
    case 'meal': return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
    case 'drive': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    case 'tip': return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
    case 'departure': return 'text-muted-foreground bg-muted/50 border-muted';
    default: return 'text-muted-foreground bg-muted/50 border-muted';
  }
}

export default function TripPlanner() {
  const { toast } = useToast();
  const [selectedPlaces, setSelectedPlaces] = useState<Place[]>([]);
  const [tripDate, setTripDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState<string>("9:00 AM");
  const [endTime, setEndTime] = useState<string>("6:00 PM");
  const [showPlaceSelector, setShowPlaceSelector] = useState(false);
  const [generatedItinerary, setGeneratedItinerary] = useState<TripItinerary | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: places = [], isLoading: placesLoading } = useQuery<Place[]>({
    queryKey: ["/api/places"],
  });

  const { data: itineraries = [] } = useQuery<TripItinerary[]>({
    queryKey: ["/api/itineraries"],
  });

  const generateMutation = useMutation({
    mutationFn: async (data: { placeIds: number[]; tripDate: string; startTime: string; endTime: string }) => {
      const response = await apiRequest("POST", "/api/itineraries/generate", data);
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedItinerary(data);
      queryClient.invalidateQueries({ queryKey: ["/api/itineraries"] });
      toast({
        title: "Itinerary Generated!",
        description: "Your FOMO-free schedule is ready.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate itinerary",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/itineraries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/itineraries"] });
      if (generatedItinerary) {
        setGeneratedItinerary(null);
      }
      toast({ title: "Itinerary deleted" });
    },
  });

  const addToCalendarMutation = useMutation({
    mutationFn: async (itinerary: TripItinerary) => {
      const schedule = (itinerary.schedule as ItineraryActivity[]).map(activity => {
        const parseTime = (timeStr: string): string => {
          const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
          if (!match) return "09:00";
          let hours = parseInt(match[1]);
          const minutes = match[2];
          const period = match[3]?.toUpperCase();
          if (period === "PM" && hours !== 12) hours += 12;
          if (period === "AM" && hours === 12) hours = 0;
          return `${hours.toString().padStart(2, '0')}:${minutes}`;
        };
        
        return {
          type: activity.type,
          title: activity.title,
          startTime: parseTime(activity.time),
          endTime: activity.endTime ? parseTime(activity.endTime) : parseTime(activity.time),
          description: [activity.description, activity.insiderTip].filter(Boolean).join('\n\nTip: '),
          location: activity.placeName || '',
          placeId: activity.placeId,
        };
      });
      
      const response = await apiRequest("POST", "/api/calendar/add-trip", {
        schedule,
        date: itinerary.tripDate,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        toast({
          title: "Added to Calendar!",
          description: `${data.eventsCreated || 'All'} events added to Google Calendar`,
        });
      }
    },
    onError: () => {
      toast({
        title: "Failed to add to calendar",
        variant: "destructive",
      });
    },
  });

  const handleAddPlace = (place: Place) => {
    if (!selectedPlaces.find(p => p.id === place.id)) {
      setSelectedPlaces([...selectedPlaces, place]);
    }
    setShowPlaceSelector(false);
    setSearchQuery("");
  };

  const handleRemovePlace = (placeId: number) => {
    setSelectedPlaces(selectedPlaces.filter(p => p.id !== placeId));
  };

  const handleGenerate = () => {
    if (selectedPlaces.length === 0) {
      toast({
        title: "No places selected",
        description: "Add at least one destination to generate an itinerary",
        variant: "destructive",
      });
      return;
    }
    generateMutation.mutate({
      placeIds: selectedPlaces.map(p => p.id),
      tripDate,
      startTime,
      endTime,
    });
  };

  const filteredPlaces = places.filter(p => 
    !selectedPlaces.find(sp => sp.id === p.id) &&
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     p.category?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalDriveTime = selectedPlaces.reduce((acc, p) => acc + (p.driveTimeMinutes || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar onUploadClick={() => {}} />
      
      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
            <Route className="w-7 h-7 text-primary" />
            Trip Planner
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Build your perfect day trip with AI-optimized schedules that ensure you don't miss a thing.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Build Your Trip */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Select Destinations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Selected Places */}
                {selectedPlaces.length > 0 ? (
                  <div className="space-y-2">
                    {selectedPlaces.map((place, index) => (
                      <div 
                        key={place.id}
                        className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border"
                      >
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{place.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {place.driveTimeMinutes || '--'} min drive
                            {place.averageVisitDuration && (
                              <span className="ml-2">{place.averageVisitDuration} visit</span>
                            )}
                          </p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemovePlace(place.id)}
                          data-testid={`button-remove-place-${place.id}`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    
                    {/* Summary */}
                    <div className="flex items-center justify-between pt-2 text-sm text-muted-foreground">
                      <span>{selectedPlaces.length} destination{selectedPlaces.length !== 1 ? 's' : ''}</span>
                      <span className="flex items-center gap-1">
                        <Car className="w-4 h-4" />
                        ~{totalDriveTime} min total drive
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <MapPin className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No destinations selected yet</p>
                  </div>
                )}

                <Button
                  onClick={() => setShowPlaceSelector(true)}
                  variant="outline"
                  className="w-full"
                  data-testid="button-add-destination"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Destination
                </Button>
              </CardContent>
            </Card>

            {/* Trip Settings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Trip Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="tripDate">Date</Label>
                  <Input
                    id="tripDate"
                    type="date"
                    value={tripDate}
                    onChange={(e) => setTripDate(e.target.value)}
                    className="mt-1"
                    data-testid="input-trip-date"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      placeholder="9:00 AM"
                      className="mt-1"
                      data-testid="input-start-time"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      placeholder="6:00 PM"
                      className="mt-1"
                      data-testid="input-end-time"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={selectedPlaces.length === 0 || generateMutation.isPending}
              className="w-full py-6 text-lg gap-2"
              data-testid="button-generate-itinerary"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Your Perfect Day...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate FOMO-Free Itinerary
                </>
              )}
            </Button>
          </div>

          {/* Right Column - Generated Itinerary or Past Itineraries */}
          <div className="space-y-4">
            {generatedItinerary ? (
              <Card className="border-primary/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      {generatedItinerary.name}
                    </CardTitle>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => addToCalendarMutation.mutate(generatedItinerary)}
                        disabled={addToCalendarMutation.isPending}
                        data-testid="button-add-to-calendar"
                      >
                        {addToCalendarMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CalendarPlus className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setGeneratedItinerary(null)}
                        data-testid="button-close-itinerary"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {generatedItinerary.tripDate}
                    </span>
                    {generatedItinerary.totalDriveTime && (
                      <span className="flex items-center gap-1">
                        <Car className="w-4 h-4" />
                        {generatedItinerary.totalDriveTime} min drive
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-1">
                      {(generatedItinerary.schedule as ItineraryActivity[]).map((activity, index) => {
                        const Icon = getActivityIcon(activity.type);
                        const colorClass = getActivityColor(activity.type);
                        
                        return (
                          <div key={activity.id || index} className="relative">
                            {/* Timeline line */}
                            {index < (generatedItinerary.schedule as ItineraryActivity[]).length - 1 && (
                              <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-border" />
                            )}
                            
                            <div className={`flex gap-3 p-3 rounded-lg border ${colorClass}`}>
                              <div className="shrink-0 mt-0.5">
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-mono opacity-70">
                                    {activity.time}
                                    {activity.endTime && ` - ${activity.endTime}`}
                                  </span>
                                  {activity.duration && (
                                    <Badge variant="outline" className="text-[10px]">
                                      {activity.duration} min
                                    </Badge>
                                  )}
                                </div>
                                <p className="font-medium text-sm">{activity.title}</p>
                                {activity.description && (
                                  <p className="text-xs text-muted-foreground mt-1 break-words">
                                    {activity.description}
                                  </p>
                                )}
                                {activity.insiderTip && (
                                  <div className="mt-2 flex gap-2 text-xs text-purple-400 bg-purple-500/10 p-2 rounded">
                                    <Lightbulb className="w-3 h-3 shrink-0 mt-0.5" />
                                    <span className="break-words">{activity.insiderTip}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Saved Itineraries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {itineraries.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Sparkles className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No itineraries yet</p>
                      <p className="text-xs mt-1">Generate your first FOMO-free schedule!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {itineraries.map((itinerary) => (
                        <div 
                          key={itinerary.id}
                          className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border hover-elevate cursor-pointer"
                          onClick={() => setGeneratedItinerary(itinerary)}
                          data-testid={`itinerary-card-${itinerary.id}`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{itinerary.name}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-2">
                              <Calendar className="w-3 h-3" />
                              {itinerary.tripDate}
                              {itinerary.totalDriveTime && (
                                <span className="flex items-center gap-1">
                                  <Car className="w-3 h-3" />
                                  {itinerary.totalDriveTime} min
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteMutation.mutate(itinerary.id);
                              }}
                              data-testid={`button-delete-itinerary-${itinerary.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Place Selector Dialog */}
      <Dialog open={showPlaceSelector} onOpenChange={setShowPlaceSelector}>
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Add Destination</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Search places..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-places"
            />
            <ScrollArea className="h-[400px]">
              {placesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : filteredPlaces.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No places found</p>
                </div>
              ) : (
                <div className="space-y-2 pr-4">
                  {filteredPlaces.map((place) => (
                    <div
                      key={place.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover-elevate cursor-pointer"
                      onClick={() => handleAddPlace(place)}
                      data-testid={`place-option-${place.id}`}
                    >
                      {place.imageUrl && (
                        <img
                          src={place.imageUrl.startsWith('googleref:') 
                            ? `/api/photos/proxy?ref=${place.imageUrl.replace('googleref:', '')}`
                            : place.imageUrl}
                          alt={place.name}
                          className="w-12 h-12 rounded-md object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{place.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{place.category}</Badge>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {place.driveTimeMinutes || '--'} min
                          </span>
                        </p>
                      </div>
                      <Plus className="w-5 h-5 text-primary" />
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
