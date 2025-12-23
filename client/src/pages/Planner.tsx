import { Navbar } from "@/components/Navbar";
import { usePlans, useDeletePlan } from "@/hooks/use-plans";
import { useQuery } from "@tanstack/react-query";
import { Place } from "@shared/schema";
import { useState } from "react";
import { Loader2, Calendar, Clock, Car, Coffee, Utensils, MapPin, Sun, Moon, Home, Trash2, ChevronDown, ChevronUp, Sparkles, Share2, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { format, setHours, setMinutes, addMinutes } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ScheduleItem {
  time: string;
  endTime: string;
  activity: string;
  description: string;
  icon: any;
  type: 'home' | 'travel' | 'meal' | 'activity' | 'rest';
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
  const match = distanceStr.match(/^~?(\d+(?:\.\d+)?)/);
  if (match) {
    return parseFloat(match[1]);
  }
  return 0;
}

function calculateDriveBetween(from: Place | null, to: Place): number {
  if (!from) {
    return to.driveTimeMinutes || 60;
  }
  
  const fromDriveFromHome = from.driveTimeMinutes || 0;
  const toDriveFromHome = to.driveTimeMinutes || 0;
  
  if (fromDriveFromHome > 0 && toDriveFromHome > 0) {
    const timeDiff = Math.abs(toDriveFromHome - fromDriveFromHome);
    return Math.max(15, Math.round(timeDiff * 0.6 + 10));
  }
  
  const fromDist = parseDistanceMiles(from.distanceMiles);
  const toDist = parseDistanceMiles(to.distanceMiles);
  const estimatedDistance = Math.abs(toDist - fromDist) * 0.7;
  return Math.max(15, Math.round(estimatedDistance * 2));
}

function generateMultiStopSchedule(places: Place[]): ScheduleItem[] {
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
    const place = places[i];
    const driveTime = calculateDriveBetween(previousPlace, place);
    const visitDuration = parseVisitDuration(place.averageVisitDuration);
    
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
  const lastPlace = places[places.length - 1];
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

interface PlanCardProps {
  plan: any;
  places: Place[];
  onDelete: (id: number) => void;
}

function PlanCard({ plan, places, onDelete }: PlanCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (shareUrl) {
      await copyToClipboard();
      return;
    }
    
    setIsSharing(true);
    try {
      const response = await fetch(`/api/plans/${plan.id}/share`, {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        const fullUrl = window.location.origin + data.shareUrl;
        setShareUrl(fullUrl);
        await navigator.clipboard.writeText(fullUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }
    } catch (error) {
      console.error('Failed to share plan:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const copyToClipboard = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };
  
  // Get places in order (use order field if available)
  const planPlaces = (plan.places || [])
    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
    .map((p: { placeId: number }) => places.find(place => place.id === p.placeId))
    .filter(Boolean) as Place[];
  
  const schedule = planPlaces.length > 0 ? generateMultiStopSchedule(planPlaces) : [];
  
  const planDate = new Date(plan.planDate + 'T00:00:00');
  const dayOfWeek = format(planDate, 'EEEE');
  const formattedDate = format(planDate, 'MMMM d, yyyy');
  
  // Calculate totals
  let totalDrive = 0;
  let prev: Place | null = null;
  for (const place of planPlaces) {
    totalDrive += calculateDriveBetween(prev, place);
    prev = place;
  }
  if (planPlaces.length > 0) {
    totalDrive += planPlaces[planPlaces.length - 1].driveTimeMinutes || 60;
  }
  
  const totalVisit = planPlaces.reduce((sum, p) => sum + parseVisitDuration(p.averageVisitDuration), 0);
  
  return (
    <Card className="overflow-hidden border-white/10">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="outline" className="text-xs bg-primary/20 border-primary/30 text-primary">
                {dayOfWeek}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {planPlaces.length} stop{planPlaces.length !== 1 ? 's' : ''}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {plan.status}
              </Badge>
            </div>
            <h3 className="text-xl font-bold text-white">{formattedDate}</h3>
            {planPlaces.length > 0 && (
              <p className="text-muted-foreground mt-1">
                {planPlaces.length === 1 
                  ? `Day trip to ${planPlaces[0].name}`
                  : planPlaces.map(p => p.name).join(' → ')
                }
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              disabled={isSharing}
              className={isCopied ? "text-green-400" : "text-muted-foreground"}
              data-testid={`button-share-plan-${plan.id}`}
            >
              {isSharing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isCopied ? (
                <Check className="w-4 h-4" />
              ) : shareUrl ? (
                <Copy className="w-4 h-4" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteDialogOpen(true)}
              className="text-muted-foreground hover:text-red-400"
              data-testid={`button-delete-plan-${plan.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="gap-1"
              data-testid={`button-expand-plan-${plan.id}`}
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Hide
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Schedule
                </>
              )}
            </Button>
          </div>
        </div>
        
        {planPlaces.length > 0 && (
          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>6:00 AM - {schedule.length > 0 ? schedule[schedule.length - 1].endTime : '9:00 PM'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Car className="w-4 h-4 text-purple-400" />
              <span>{Math.round(totalDrive)} min total driving</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-green-400" />
              <span>{Math.floor(totalVisit / 60)}h {totalVisit % 60}m exploring</span>
            </div>
          </div>
        )}
      </div>
      
      {expanded && schedule.length > 0 && (
        <div className="border-t border-white/10 p-6 bg-white/5">
          <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Hour-by-Hour Schedule
          </h4>
          <div className="space-y-2">
            {schedule.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className={`p-3 rounded-xl border ${getTypeColor(item.type)}`}
                  data-testid={`plan-schedule-item-${index}`}
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
        </div>
      )}
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this plan?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove your plan for {formattedDate}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => onDelete(plan.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

export default function Planner() {
  const { data: plans, isLoading } = usePlans();
  const { data: places = [] } = useQuery<Place[]>({
    queryKey: ['/api/places'],
  });
  const deletePlan = useDeletePlan();

  const handleDeletePlan = (id: number) => {
    deletePlan.mutate(id);
  };

  const sortedPlans = plans?.slice().sort((a, b) => 
    new Date(a.planDate).getTime() - new Date(b.planDate).getTime()
  ) || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar onUploadClick={() => {}} />
      
      <main className="container mx-auto px-4 pt-8 pb-12">
        <div className="flex justify-between items-center mb-8 gap-4 flex-wrap">
          <h1 className="text-3xl font-display font-bold text-white">Your Weekend Plans</h1>
          <Badge variant="outline" className="text-sm">
            {sortedPlans.length} plan{sortedPlans.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : !sortedPlans.length ? (
          <div className="text-center py-20 bg-card rounded-3xl border border-white/5">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No plans yet</h3>
            <p className="text-muted-foreground">Start by exploring destinations and adding them to a plan.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {sortedPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                places={places}
                onDelete={handleDeletePlan}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
