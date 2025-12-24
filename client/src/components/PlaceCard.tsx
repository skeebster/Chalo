import { Place } from "@shared/schema";
import { Star, MapPin, Clock, Car, Sun, Cloud, CloudRain, Snowflake, CloudLightning, CloudSun, Droplets, Shirt } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { getDisplayImageUrl, DEFAULT_PLACE_IMAGE } from "@/lib/image-utils";
import { useWeather, DayForecast } from "@/hooks/use-weather";

function WeatherIcon({ code, className }: { code: number; className?: string }) {
  if (code === 0 || code === 1) return <Sun className={className} />;
  if (code === 2) return <CloudSun className={className} />;
  if (code >= 3 && code <= 48) return <Cloud className={className} />;
  if (code >= 51 && code <= 67) return <CloudRain className={className} />;
  if (code >= 71 && code <= 86) return <Snowflake className={className} />;
  if (code >= 95 && code <= 99) return <CloudLightning className={className} />;
  return <Cloud className={className} />;
}

interface PlaceCardProps {
  place: Place;
  onClick: () => void;
}

export function PlaceCard({ place, onClick }: PlaceCardProps) {
  const image = getDisplayImageUrl(place.imageUrl, DEFAULT_PLACE_IMAGE);
  const isHighlyRated = place.googleRating ? parseFloat(place.googleRating) >= 4.8 : false;
  
  const lat = place.latitude ? parseFloat(place.latitude) : null;
  const lng = place.longitude ? parseFloat(place.longitude) : null;
  const { data: weather } = useWeather(lat, lng);

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
      onClick={onClick}
      className={`group cursor-pointer bg-card rounded-2xl overflow-hidden border shadow-lg transition-all h-full flex flex-col ${
        isHighlyRated 
          ? "border-amber-500/30 hover:border-amber-400/60 hover:shadow-xl hover:shadow-amber-500/20 ring-1 ring-amber-500/10 hover:ring-amber-400/30" 
          : "border-border/50 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5"
      }`}
      data-testid={`card-place-${place.id}`}
    >
      {/* Weather Section - Prominent at top */}
      {weather && (
        <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/20">
                <WeatherIcon code={weather.code} className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                  {weather.temp}°
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">{weather.description}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">H: {weather.high}° L: {weather.low}°</div>
              {weather.precipProb > 0 && (
                <div className="flex items-center justify-end gap-1 text-xs text-blue-400 mt-0.5">
                  <Droplets className="w-3 h-3" />
                  {weather.precipProb}% rain
                </div>
              )}
            </div>
          </div>
          
          {/* 7-day forecast row */}
          <div className="flex justify-between gap-0.5 sm:gap-1 mt-2 pt-2 border-t border-border/30">
            {weather.weekForecast.map((day, i) => (
              <div 
                key={i} 
                className={`flex flex-col items-center flex-1 py-1 rounded ${
                  i === 0 ? 'bg-primary/10' : ''
                }`}
              >
                <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  {day.dayName}
                </span>
                <WeatherIcon code={day.code} className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-foreground my-0.5" />
                <span className="text-[10px] sm:text-xs font-bold">{day.high}°</span>
                <span className="text-[9px] sm:text-[10px] text-muted-foreground">{day.low}°</span>
              </div>
            ))}
          </div>
          
          {/* Attire recommendations */}
          {weather.attire.length > 0 && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/30">
              <Shirt className="w-3.5 h-3.5 text-primary shrink-0" />
              <div className="flex flex-wrap gap-1">
                {weather.attire.slice(0, 3).map((item, i) => (
                  <span key={i} className="text-[10px] sm:text-xs text-muted-foreground">
                    {item}{i < Math.min(weather.attire.length, 3) - 1 ? ' · ' : ''}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Image section */}
      <div className="relative h-28 sm:h-40 overflow-hidden">
        <img
          src={image}
          alt={place.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
        
        <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex gap-1 sm:gap-2">
          {isHighlyRated && (
            <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold border-0 text-[10px] sm:text-xs px-1.5 sm:px-2">
              Top Rated
            </Badge>
          )}
          <Badge variant="secondary" className="bg-black/50 backdrop-blur-md border-white/10 text-white hover:bg-black/60 text-[10px] sm:text-xs px-1.5 sm:px-2">
            {place.category || "General"}
          </Badge>
        </div>

        <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 flex items-center gap-1 sm:gap-2">
          {place.distanceMiles && (
            <div className="flex items-center gap-1 text-[10px] sm:text-xs font-medium text-white/90 bg-black/40 backdrop-blur-sm px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md">
              <Car className="w-2.5 sm:w-3 h-2.5 sm:h-3" />
              {place.distanceMiles} mi
            </div>
          )}
        </div>
      </div>

      {/* Content section */}
      <div className="p-3 sm:p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start gap-2 mb-1.5 sm:mb-2">
          <h3 className="font-display font-bold text-sm sm:text-lg leading-tight text-white group-hover:text-primary transition-colors line-clamp-2">
            {place.name}
          </h3>
          {place.googleRating && (
            <div className="flex items-center gap-1 text-yellow-500 text-xs sm:text-sm font-bold bg-yellow-500/10 px-1.5 py-0.5 rounded shrink-0">
              <Star className="w-3 sm:w-3.5 h-3 sm:h-3.5 fill-current" />
              {place.googleRating}
            </div>
          )}
        </div>

        <p className="text-muted-foreground text-xs sm:text-sm line-clamp-2 sm:line-clamp-3 mb-2 sm:mb-4 flex-1">
          {place.overview || place.keyHighlights}
        </p>

        <div className="flex items-center gap-2 sm:gap-4 text-xs text-muted-foreground border-t border-border/50 pt-2 sm:pt-4 mt-auto">
          {place.driveTimeMinutes && (
            <button
              className="flex items-center gap-1.5 hover:text-primary transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                const homeAddress = "8 Canvass Ct, Somerset, NJ 08873";
                const destination = encodeURIComponent(place.address || place.name);
                const origin = encodeURIComponent(homeAddress);
                window.open(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`, '_blank');
              }}
              data-testid={`button-directions-${place.id}`}
            >
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>{place.driveTimeMinutes} min drive</span>
            </button>
          )}
          {place.averageSpend && (
            <div className="flex items-center gap-1.5">
              <span className="text-primary font-bold">$</span>
              <span>~${place.averageSpend}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
