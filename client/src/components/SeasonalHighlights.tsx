import { useMemo } from "react";
import { Place } from "@shared/schema";
import { PlaceCard } from "./PlaceCard";
import { Sparkles } from "lucide-react";

interface SeasonalHighlightsProps {
  places: Place[];
  onPlaceClick: (place: Place) => void;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const SEASON_MAP: Record<number, string[]> = {
  0: ["Winter", "January"],
  1: ["Winter", "February"],
  2: ["Spring", "March"],
  3: ["Spring", "April"],
  4: ["Spring", "May"],
  5: ["Summer", "June"],
  6: ["Summer", "July"],
  7: ["Summer", "August"],
  8: ["Fall", "Autumn", "September"],
  9: ["Fall", "Autumn", "October"],
  10: ["Fall", "Autumn", "November"],
  11: ["Winter", "December", "Holiday"],
};

export function SeasonalHighlights({ places, onPlaceClick }: SeasonalHighlightsProps) {
  const currentMonth = new Date().getMonth();
  const seasonKeywords = SEASON_MAP[currentMonth] || [];
  const currentMonthName = MONTH_NAMES[currentMonth];

  const seasonalPlaces = useMemo(() => {
    if (!places || places.length === 0) return [];

    return places.filter(place => {
      if (!place.bestSeasons) return false;
      const seasons = place.bestSeasons.toLowerCase();
      
      if (seasons.includes("year-round") || seasons.includes("year round")) {
        return false;
      }
      
      for (const keyword of seasonKeywords) {
        if (seasons.includes(keyword.toLowerCase())) {
          return true;
        }
      }
      
      if (seasons.includes(currentMonthName.toLowerCase())) {
        return true;
      }
      
      return false;
    }).slice(0, 4);
  }, [places, seasonKeywords, currentMonthName]);

  if (seasonalPlaces.length === 0) return null;

  const seasonName = seasonKeywords[0] || currentMonthName;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="bg-primary/20 p-2 rounded-lg">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-display font-bold text-white">
            Best for {seasonName}
          </h2>
          <p className="text-sm text-muted-foreground">
            Perfect destinations to visit right now
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {seasonalPlaces.map((place) => (
          <PlaceCard
            key={place.id}
            place={place}
            onClick={() => onPlaceClick(place)}
          />
        ))}
      </div>
    </div>
  );
}
