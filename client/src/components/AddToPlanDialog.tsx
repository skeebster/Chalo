import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Place, WeekendPlan } from "@shared/schema";
import { useCreatePlan } from "@/hooks/use-plans";
import { useState, useMemo } from "react";
import { Calendar, Clock, Car, Coffee, Utensils, MapPin, Sun, Moon, Home, Loader2, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, nextSaturday, nextSunday, isSaturday, isSunday, startOfDay, addMinutes, setHours, setMinutes } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface AddToPlanDialogProps {
  place: Place | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ScheduleItem {
  time: string;
  endTime: string;
  activity: string;
  description: string;
  icon: any;
  type: 'home' | 'travel' | 'meal' | 'activity' | 'rest';
}

function parseVisitDuration(duration: string | null | undefined): number {
  if (!duration) return 180;
  const match = duration.match(/(\d+)/);
  if (match) {
    const hours = parseInt(match[1]);
    return hours * 60;
  }
  return 180;
}

function formatTime(date: Date): string {
  return format(date, 'h:mm a');
}

function generateSchedule(place: Place): ScheduleItem[] {
  const schedule: ScheduleItem[] = [];
  const driveTime = place.driveTimeMinutes || 60;
  const visitDuration = parseVisitDuration(place.averageVisitDuration);
  
  let currentTime = setMinutes(setHours(new Date(), 6), 0);
  
  schedule.push({
    time: formatTime(currentTime),
    endTime: formatTime(addMinutes(currentTime, 30)),
    activity: "Wake Up",
    description: "Rise and shine! Start your adventure day.",
    icon: Sun,
    type: 'home'
  });
  currentTime = addMinutes(currentTime, 30);
  
  schedule.push({
    time: formatTime(currentTime),
    endTime: formatTime(addMinutes(currentTime, 45)),
    activity: "Get Ready",
    description: "Shower, dress comfortably, and pack snacks/supplies.",
    icon: Home,
    type: 'home'
  });
  currentTime = addMinutes(currentTime, 45);
  
  schedule.push({
    time: formatTime(currentTime),
    endTime: formatTime(addMinutes(currentTime, 30)),
    activity: "Breakfast",
    description: "Quick breakfast at home or grab something on the road.",
    icon: Coffee,
    type: 'meal'
  });
  currentTime = addMinutes(currentTime, 30);
  
  const departureTime = currentTime;
  schedule.push({
    time: formatTime(currentTime),
    endTime: formatTime(addMinutes(currentTime, driveTime)),
    activity: "Drive to Destination",
    description: `Head to ${place.name} (${Math.round(driveTime)} min drive, ${place.distanceMiles || '?'} miles).`,
    icon: Car,
    type: 'travel'
  });
  currentTime = addMinutes(currentTime, driveTime);
  
  const arrivalTime = currentTime;
  const morningActivityDuration = Math.min(visitDuration, 120);
  schedule.push({
    time: formatTime(currentTime),
    endTime: formatTime(addMinutes(currentTime, morningActivityDuration)),
    activity: `Explore ${place.name}`,
    description: place.keyHighlights ? place.keyHighlights.split(';')[0].trim() : "Enjoy the main attractions.",
    icon: MapPin,
    type: 'activity'
  });
  currentTime = addMinutes(currentTime, morningActivityDuration);
  
  const lunchTime = setMinutes(setHours(new Date(), 12), 0);
  if (currentTime < lunchTime) {
    const remainingMorningTime = Math.floor((lunchTime.getTime() - currentTime.getTime()) / 60000);
    if (remainingMorningTime > 30) {
      schedule.push({
        time: formatTime(currentTime),
        endTime: formatTime(lunchTime),
        activity: "Continue Exploring",
        description: place.insiderTips ? place.insiderTips.split('.')[0].trim() + '.' : "Check out more areas and take photos.",
        icon: MapPin,
        type: 'activity'
      });
    }
    currentTime = lunchTime;
  }
  
  const restaurants = place.nearbyRestaurants || [];
  const lunchSpot = restaurants.length > 0 ? restaurants[0].name : "a nearby spot";
  schedule.push({
    time: formatTime(currentTime),
    endTime: formatTime(addMinutes(currentTime, 60)),
    activity: "Lunch Break",
    description: `Grab lunch at ${lunchSpot}.`,
    icon: Utensils,
    type: 'meal'
  });
  currentTime = addMinutes(currentTime, 60);
  
  const afternoonActivityDuration = Math.max(visitDuration - morningActivityDuration, 60);
  if (afternoonActivityDuration > 30) {
    schedule.push({
      time: formatTime(currentTime),
      endTime: formatTime(addMinutes(currentTime, afternoonActivityDuration)),
      activity: "Afternoon Activities",
      description: place.keyHighlights ? 
        (place.keyHighlights.split(';')[1]?.trim() || "Explore remaining areas and wrap up your visit.") : 
        "Finish exploring and take final photos.",
      icon: MapPin,
      type: 'activity'
    });
    currentTime = addMinutes(currentTime, afternoonActivityDuration);
  }
  
  schedule.push({
    time: formatTime(currentTime),
    endTime: formatTime(addMinutes(currentTime, driveTime)),
    activity: "Drive Home",
    description: `Head back home (${Math.round(driveTime)} min drive).`,
    icon: Car,
    type: 'travel'
  });
  currentTime = addMinutes(currentTime, driveTime);
  
  const dinnerTime = setMinutes(setHours(new Date(), 18), 30);
  if (currentTime < dinnerTime) {
    schedule.push({
      time: formatTime(currentTime),
      endTime: formatTime(dinnerTime),
      activity: "Rest & Unwind",
      description: "Take a break, freshen up, and relax.",
      icon: Home,
      type: 'rest'
    });
    currentTime = dinnerTime;
  }
  
  schedule.push({
    time: formatTime(currentTime),
    endTime: formatTime(addMinutes(currentTime, 60)),
    activity: "Dinner",
    description: "Enjoy dinner at home or order in.",
    icon: Utensils,
    type: 'meal'
  });
  currentTime = addMinutes(currentTime, 60);
  
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
  
  const adjustedSaturday = startOfDay(addDays(saturday, weekOffset * 7));
  const adjustedSunday = startOfDay(addDays(sunday, weekOffset * 7));
  
  const selectedDate = isSaturdaySelected ? adjustedSaturday : adjustedSunday;
  
  const schedule = useMemo(() => {
    if (!place) return [];
    return generateSchedule(place);
  }, [place]);
  
  const handleCreatePlan = async () => {
    if (!place) return;
    
    try {
      await createPlan.mutateAsync({
        planDate: format(selectedDate, 'yyyy-MM-dd'),
        places: [{ placeId: place.id, notes: '' }],
        notes: `Day trip to ${place.name}`,
        status: 'planned'
      });
      
      toast({
        title: "Plan Created!",
        description: `Your trip to ${place.name} is scheduled for ${format(selectedDate, 'EEEE, MMMM d')}.`,
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
  
  if (!place) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden bg-card border-white/10">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-display font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Plan Your Day at {place.name}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Select a day and review your personalized hour-by-hour schedule.
          </DialogDescription>
        </DialogHeader>
        
        <div className="px-6 pt-4">
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
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Clock className="w-4 h-4" />
            <span>Daily Schedule: 6:00 AM - 9:00 PM</span>
            <Badge variant="outline" className="ml-auto text-xs">
              {place.driveTimeMinutes || 60} min drive
            </Badge>
          </div>
        </div>
        
        <ScrollArea className="h-[400px] px-6">
          <div className="space-y-3 pb-6">
            {schedule.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className={`p-4 rounded-xl border ${getTypeColor(item.type)}`}
                  data-testid={`schedule-item-${index}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-white/60">
                          {item.time} - {item.endTime}
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-sm">{item.activity}</h4>
                      <p className="text-xs text-white/70 mt-1">{item.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        
        <div className="p-6 pt-4 border-t border-white/10 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-plan"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreatePlan}
            disabled={createPlan.isPending}
            className="gap-2"
            data-testid="button-confirm-plan"
          >
            {createPlan.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Add to Plan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
