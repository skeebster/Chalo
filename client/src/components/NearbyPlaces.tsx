import { useMemo } from "react";
import { Place } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Car } from "lucide-react";
import { getDisplayImageUrl, DEFAULT_PLACE_IMAGE } from "@/lib/image-utils";

interface NearbyPlacesProps {
  currentPlace: Place;
  allPlaces: Place[];
  onPlaceClick: (place: Place) => void;
}

export function NearbyPlaces({ currentPlace, allPlaces, onPlaceClick }: NearbyPlacesProps) {
  const nearbyPlaces = useMemo(() => {
    if (!currentPlace.driveTimeMinutes || !allPlaces) return [];
    
    const currentDriveTime = currentPlace.driveTimeMinutes;
    const NEARBY_THRESHOLD = 20;
    
    return allPlaces
      .filter(place => {
        if (place.id === currentPlace.id) return false;
        if (!place.driveTimeMinutes) return false;
        
        const timeDiff = Math.abs(place.driveTimeMinutes - currentDriveTime);
        return timeDiff <= NEARBY_THRESHOLD;
      })
      .sort((a, b) => {
        const diffA = Math.abs((a.driveTimeMinutes || 0) - currentDriveTime);
        const diffB = Math.abs((b.driveTimeMinutes || 0) - currentDriveTime);
        return diffA - diffB;
      })
      .slice(0, 4);
  }, [currentPlace, allPlaces]);

  if (nearbyPlaces.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <MapPin className="w-5 h-5 text-primary" /> Combine Your Trip
      </h3>
      <p className="text-sm text-muted-foreground -mt-1">
        These destinations are within a similar drive from home
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {nearbyPlaces.map((place) => (
          <div
            key={place.id}
            className="flex gap-3 bg-white/5 border border-white/10 rounded-lg p-3 hover-elevate cursor-pointer"
            onClick={() => onPlaceClick(place)}
            data-testid={`nearby-place-${place.id}`}
          >
            <div 
              className="w-16 h-16 rounded-lg bg-cover bg-center shrink-0"
              style={{ 
                backgroundImage: `url(${getDisplayImageUrl(place.imageUrl, DEFAULT_PLACE_IMAGE)})` 
              }}
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-white text-sm truncate">{place.name}</h4>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-xs px-1.5 py-0">
                  {place.category}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Car className="w-3 h-3" />
                  {place.driveTimeMinutes} min
                </span>
                {place.distanceMiles && (
                  <span>{place.distanceMiles} mi</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
