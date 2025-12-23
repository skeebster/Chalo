import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Place, WeekendPlan } from "@shared/schema";
import { useCreatePlan } from "@/hooks/use-plans";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { Calendar, CalendarPlus, Clock, Car, Coffee, Utensils, MapPin, Sun, Moon, Home, Loader2, Check, ChevronLeft, ChevronRight, Plus, X, GripVertical, ArrowUp, ArrowDown, Sparkles, Backpack } from "lucide-react";
import { PackingChecklist } from "./PackingChecklist";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format, addDays, nextSaturday, isSaturday, isSunday, startOfDay, addMinutes, setHours, setMinutes } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";

interface AddToPlanDialogProps {
  place: Place | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PlannedPlace {
  place: Place;
  customDuration?: number; // Override default duration in minutes
}

interface ScheduleItem {
  time: string;
  endTime: string;
  activity: string;
  description: string;
  icon: any;
  type: 'home' | 'travel' | 'meal' | 'activity' | 'rest';
  placeId?: number;
  details?: string[];
}

function parseVisitDuration(duration: string | null | undefined): number {
  if (!duration) return 120;
  const match = duration.match(/(\d+)/);
  if (match) {
    const hours = parseInt(match[1]);
    return hours * 60;
  }
  return 120;
}

function formatTime(date: Date): string {
  return format(date, 'h:mm a');
}

function parseDistanceMiles(distanceStr: string | null | undefined): number {
  if (!distanceStr) return 0;
  // Handle formats like "8 miles / 20 min", "45", "45 miles", "~50 mi"
  const match = distanceStr.match(/^~?(\d+(?:\.\d+)?)/);
  if (match) {
    return parseFloat(match[1]);
  }
  return 0;
}

function calculateDriveBetween(from: Place | null, to: Place): number {
  // If no "from" location, use place's drive time from home
  if (!from) {
    return to.driveTimeMinutes || 60;
  }
  
  // If both places have drive times from home, use those as a better estimate
  const fromDriveFromHome = from.driveTimeMinutes || 0;
  const toDriveFromHome = to.driveTimeMinutes || 0;
  
  // If we have drive times from home, estimate inter-place travel
  if (fromDriveFromHome > 0 && toDriveFromHome > 0) {
    // Estimate: if both are equidistant from home, ~15 min between
    // If different distances, use a fraction of the difference
    const timeDiff = Math.abs(toDriveFromHome - fromDriveFromHome);
    return Math.max(15, Math.round(timeDiff * 0.6 + 10));
  }
  
  // Fallback to distance-based estimation
  const fromDist = parseDistanceMiles(from.distanceMiles);
  const toDist = parseDistanceMiles(to.distanceMiles);
  
  // Rough estimate: 1 mile = ~2 minutes in suburban/mixed driving
  const estimatedDistance = Math.abs(toDist - fromDist) * 0.7;
  return Math.max(15, Math.round(estimatedDistance * 2));
}

function generateMultiStopSchedule(places: PlannedPlace[]): ScheduleItem[] {
  if (places.length === 0) return [];
  
  const schedule: ScheduleItem[] = [];
  let currentTime = setMinutes(setHours(new Date(), 6), 0);
  
  // Wake up
  schedule.push({
    time: formatTime(currentTime),
    endTime: formatTime(addMinutes(currentTime, 30)),
    activity: "Wake Up",
    description: "Rise and shine! Start your adventure day.",
    icon: Sun,
    type: 'home',
    details: ["Set alarm for 6:00 AM", "Check weather forecast"]
  });
  currentTime = addMinutes(currentTime, 30);
  
  // Get ready
  schedule.push({
    time: formatTime(currentTime),
    endTime: formatTime(addMinutes(currentTime, 45)),
    activity: "Get Ready",
    description: "Shower, dress comfortably, and pack essentials.",
    icon: Home,
    type: 'home',
    details: ["Pack snacks & water", "Charge devices", "Dress in layers"]
  });
  currentTime = addMinutes(currentTime, 45);
  
  // Breakfast
  schedule.push({
    time: formatTime(currentTime),
    endTime: formatTime(addMinutes(currentTime, 30)),
    activity: "Breakfast at Home",
    description: "Quick, energizing breakfast before hitting the road.",
    icon: Coffee,
    type: 'meal',
    details: ["Light, protein-rich breakfast recommended", "Fill water bottles"]
  });
  currentTime = addMinutes(currentTime, 30);
  
  let previousPlace: Place | null = null;
  let lunchScheduled = false;
  
  for (let i = 0; i < places.length; i++) {
    const { place, customDuration } = places[i];
    const driveTime = calculateDriveBetween(previousPlace, place);
    const visitDuration = customDuration || parseVisitDuration(place.averageVisitDuration);
    const isLastPlace = i === places.length - 1;
    
    // Drive to this place
    const fromLocation = previousPlace ? previousPlace.name : "Home";
    schedule.push({
      time: formatTime(currentTime),
      endTime: formatTime(addMinutes(currentTime, driveTime)),
      activity: `Drive: ${fromLocation} to ${place.name}`,
      description: previousPlace 
        ? `Continue to ${place.name} (~${driveTime} min)`
        : `Head to ${place.name} (${driveTime} min, ${place.distanceMiles || '?'} mi from home)`,
      icon: Car,
      type: 'travel',
      placeId: place.id,
      details: [
        previousPlace ? `From: ${previousPlace.address || previousPlace.name}` : "From: 8 Canvass Ct, Somerset, NJ",
        `To: ${place.address || place.name}`,
        `Est. drive: ${driveTime} minutes`
      ]
    });
    currentTime = addMinutes(currentTime, driveTime);
    
    const arrivalTime = currentTime;
    
    // Check if it's lunch time
    const lunchStart = setMinutes(setHours(new Date(), 11), 30);
    const lunchEnd = setMinutes(setHours(new Date(), 13), 30);
    
    if (!lunchScheduled && currentTime >= lunchStart && currentTime <= lunchEnd) {
      // Schedule lunch now
      const restaurants = place.nearbyRestaurants || [];
      const lunchSpot = restaurants.length > 0 ? restaurants[0].name : "a nearby restaurant";
      schedule.push({
        time: formatTime(currentTime),
        endTime: formatTime(addMinutes(currentTime, 50)),
        activity: `Lunch near ${place.name}`,
        description: `Grab lunch at ${lunchSpot}`,
        icon: Utensils,
        type: 'meal',
        details: restaurants.slice(0, 3).map(r => r.name || String(r))
      });
      currentTime = addMinutes(currentTime, 50);
      lunchScheduled = true;
    }
    
    // Split visit into segments for longer stays
    const segments = visitDuration > 90 ? Math.ceil(visitDuration / 90) : 1;
    const segmentDuration = Math.floor(visitDuration / segments);
    
    const highlights = place.keyHighlights?.split(';').map(h => h.trim()).filter(Boolean) || [];
    const tips = place.insiderTips?.split('.').map(t => t.trim()).filter(t => t.length > 10) || [];
    
    for (let seg = 0; seg < segments; seg++) {
      const isFirstSeg = seg === 0;
      const isLastSeg = seg === segments - 1;
      
      let segmentTitle = `Explore ${place.name}`;
      if (segments > 1) {
        if (isFirstSeg) segmentTitle = `Arrive & Explore ${place.name}`;
        else if (isLastSeg) segmentTitle = `Finish Exploring ${place.name}`;
        else segmentTitle = `Continue at ${place.name}`;
      }
      
      const segDetails: string[] = [];
      if (isFirstSeg) {
        segDetails.push(`Arrival: ${formatTime(arrivalTime)}`);
        if (place.entryFee) segDetails.push(`Entry: ${place.entryFee}`);
      }
      if (highlights[seg]) segDetails.push(highlights[seg]);
      if (tips[seg] && tips[seg].length < 100) segDetails.push(tips[seg] + '.');
      
      schedule.push({
        time: formatTime(currentTime),
        endTime: formatTime(addMinutes(currentTime, segmentDuration)),
        activity: segmentTitle,
        description: highlights[seg] || `Enjoy ${place.name}`,
        icon: MapPin,
        type: 'activity',
        placeId: place.id,
        details: segDetails.length > 0 ? segDetails : undefined
      });
      currentTime = addMinutes(currentTime, segmentDuration);
      
      // Check for lunch during visit
      if (!lunchScheduled && currentTime >= lunchStart && currentTime <= lunchEnd && !isLastSeg) {
        const restaurants = place.nearbyRestaurants || [];
        const lunchSpot = restaurants.length > 0 ? restaurants[0].name : "a nearby spot";
        schedule.push({
          time: formatTime(currentTime),
          endTime: formatTime(addMinutes(currentTime, 50)),
          activity: "Lunch Break",
          description: `Grab lunch at ${lunchSpot}`,
          icon: Utensils,
          type: 'meal',
          details: restaurants.slice(0, 3).map(r => r.name || String(r))
        });
        currentTime = addMinutes(currentTime, 50);
        lunchScheduled = true;
      }
    }
    
    previousPlace = place;
  }
  
  // Late lunch if not scheduled yet
  if (!lunchScheduled) {
    const lateLunchTime = setMinutes(setHours(new Date(), 14), 0);
    if (currentTime < lateLunchTime) {
      currentTime = lateLunchTime;
    }
    schedule.push({
      time: formatTime(currentTime),
      endTime: formatTime(addMinutes(currentTime, 45)),
      activity: "Late Lunch",
      description: "Grab a late lunch on the way home",
      icon: Utensils,
      type: 'meal'
    });
    currentTime = addMinutes(currentTime, 45);
  }
  
  // Drive home from last place
  const lastPlace = places[places.length - 1].place;
  const driveHomeTime = lastPlace.driveTimeMinutes || 60;
  schedule.push({
    time: formatTime(currentTime),
    endTime: formatTime(addMinutes(currentTime, driveHomeTime)),
    activity: "Drive Home",
    description: `Head back home from ${lastPlace.name} (~${driveHomeTime} min)`,
    icon: Car,
    type: 'travel',
    details: [`From: ${lastPlace.address || lastPlace.name}`, "To: Home"]
  });
  currentTime = addMinutes(currentTime, driveHomeTime);
  
  // Rest at home
  const dinnerTime = setMinutes(setHours(new Date(), 18), 30);
  if (currentTime < dinnerTime) {
    schedule.push({
      time: formatTime(currentTime),
      endTime: formatTime(dinnerTime),
      activity: "Rest & Unwind",
      description: "Take a break, freshen up, and relax at home.",
      icon: Home,
      type: 'rest'
    });
    currentTime = dinnerTime;
  }
  
  // Dinner
  schedule.push({
    time: formatTime(currentTime),
    endTime: formatTime(addMinutes(currentTime, 60)),
    activity: "Dinner",
    description: "Enjoy dinner at home or order your favorite takeout.",
    icon: Utensils,
    type: 'meal'
  });
  currentTime = addMinutes(currentTime, 60);
  
  // Evening wind down
  const endTime = setMinutes(setHours(new Date(), 21), 0);
  if (currentTime < endTime) {
    schedule.push({
      time: formatTime(currentTime),
      endTime: formatTime(endTime),
      activity: "Evening Wind Down",
      description: "Relax and reflect on your adventure day.",
      icon: Moon,
      type: 'rest'
    });
  }
  
  return schedule;
}

function getNextWeekendDates(): { saturday: Date; sunday: Date } {
  const today = new Date();
  let saturday: Date;
  let sunday: Date;
  
  if (isSaturday(today)) {
    saturday = today;
    sunday = addDays(today, 1);
  } else if (isSunday(today)) {
    saturday = nextSaturday(today);
    sunday = addDays(saturday, 1);
  } else {
    saturday = nextSaturday(today);
    sunday = addDays(saturday, 1);
  }
  
  return { saturday: startOfDay(saturday), sunday: startOfDay(sunday) };
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'home': return 'bg-blue-500/20 border-blue-500/30 text-blue-400';
    case 'travel': return 'bg-purple-500/20 border-purple-500/30 text-purple-400';
    case 'meal': return 'bg-amber-500/20 border-amber-500/30 text-amber-400';
    case 'activity': return 'bg-green-500/20 border-green-500/30 text-green-400';
    case 'rest': return 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400';
    default: return 'bg-white/10 border-white/20 text-white';
  }
}

export function AddToPlanDialog({ place, open, onOpenChange }: AddToPlanDialogProps) {
  const { toast } = useToast();
  const createPlan = useCreatePlan();
  const { saturday, sunday } = useMemo(() => getNextWeekendDates(), []);
  const [weekOffset, setWeekOffset] = useState(0);
  const [isSaturdaySelected, setIsSaturdaySelected] = useState(true);
  const [plannedPlaces, setPlannedPlaces] = useState<PlannedPlace[]>([]);
  const [showPlaceSelector, setShowPlaceSelector] = useState(false);
  const [showPackingChecklist, setShowPackingChecklist] = useState(false);
  
  // Fetch all places for the selector
  const { data: allPlaces = [] } = useQuery<Place[]>({
    queryKey: ['/api/places'],
  });
  
  const adjustedSaturday = startOfDay(addDays(saturday, weekOffset * 7));
  const adjustedSunday = startOfDay(addDays(sunday, weekOffset * 7));
  const selectedDate = isSaturdaySelected ? adjustedSaturday : adjustedSunday;
  
  // Initialize with the provided place
  useEffect(() => {
    if (place && open) {
      setPlannedPlaces([{ place }]);
    }
  }, [place, open]);
  
  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setPlannedPlaces([]);
      setShowPlaceSelector(false);
      setWeekOffset(0);
      setIsSaturdaySelected(true);
    }
  }, [open]);
  
  const schedule = useMemo(() => {
    return generateMultiStopSchedule(plannedPlaces);
  }, [plannedPlaces]);
  
  const addPlace = (newPlace: Place) => {
    if (!plannedPlaces.find(p => p.place.id === newPlace.id)) {
      setPlannedPlaces([...plannedPlaces, { place: newPlace }]);
    }
    setShowPlaceSelector(false);
  };
  
  const removePlace = (placeId: number) => {
    setPlannedPlaces(plannedPlaces.filter(p => p.place.id !== placeId));
  };
  
  const movePlace = (index: number, direction: 'up' | 'down') => {
    const newPlaces = [...plannedPlaces];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newPlaces.length) return;
    [newPlaces[index], newPlaces[newIndex]] = [newPlaces[newIndex], newPlaces[index]];
    setPlannedPlaces(newPlaces);
  };
  
  const handleCreatePlan = async () => {
    if (plannedPlaces.length === 0) return;
    
    try {
      await createPlan.mutateAsync({
        planDate: format(selectedDate, 'yyyy-MM-dd'),
        places: plannedPlaces.map((p, idx) => ({ placeId: p.place.id, order: idx, notes: '' })),
        notes: plannedPlaces.length === 1 
          ? `Day trip to ${plannedPlaces[0].place.name}`
          : `Multi-stop adventure: ${plannedPlaces.map(p => p.place.name).join(' → ')}`,
        status: 'planned'
      });
      
      toast({
        title: "Plan Created!",
        description: `Your ${plannedPlaces.length}-stop adventure is scheduled for ${format(selectedDate, 'EEEE, MMMM d')}.`,
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create plan. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const exportToCalendar = useMutation({
    mutationFn: async () => {
      const parse12HourTo24Hour = (time12h: string): string => {
        const match = time12h.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (!match) return '12:00';
        
        let hours = parseInt(match[1]);
        const minutes = match[2];
        const isPM = match[3].toUpperCase() === 'PM';
        
        if (isPM && hours !== 12) {
          hours += 12;
        } else if (!isPM && hours === 12) {
          hours = 0;
        }
        
        return `${hours.toString().padStart(2, '0')}:${minutes}`;
      };
      
      const calendarSchedule = schedule.map(item => ({
        type: item.type,
        title: item.activity,
        startTime: parse12HourTo24Hour(item.time),
        endTime: parse12HourTo24Hour(item.endTime),
        description: item.description + (item.details ? '\n\n' + item.details.join('\n') : ''),
        location: item.placeId ? plannedPlaces.find(p => p.place.id === item.placeId)?.place.address || '' : '',
        placeId: item.placeId,
      }));
      
      const response = await apiRequest('POST', '/api/calendar/add-trip', {
        schedule: calendarSchedule,
        date: format(selectedDate, 'yyyy-MM-dd'),
        notes: `Weekend adventure: ${plannedPlaces.map(p => p.place.name).join(' → ')}`,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Exported to Calendar",
        description: data.message || `Added ${data.eventsCreated} events to your Google Calendar`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Calendar Export Failed",
        description: error.message || "Could not export to Google Calendar",
        variant: "destructive",
      });
    },
  });
  
  // Calculate total drive time and visit time
  const totalDriveTime = useMemo(() => {
    let total = 0;
    let prev: Place | null = null;
    for (const { place } of plannedPlaces) {
      total += calculateDriveBetween(prev, place);
      prev = place;
    }
    // Add drive home from last place
    if (plannedPlaces.length > 0) {
      total += plannedPlaces[plannedPlaces.length - 1].place.driveTimeMinutes || 60;
    }
    return total;
  }, [plannedPlaces]);
  
  const totalVisitTime = useMemo(() => {
    return plannedPlaces.reduce((sum, { place, customDuration }) => {
      return sum + (customDuration || parseVisitDuration(place.averageVisitDuration));
    }, 0);
  }, [plannedPlaces]);
  
  // Available places to add (not already in plan)
  const availablePlaces = allPlaces.filter(p => !plannedPlaces.find(pp => pp.place.id === p.id));
  
  if (!place) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[95vh] p-0 overflow-hidden bg-card border-white/10">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-display font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Plan Your Adventure
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Add multiple destinations and arrange them in your preferred order.
          </DialogDescription>
        </DialogHeader>
        
        <div className="px-6 pt-4">
          {/* Weekend Date Selector */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setWeekOffset(weekOffset - 1)}
              disabled={weekOffset <= 0}
              data-testid="button-prev-week"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex gap-3">
              <Button
                variant={isSaturdaySelected ? "default" : "outline"}
                className="min-w-[140px]"
                onClick={() => setIsSaturdaySelected(true)}
                data-testid="button-select-saturday"
              >
                <div className="flex flex-col items-center">
                  <span className="font-bold">Saturday</span>
                  <span className="text-xs opacity-80">{format(adjustedSaturday, 'MMM d')}</span>
                </div>
              </Button>
              
              <Button
                variant={!isSaturdaySelected ? "default" : "outline"}
                className="min-w-[140px]"
                onClick={() => setIsSaturdaySelected(false)}
                data-testid="button-select-sunday"
              >
                <div className="flex flex-col items-center">
                  <span className="font-bold">Sunday</span>
                  <span className="text-xs opacity-80">{format(adjustedSunday, 'MMM d')}</span>
                </div>
              </Button>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setWeekOffset(weekOffset + 1)}
              disabled={weekOffset >= 8}
              data-testid="button-next-week"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Planned Places with Reorder */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">Destinations ({plannedPlaces.length})</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPlaceSelector(true)}
                className="gap-1"
                data-testid="button-add-destination"
              >
                <Plus className="w-3 h-3" />
                Add Stop
              </Button>
            </div>
            
            <div className="space-y-2 mb-3">
              {plannedPlaces.map((pp, index) => (
                <div
                  key={pp.place.id}
                  className="flex items-center gap-2 p-3 bg-white/5 rounded-lg border border-white/10"
                  data-testid={`planned-place-${pp.place.id}`}
                >
                  <div className="flex flex-col gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => movePlace(index, 'up')}
                      disabled={index === 0}
                      data-testid={`button-move-up-${pp.place.id}`}
                    >
                      <ArrowUp className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => movePlace(index, 'down')}
                      disabled={index === plannedPlaces.length - 1}
                      data-testid={`button-move-down-${pp.place.id}`}
                    >
                      <ArrowDown className="w-3 h-3" />
                    </Button>
                  </div>
                  
                  <Badge variant="outline" className="shrink-0">{index + 1}</Badge>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{pp.place.name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {parseVisitDuration(pp.place.averageVisitDuration)} min visit
                      </span>
                      <span className="flex items-center gap-1">
                        <Car className="w-3 h-3" />
                        {index === 0 ? pp.place.driveTimeMinutes : calculateDriveBetween(plannedPlaces[index - 1].place, pp.place)} min drive
                      </span>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-red-400"
                    onClick={() => removePlace(pp.place.id)}
                    disabled={plannedPlaces.length === 1}
                    data-testid={`button-remove-${pp.place.id}`}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            {/* Summary Stats */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground bg-white/5 p-2 rounded-lg">
              <div className="flex items-center gap-1">
                <Car className="w-3.5 h-3.5 text-purple-400" />
                <span>Total drive: {Math.round(totalDriveTime)} min</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-green-400" />
                <span>Total visit: {Math.round(totalVisitTime / 60)}h {totalVisitTime % 60}m</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>Day ends: ~{schedule.length > 0 ? schedule[schedule.length - 1].endTime : '9:00 PM'}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Place Selector - Inline Expansion */}
        {showPlaceSelector && (
          <div className="px-6 pb-4">
            <Card className="border-primary/30 bg-white/5">
              <div className="p-3 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-bold text-white text-sm">Select a Destination to Add</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setShowPlaceSelector(false)}
                  data-testid="button-close-place-selector"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <ScrollArea className="h-[200px]">
                <div className="p-3 space-y-2">
                  {availablePlaces.map(p => (
                    <button
                      key={p.id}
                      onClick={() => addPlace(p)}
                      className="w-full p-3 text-left bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
                      data-testid={`select-place-${p.id}`}
                    >
                      <p className="font-medium text-white text-sm">{p.name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                        <span>{p.category}</span>
                        <span>{p.driveTimeMinutes || '?'} min from home</span>
                        <span>{p.distanceMiles || '?'} mi</span>
                      </div>
                    </button>
                  ))}
                  {availablePlaces.length === 0 && (
                    <p className="text-center text-muted-foreground py-4 text-sm">
                      All destinations are already in your plan!
                    </p>
                  )}
                </div>
              </ScrollArea>
            </Card>
          </div>
        )}
        
        {/* Schedule Preview */}
        <div className="px-6 pb-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Optimized Schedule Preview</span>
          </div>
        </div>
        
        <ScrollArea className="h-[300px] px-6">
          <div className="space-y-2 pb-6">
            {schedule.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className={`p-3 rounded-xl border ${getTypeColor(item.type)}`}
                  data-testid={`schedule-item-${index}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-white/80">
                          {item.time} - {item.endTime}
                        </span>
                      </div>
                      <h4 className="font-semibold text-white text-sm">{item.activity}</h4>
                      <p className="text-xs text-white/60 mt-0.5">{item.description}</p>
                      {item.details && item.details.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-white/10">
                          <ul className="space-y-1">
                            {item.details.map((detail, i) => (
                              <li key={i} className="text-xs text-white/50 flex items-start gap-1">
                                <span className="text-white/30">-</span>
                                <span>{detail}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        
        {/* Footer Actions */}
        <div className="p-6 pt-4 border-t border-white/10 bg-card">
          <div className="flex gap-3 flex-wrap">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPackingChecklist(true)}
              disabled={plannedPlaces.length === 0}
              data-testid="button-packing-checklist"
              title="Packing Checklist"
            >
              <Backpack className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => exportToCalendar.mutate()}
              disabled={exportToCalendar.isPending || plannedPlaces.length === 0}
              data-testid="button-export-calendar"
            >
              {exportToCalendar.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <CalendarPlus className="w-4 h-4" />
                  Export to Calendar
                </>
              )}
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handleCreatePlan}
              disabled={createPlan.isPending || plannedPlaces.length === 0}
              data-testid="button-create-plan"
            >
              {createPlan.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Create Plan
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Packing Checklist Modal */}
      <PackingChecklist
        places={plannedPlaces.map(p => p.place)}
        open={showPackingChecklist}
        onOpenChange={setShowPackingChecklist}
      />
    </Dialog>
  );
}
