import { useEffect, useRef } from 'react';
import { X, MapPin, Clock, DollarSign, Navigation, Calendar, Lightbulb, Star, CheckCircle, ExternalLink, Utensils, Car, Zap, ArrowUpRight } from 'lucide-react';
import { Place, supabase } from '../lib/supabase';

type Props = {
  place: Place;
  onClose: () => void;
  onUpdate: () => void;
};

export default function PlaceDetail({ place, onClose, onUpdate }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const handleToggleVisited = async () => {
    try {
      const { error } = await supabase
        .from('places')
        .update({
          visited: !place.visited,
          visited_date: !place.visited ? new Date().toISOString().split('T')[0] : null
        })
        .eq('id', place.id);

      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error('Error updating place:', error);
    }
  };

  const openGoogleMaps = () => {
    if (place.google_maps_url) {
      window.open(place.google_maps_url, '_blank');
    } else if (place.address) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`, '_blank');
    }
  };

  const openGoogleRating = () => {
    const searchQuery = encodeURIComponent(`${place.name} ${place.address || ''}`);
    window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
  };

  const openTripAdvisor = () => {
    const searchQuery = encodeURIComponent(place.name);
    window.open(`https://www.tripadvisor.com/Search?q=${searchQuery}`, '_blank');
  };

  const formatDriveTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div
        ref={panelRef}
        className="bg-[#0d1117] border border-white/10 rounded-xl shadow-2xl max-w-4xl w-full my-8 overflow-hidden"
      >
        <div className="relative">
          {place.image_url && (
            <div className="h-72 overflow-hidden relative">
              <img
                src={place.image_url}
                alt={place.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-[#0d1117]/50 to-transparent"></div>
            </div>
          )}

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2.5 bg-[#0d1117]/80 hover:bg-[#0d1117] border border-white/20 rounded-lg transition-all group"
          >
            <X className="w-5 h-5 text-white/70 group-hover:text-white" />
          </button>
        </div>

        <div className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 tracking-tight">
                {place.name}
              </h2>
              <div className="flex flex-wrap gap-2">
                {place.category && (
                  <span className="px-3 py-1 bg-[#c45c35]/20 text-[#e07850] text-xs font-semibold rounded-full uppercase tracking-wider border border-[#c45c35]/30">
                    {place.category}
                  </span>
                )}
                {place.subcategory && (
                  <span className="px-3 py-1 bg-white/5 text-white/60 text-xs font-medium rounded-full border border-white/10">
                    {place.subcategory}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleToggleVisited}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-all border ${
                place.visited
                  ? 'bg-[#c45c35]/20 text-[#e07850] border-[#c45c35]/40 hover:bg-[#c45c35]/30'
                  : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{place.visited ? 'Visited' : 'Mark Visited'}</span>
            </button>
          </div>

          {place.overview && (
            <p className="text-white/70 leading-relaxed mb-8 text-[15px]">{place.overview}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {place.address && (
              <button
                onClick={openGoogleMaps}
                className="flex items-start space-x-3 p-4 bg-white/5 rounded-lg border border-white/10 hover:border-[#c45c35]/50 hover:bg-white/[0.07] transition-all group text-left"
              >
                <MapPin className="w-5 h-5 text-[#c45c35] mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white/90 text-sm mb-1">Address</p>
                  <p className="text-white/50 text-sm leading-relaxed">{place.address}</p>
                  <span className="inline-flex items-center text-[#e07850] text-xs mt-2 group-hover:underline">
                    Open in Maps <ArrowUpRight className="w-3 h-3 ml-1" />
                  </span>
                </div>
              </button>
            )}

            {place.distance_miles && (
              <div className="flex items-start space-x-3 p-4 bg-white/5 rounded-lg border border-white/10">
                <Navigation className="w-5 h-5 text-[#c45c35] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-white/90 text-sm mb-1">Distance</p>
                  <p className="text-white/50 text-sm">
                    {place.distance_miles} miles
                    {place.drive_time_minutes && (
                      <span className="text-white/40"> ({formatDriveTime(place.drive_time_minutes)} drive)</span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {place.average_visit_duration && (
              <div className="flex items-start space-x-3 p-4 bg-white/5 rounded-lg border border-white/10">
                <Clock className="w-5 h-5 text-[#c45c35] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-white/90 text-sm mb-1">Visit Duration</p>
                  <p className="text-white/50 text-sm">{place.average_visit_duration}</p>
                </div>
              </div>
            )}

            {place.entry_fee && (
              <div className="flex items-start space-x-3 p-4 bg-white/5 rounded-lg border border-white/10">
                <DollarSign className="w-5 h-5 text-[#c45c35] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-white/90 text-sm mb-1">Entry Fee</p>
                  <p className="text-white/50 text-sm">{place.entry_fee}</p>
                </div>
              </div>
            )}

            {place.best_seasons && (
              <div className="flex items-start space-x-3 p-4 bg-white/5 rounded-lg border border-white/10">
                <Calendar className="w-5 h-5 text-[#c45c35] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-white/90 text-sm mb-1">Best Time to Visit</p>
                  <p className="text-white/50 text-sm">{place.best_seasons}</p>
                </div>
              </div>
            )}

            {place.best_day && (
              <div className="flex items-start space-x-3 p-4 bg-white/5 rounded-lg border border-white/10">
                <Calendar className="w-5 h-5 text-[#c45c35] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-white/90 text-sm mb-1">Best Day</p>
                  <p className="text-white/50 text-sm">{place.best_day}</p>
                </div>
              </div>
            )}

            {place.parking_info && (
              <div className="flex items-start space-x-3 p-4 bg-white/5 rounded-lg border border-white/10">
                <Car className="w-5 h-5 text-[#c45c35] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-white/90 text-sm mb-1">Parking</p>
                  <p className="text-white/50 text-sm">{place.parking_info}</p>
                </div>
              </div>
            )}

            {place.ev_charging && (
              <div className="flex items-start space-x-3 p-4 bg-white/5 rounded-lg border border-white/10">
                <Zap className="w-5 h-5 text-[#c45c35] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-white/90 text-sm mb-1">EV Charging</p>
                  <p className="text-white/50 text-sm">{place.ev_charging}</p>
                </div>
              </div>
            )}
          </div>

          {(place.google_rating || place.tripadvisor_rating) && (
            <div className="flex flex-wrap gap-4 mb-8">
              {place.google_rating && (
                <button
                  onClick={openGoogleRating}
                  className="flex items-center space-x-3 px-5 py-3 bg-white/5 rounded-lg border border-white/10 hover:border-[#c45c35]/50 hover:bg-white/[0.07] transition-all group"
                >
                  <div className="flex items-center space-x-1">
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                    <span className="text-xl font-bold text-white">{place.google_rating.toFixed(1)}</span>
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-white/40 uppercase tracking-wider">Google</p>
                    <span className="text-xs text-[#e07850] group-hover:underline flex items-center">
                      View <ArrowUpRight className="w-3 h-3 ml-0.5" />
                    </span>
                  </div>
                </button>
              )}
              {place.tripadvisor_rating && (
                <button
                  onClick={openTripAdvisor}
                  className="flex items-center space-x-3 px-5 py-3 bg-white/5 rounded-lg border border-white/10 hover:border-[#c45c35]/50 hover:bg-white/[0.07] transition-all group"
                >
                  <div className="flex items-center space-x-1">
                    <Star className="w-5 h-5 text-emerald-400 fill-emerald-400" />
                    <span className="text-xl font-bold text-white">{place.tripadvisor_rating.toFixed(1)}</span>
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-white/40 uppercase tracking-wider">TripAdvisor</p>
                    <span className="text-xs text-[#e07850] group-hover:underline flex items-center">
                      View <ArrowUpRight className="w-3 h-3 ml-0.5" />
                    </span>
                  </div>
                </button>
              )}
              {place.overall_sentiment && (
                <div className="flex-1 min-w-[200px] px-5 py-3 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Overall Sentiment</p>
                  <p className="text-sm text-white/70">{place.overall_sentiment}</p>
                </div>
              )}
            </div>
          )}

          {place.key_highlights && (
            <div className="mb-8">
              <h3 className="font-semibold text-white mb-3 flex items-center text-sm uppercase tracking-wider">
                <Star className="w-4 h-4 text-[#c45c35] mr-2" />
                Key Highlights
              </h3>
              <div className="bg-white/5 rounded-lg border border-white/10 p-4">
                <p className="text-white/60 text-sm leading-relaxed">
                  {place.key_highlights}
                </p>
              </div>
            </div>
          )}

          {place.insider_tips && (
            <div className="mb-8">
              <h3 className="font-semibold text-white mb-3 flex items-center text-sm uppercase tracking-wider">
                <Lightbulb className="w-4 h-4 text-[#c45c35] mr-2" />
                Insider Tips
              </h3>
              <div className="bg-[#c45c35]/10 rounded-lg border border-[#c45c35]/20 p-4">
                <p className="text-white/70 text-sm leading-relaxed">
                  {place.insider_tips}
                </p>
              </div>
            </div>
          )}

          {place.nearby_restaurants && place.nearby_restaurants.length > 0 && (
            <div className="mb-8">
              <h3 className="font-semibold text-white mb-3 flex items-center text-sm uppercase tracking-wider">
                <Utensils className="w-4 h-4 text-[#c45c35] mr-2" />
                Nearby Restaurants
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {place.nearby_restaurants.map((restaurant, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      const query = encodeURIComponent(`${restaurant.name} ${place.address || ''}`);
                      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                    }}
                    className="bg-white/5 rounded-lg border border-white/10 p-3 text-left hover:border-[#c45c35]/50 hover:bg-white/[0.07] transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-white/90 text-sm">{restaurant.name}</p>
                        <p className="text-xs text-white/50 mt-1">{restaurant.description}</p>
                        {restaurant.distance && (
                          <p className="text-xs text-white/40 mt-1">{restaurant.distance}</p>
                        )}
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-white/30 group-hover:text-[#e07850] transition-colors flex-shrink-0 mt-0.5" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {place.upcoming_events && (
            <div className="mb-6">
              <h3 className="font-semibold text-white mb-3 flex items-center text-sm uppercase tracking-wider">
                <Calendar className="w-4 h-4 text-[#c45c35] mr-2" />
                Upcoming Events
              </h3>
              <div className="bg-white/5 rounded-lg border border-white/10 p-4">
                <p className="text-white/60 text-sm leading-relaxed">
                  {place.upcoming_events}
                </p>
              </div>
            </div>
          )}

          {place.research_sources && (
            <div className="pt-6 border-t border-white/10">
              <p className="text-xs text-white/30 uppercase tracking-wider">Sources: {place.research_sources}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
