import { MapPin, Clock, DollarSign, CheckCircle, Navigation, Star, ArrowUpRight } from 'lucide-react';
import { Place } from '../lib/supabase';

type Props = {
  place: Place;
  onClick: () => void;
};

export default function PlaceCard({ place, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className="bg-dark-800 rounded-xl border border-white/[0.08] hover:border-rust-500/50 transition-all cursor-pointer overflow-hidden group"
    >
      {place.image_url ? (
        <div className="h-52 overflow-hidden bg-dark-900 relative">
          <img
            src={place.image_url}
            alt={place.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-800 via-dark-800/30 to-transparent"></div>
          {place.visited && (
            <div className="absolute top-3 right-3 p-2 bg-dark-900/80 backdrop-blur-sm rounded-lg border border-white/10">
              <CheckCircle className="w-4 h-4 text-rust-400" />
            </div>
          )}
        </div>
      ) : (
        <div className="h-52 bg-gradient-to-br from-dark-800 to-dark-900 flex items-center justify-center relative">
          <MapPin className="w-16 h-16 text-rust-500/20" />
          {place.visited && (
            <div className="absolute top-3 right-3 p-2 bg-dark-900/80 backdrop-blur-sm rounded-lg border border-white/10">
              <CheckCircle className="w-4 h-4 text-rust-400" />
            </div>
          )}
        </div>
      )}

      <div className="p-5">
        <div className="mb-3">
          <h3 className="text-base font-semibold text-white line-clamp-2 leading-snug tracking-tight group-hover:text-rust-400 transition-colors">
            {place.name}
          </h3>
        </div>

        {place.category && (
          <span className="inline-block px-2.5 py-1 bg-rust-500/15 text-rust-400 text-[11px] font-medium rounded-md mb-3 uppercase tracking-wider border border-rust-500/20">
            {place.category}
          </span>
        )}

        {place.overview && (
          <p className="text-sm text-white/50 line-clamp-2 mb-4 leading-relaxed">
            {place.overview}
          </p>
        )}

        <div className="space-y-2 mb-4">
          {place.distance_miles && (
            <div className="flex items-center text-sm text-white/40">
              <Navigation className="w-3.5 h-3.5 mr-2 text-rust-500/70" />
              <span>{place.distance_miles} miles</span>
              {place.drive_time_minutes && (
                <span className="text-white/30 ml-1">
                  ({place.drive_time_minutes < 60
                    ? `${place.drive_time_minutes}m`
                    : `${Math.floor(place.drive_time_minutes / 60)}h ${place.drive_time_minutes % 60}m`})
                </span>
              )}
            </div>
          )}

          {place.average_visit_duration && (
            <div className="flex items-center text-sm text-white/40">
              <Clock className="w-3.5 h-3.5 mr-2 text-rust-500/70" />
              <span>{place.average_visit_duration}</span>
            </div>
          )}

          {place.average_spend && (
            <div className="flex items-center text-sm text-white/40">
              <DollarSign className="w-3.5 h-3.5 mr-2 text-rust-500/70" />
              <span>~${place.average_spend}</span>
            </div>
          )}
        </div>

        {(place.google_rating || place.tripadvisor_rating) && (
          <div className="pt-3 border-t border-white/[0.06]">
            <div className="flex items-center justify-between">
              {place.google_rating && (
                <div className="flex items-center space-x-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="font-semibold text-white text-sm">
                    {place.google_rating.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-white/30 uppercase tracking-wider">Google</span>
                </div>
              )}
              {place.tripadvisor_rating && (
                <div className="flex items-center space-x-1.5">
                  <Star className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                  <span className="font-semibold text-white text-sm">
                    {place.tripadvisor_rating.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-white/30 uppercase tracking-wider">TripAdvisor</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center text-rust-400 text-xs font-medium group-hover:text-rust-300 transition-colors">
          <span className="uppercase tracking-wider">View Details</span>
          <ArrowUpRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
}
