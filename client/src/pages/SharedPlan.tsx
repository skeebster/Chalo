import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Clock, Star, Calendar, ExternalLink, Car } from "lucide-react";
import type { WeekendPlan, Place } from "@shared/schema";

interface SharedPlanResponse {
  plan: WeekendPlan;
  places: Place[];
}

export default function SharedPlan() {
  const [, params] = useRoute("/shared/:shareCode");
  const [, setLocation] = useLocation();
  const shareCode = params?.shareCode;

  const { data, isLoading, error } = useQuery<SharedPlanResponse>({
    queryKey: ["/api/shared", shareCode],
    enabled: !!shareCode,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-48" />
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">
              This trip link is no longer available or has expired.
            </p>
            <Button onClick={() => setLocation("/")} data-testid="button-go-home">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { plan, places } = data;
  const planPlaces = (plan.places as Array<{ placeId: number; notes?: string }>) || [];
  const placesMap = new Map(places.map((p) => [p.id, p]));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-display font-bold text-foreground" data-testid="text-plan-title">
            Trip Plan
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span data-testid="text-plan-date">
                {plan.planDate ? new Date(plan.planDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }) : "No date set"}
              </span>
            </div>
            <Badge variant="secondary" data-testid="badge-plan-status">
              {plan.status}
            </Badge>
          </div>
          {plan.notes && (
            <p className="text-muted-foreground mt-2" data-testid="text-plan-notes">
              {plan.notes}
            </p>
          )}
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-display font-semibold text-foreground">
            Places ({planPlaces.length})
          </h2>
          
          {planPlaces.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No places added to this trip yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {planPlaces.map((planPlace, index) => {
                const place = placesMap.get(planPlace.placeId);
                if (!place) {
                  return (
                    <Card key={planPlace.placeId} className="opacity-60" data-testid={`card-place-missing-${planPlace.placeId}`}>
                      <CardContent className="py-4 text-center">
                        <p className="text-muted-foreground text-sm">This destination is no longer available</p>
                      </CardContent>
                    </Card>
                  );
                }

                return (
                  <Card key={planPlace.placeId} data-testid={`card-place-${planPlace.placeId}`}>
                    <CardHeader className="flex flex-row items-start gap-4 pb-2">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold">
                        {index + 1}
                      </div>
                      <div className="flex-1 space-y-1">
                        <CardTitle className="text-lg">{place.name}</CardTitle>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          {place.googleRating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                              <span>{place.googleRating}</span>
                            </div>
                          )}
                          {place.driveTimeMinutes && (
                            <div className="flex items-center gap-1">
                              <Car className="h-3.5 w-3.5" />
                              <span>{place.driveTimeMinutes} min drive</span>
                            </div>
                          )}
                          {place.category && (
                            <Badge variant="outline" className="text-xs">
                              {place.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {place.overview && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {place.overview}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {place.address && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate max-w-[200px]">{place.address}</span>
                          </div>
                        )}
                        {place.averageVisitDuration && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{place.averageVisitDuration}</span>
                          </div>
                        )}
                      </div>

                      {planPlace.notes && (
                        <p className="text-sm italic text-muted-foreground bg-muted/50 rounded p-2">
                          Note: {planPlace.notes}
                        </p>
                      )}

                      {place.googleMapsUrl && (
                        <a
                          href={place.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                          data-testid={`link-maps-${planPlace.placeId}`}
                        >
                          <ExternalLink className="h-3 w-3" />
                          View on Google Maps
                        </a>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        <footer className="pt-6 border-t text-center text-sm text-muted-foreground">
          <p>Shared from Weekend Planner</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => setLocation("/")}
            data-testid="button-start-planning"
          >
            Start Planning Your Own Adventure
          </Button>
        </footer>
      </div>
    </div>
  );
}
