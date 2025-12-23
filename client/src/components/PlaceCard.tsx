import { Place } from "@shared/schema";
import { Star, MapPin, Clock, Car } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { getDisplayImageUrl, DEFAULT_PLACE_IMAGE } from "@/lib/image-utils";

interface PlaceCardProps {
  place: Place;
  onClick: () => void;
}

export function PlaceCard({ place, onClick }: PlaceCardProps) {
  // Use a fallback image if none provided
  const image = getDisplayImageUrl(place.imageUrl, DEFAULT_PLACE_IMAGE);
  
  // Check if this is a highly-rated place (4.8+)
  const isHighlyRated = place.googleRating ? parseFloat(place.googleRating) >= 4.8 : false;

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
      <div className="relative h-48 overflow-hidden">
        <img
          src={image}
          alt={place.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
        
        <div className="absolute top-3 right-3 flex gap-2">
          {isHighlyRated && (
            <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold border-0">
              Top Rated
            </Badge>
          )}
          <Badge variant="secondary" className="bg-black/50 backdrop-blur-md border-white/10 text-white hover:bg-black/60">
            {place.category || "General"}
          </Badge>
        </div>

        {place.distanceMiles && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 text-xs font-medium text-white/90 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-md">
            <Car className="w-3 h-3" />
            {place.distanceMiles} mi
          </div>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-display font-bold text-lg leading-tight text-white group-hover:text-primary transition-colors line-clamp-2">
            {place.name}
          </h3>
          {place.googleRating && (
            <div className="flex items-center gap-1 text-yellow-500 text-sm font-bold bg-yellow-500/10 px-1.5 py-0.5 rounded">
              <Star className="w-3.5 h-3.5 fill-current" />
              {place.googleRating}
            </div>
          )}
        </div>

        <p className="text-muted-foreground text-sm line-clamp-3 mb-4 flex-1">
          {place.overview || place.keyHighlights}
        </p>

        <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-border/50 pt-4 mt-auto">
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
