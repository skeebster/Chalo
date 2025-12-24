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

function parseTimeToMinutes(timeStr: string): number {
  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (!match) return 0;
  return parseInt(match[1]) * 60 + parseInt(match[2]);
}

interface VerticalTimelineProps {
  schedule: ItineraryActivity[];
  editingActivityId: string | null;
  onEdit: (id: string | undefined, idx: number) => void;
  onSaveEdit: (idx: number, updates: Partial<ItineraryActivity>) => void;
  getActivityIcon: (type: string) => any;
  getActivityColor: (type: string) => string;
}

function VerticalTimeline({
  schedule,
  editingActivityId,
  onEdit,
  onSaveEdit,
  getActivityIcon,
  getActivityColor,
}: VerticalTimelineProps) {
  const [zoomLevel, setZoomLevel] = useState(4); // 4px per minute baseline
  const [scrollOffset, setScrollOffset] = useState(0);
  const timelineRef = useState<HTMLDivElement | null>(null)[1];

  const minActivityTime = Math.min(...schedule.map(a => parseTimeToMinutes(a.time)));
  const maxActivityTime = Math.max(...schedule.map(a => {
    if (a.endTime) return parseTimeToMinutes(a.endTime);
    if (a.duration) return parseTimeToMinutes(a.time) + a.duration;
    return parseTimeToMinutes(a.time) + 60;
  }));
  
  // Start at the hour before the earliest activity, end 1 hour after the latest
  const startHour = Math.floor(minActivityTime / 60);
  const minTime = Math.max(0, startHour * 60 - 60); // Start 1 hour before
  const maxTime = Math.ceil(maxActivityTime / 60) * 60 + 60; // End 1 hour after
  const totalMinutes = maxTime - minTime;
  
  const timelineHeight = totalMinutes * zoomLevel;
  
  const getPosition = (timeStr: string) => {
    const minutes = parseTimeToMinutes(timeStr);
    return (minutes - minTime) * zoomLevel;
  };
  
  const getDuration = (activity: ItineraryActivity) => {
    if (activity.duration) return activity.duration;
    if (activity.endTime) {
      return parseTimeToMinutes(activity.endTime) - parseTimeToMinutes(activity.time);
    }
    return 60;
  };
  
  const getHeightPx = (activity: ItineraryActivity) => {
    return getDuration(activity) * zoomLevel;
  };
  
  const formatTimeLabel = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours % 12 || 12}:${mins.toString().padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const newZoom = Math.max(1, Math.min(10, zoomLevel + (e.deltaY > 0 ? -0.5 : 0.5)));
    setZoomLevel(newZoom);
  };

  return (
    <div className="rounded-lg border border-border/30 overflow-hidden flex flex-col">
      <div className="text-xs text-muted-foreground px-4 py-2 bg-muted/30 border-b border-border/30 flex items-center justify-between">
        <span>Scroll to zoom • Drag to adjust time</span>
        <span>Zoom: {zoomLevel.toFixed(1)}x</span>
      </div>
      
      <div className="flex gap-0 overflow-hidden flex-1" onWheel={handleWheel}>
        {/* Time Scale - Left Side */}
        <div className="w-20 shrink-0 bg-muted/50 border-r border-border/30 overflow-hidden">
          <div className="sticky top-0 bg-muted/80 backdrop-blur z-10 py-2 px-2 border-b border-border/30 text-xs font-semibold text-muted-foreground">
            Time
          </div>
          <div style={{ height: `${timelineHeight}px`, position: 'relative' }}>
            {/* All 15-minute markers */}
            {Array.from({ length: Math.ceil(totalMinutes / 15) + 1 }).map((_, i) => {
              const currentMinutes = minTime + i * 15;
              const isHourMarker = currentMinutes % 60 === 0;
              
              return (
                <div
                  key={`time-marker-${i}`}
                  style={{
                    position: 'absolute',
                    top: `${currentMinutes * zoomLevel}px`,
                  }}
                >
                  {isHourMarker ? (
                    <span className="text-[10px] text-muted-foreground/80 font-semibold px-1 py-0.5 block">
                      {formatTimeLabel(currentMinutes)}
                    </span>
                  ) : (
                    <span className="text-[8px] text-muted-foreground/40 px-1">
                      :{(currentMinutes % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Activities Timeline - Right Side */}
        <div className="flex-1 relative overflow-y-auto" style={{ height: '600px' }}>
          {/* Hour grid lines and 15-min grid */}
          <div style={{ height: `${timelineHeight}px`, position: 'relative' }} className="bg-background">
            {/* Main hour lines */}
            {Array.from({ length: Math.ceil(totalMinutes / 60) }).map((_, i) => (
              <div
                key={`grid-hour-${i}`}
                className="absolute left-0 right-0 border-b border-border/40"
                style={{
                  top: `${(minTime + i * 60) * zoomLevel}px`,
                  height: `${60 * zoomLevel}px`,
                }}
              />
            ))}
            
            {/* 15-minute grid lines (lighter) */}
            {Array.from({ length: Math.ceil(totalMinutes / 15) }).map((_, i) => {
              if (i % 4 === 0) return null; // Skip hour markers (already drawn above)
              return (
                <div
                  key={`grid-15min-${i}`}
                  className="absolute left-0 right-0 border-b border-border/20"
                  style={{
                    top: `${(minTime + i * 15) * zoomLevel}px`,
                    height: `${15 * zoomLevel}px`,
                  }}
                />
              );
            })}

            {/* Activities */}
            {schedule.map((activity, index) => {
              const Icon = getActivityIcon(activity.type);
              const colorClass = getActivityColor(activity.type);
              const isEditing = editingActivityId === (activity.id || `${index}`);
              const top = getPosition(activity.time);
              const heightPx = getHeightPx(activity);
              const duration = getDuration(activity);

              return (
                <div
                  key={activity.id || index}
                  style={{
                    position: 'absolute',
                    top: `${top}px`,
                    height: `${heightPx}px`,
                    left: '4px',
                    right: '4px',
                    minHeight: isEditing ? '140px' : '50px',
                  }}
                  className={`flex flex-col rounded-lg border ${colorClass} p-2 transition-all overflow-hidden hover:shadow-lg group`}
                >
                  <div className="flex gap-1.5 items-start mb-1 flex-shrink-0">
                    <Icon className="w-3 h-3 shrink-0 mt-0.5" />
                    <span className="text-[9px] font-mono opacity-70 flex-shrink-0 min-w-fit">
                      {activity.time}
                      {activity.endTime && ` - ${activity.endTime}`}
                    </span>
                  </div>

                  {isEditing ? (
                    <div className="space-y-0.5 flex-1 overflow-y-auto text-[11px]">
                      <div className="flex gap-0.5">
                        <Input
                          type="time"
                          defaultValue={activity.time.slice(0, 5)}
                          onChange={(e) => onSaveEdit(index, { time: e.target.value })}
                          className="w-16 h-6 text-[9px] p-1"
                        />
                        {activity.endTime && (
                          <Input
                            type="time"
                            defaultValue={activity.endTime.slice(0, 5)}
                            onChange={(e) => onSaveEdit(index, { endTime: e.target.value })}
                            className="w-16 h-6 text-[9px] p-1"
                          />
                        )}
                      </div>
                      <Input
                        placeholder="Title"
                        defaultValue={activity.title}
                        onChange={(e) => onSaveEdit(index, { title: e.target.value })}
                        className="text-[9px] h-6 p-1"
                      />
                      <textarea
                        placeholder="Description"
                        defaultValue={activity.description || ''}
                        onChange={(e) => onSaveEdit(index, { description: e.target.value })}
                        className="w-full text-[9px] p-1 rounded bg-muted/50 border border-border resize-none h-10"
                      />
                    </div>
                  ) : (
                    <>
                      <p className="font-semibold text-[10px] flex-shrink-0 line-clamp-1 leading-tight">
                        {activity.title}
                      </p>
                      {activity.description && heightPx > 80 && (
                        <p className="text-[8px] text-muted-foreground line-clamp-1 flex-shrink-0 leading-tight">
                          {activity.description}
                        </p>
                      )}
                      {activity.duration && heightPx > 50 && (
                        <Badge variant="outline" className="text-[8px] w-fit flex-shrink-0 mt-auto h-4 px-1 py-0">
                          {activity.duration} min
                        </Badge>
                      )}
                      {activity.insiderTip && heightPx > 100 && (
                        <div className="text-[8px] text-purple-400 flex-shrink-0 line-clamp-1 mt-auto leading-tight">
                          <Lightbulb className="w-2 h-2 inline mr-0.5" />
                          {activity.insiderTip}
                        </div>
                      )}
                    </>
                  )}

                  {!isEditing && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5 p-0"
                      onClick={() => onEdit(activity.id, index)}
                    >
                      Edit
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
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
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [editedSchedule, setEditedSchedule] = useState<ItineraryActivity[] | null>(null);

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

        <div className={`grid gap-6 ${generatedItinerary ? 'grid-cols-1' : 'lg:grid-cols-2'}`}>
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
          <div className={`${generatedItinerary ? 'col-span-full' : ''}`}>
            {generatedItinerary ? (
              <Card className="border-primary/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
                      <Sparkles className="w-6 h-6 text-primary" />
                      {generatedItinerary.name}
                    </CardTitle>
                    <div className="flex gap-1">
                      {editingActivityId && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            if (editedSchedule && generatedItinerary) {
                              const updatedItinerary = { ...generatedItinerary, schedule: editedSchedule };
                              setGeneratedItinerary(updatedItinerary);
                              setEditingActivityId(null);
                              setEditedSchedule(null);
                              toast({ title: "Itinerary updated" });
                            }
                          }}
                          data-testid="button-save-edits"
                        >
                          <Save className="w-4 h-4 mr-1" />
                          Save
                        </Button>
                      )}
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
                        onClick={() => {
                          setGeneratedItinerary(null);
                          setEditingActivityId(null);
                          setEditedSchedule(null);
                        }}
                        data-testid="button-close-itinerary"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap mt-2">
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
                <CardContent className="space-y-4">
                  {/* Legend */}
                  <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                    <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Activity Legend</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500/30 border border-blue-500/50"></div>
                        <span className="text-xs text-muted-foreground">Travel</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500/30 border border-amber-500/50"></div>
                        <span className="text-xs text-muted-foreground">Food</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500/30 border border-primary/50"></div>
                        <span className="text-xs text-muted-foreground">Activity</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500/30 border border-green-500/50"></div>
                        <span className="text-xs text-muted-foreground">Arrival</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500/30 border border-purple-500/50"></div>
                        <span className="text-xs text-muted-foreground">Tips</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-muted border border-muted"></div>
                        <span className="text-xs text-muted-foreground">Depart</span>
                      </div>
                    </div>
                  </div>

                  {/* Vertical Timeline View */}
                  <VerticalTimeline 
                    schedule={editedSchedule || (generatedItinerary.schedule as ItineraryActivity[])}
                    editingActivityId={editingActivityId}
                    onEdit={(id, idx) => {
                      setEditedSchedule(generatedItinerary.schedule as ItineraryActivity[]);
                      setEditingActivityId(id || `${idx}`);
                    }}
                    onSaveEdit={(idx, updates) => {
                      if (editedSchedule) {
                        const updated = [...editedSchedule];
                        updated[idx] = { ...updated[idx], ...updates };
                        setEditedSchedule(updated);
                      }
                    }}
                    getActivityIcon={getActivityIcon}
                    getActivityColor={getActivityColor}
                  />
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
