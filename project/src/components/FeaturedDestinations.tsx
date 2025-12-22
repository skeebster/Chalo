import { MapPin, Clock, DollarSign, Star, ArrowRight } from 'lucide-react';
import { Place } from '../lib/supabase';

interface FeaturedDestinationsProps {
  places: Place[];
  onViewDetails: (place: Place) => void;
}

const categoryImages: Record<string, string> = {
  'Indoor Attraction': 'https://images.pexels.com/photos/1153976/pexels-photo-1153976.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Outdoor Attraction': 'https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Museum': 'https://images.pexels.com/photos/2528116/pexels-photo-2528116.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Theme Park': 'https://images.pexels.com/photos/163696/dubai-mall-dubai-roller-coaster-carousel-163696.jpeg?auto=compress&cs=tinysrgb&w=800',
};

export default function FeaturedDestinations({ places, onViewDetails }: FeaturedDestinationsProps) {
  const featuredPlaces = places.slice(0, 6);

  return (
    <section id="destinations" className="py-20 bg-dark-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-rust-400 text-xs uppercase tracking-widest mb-4 font-medium">Your Weekend Awaits</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
            Featured Destinations
          </h2>
          <p className="text-base text-white/50 max-w-2xl mx-auto">
            Discover amazing places for your next adventure
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredPlaces.map((place) => (
            <div
              key={place.id}
              className="group bg-dark-900 rounded-xl overflow-hidden border border-white/[0.06] hover:border-rust-500/40 transition-all duration-300 cursor-pointer"
              onClick={() => onViewDetails(place)}
            >
              <div className="relative h-52 overflow-hidden">
                <img
                  src={place.image_url || categoryImages[place.category || ''] || categoryImages['Outdoor Attraction']}
                  alt={place.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/40 to-transparent"></div>
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 bg-rust-500/15 backdrop-blur-md rounded-md text-[11px] font-medium text-rust-400 border border-rust-500/25 uppercase tracking-wider">
                    {place.category}
                  </span>
                </div>
                {place.visited && (
                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 bg-rust-500 rounded-md text-[11px] font-medium text-white uppercase tracking-wider">
                      Visited
                    </span>
                  </div>
                )}
              </div>

              <div className="p-5">
                <h3 className="text-base font-semibold text-white mb-2 group-hover:text-rust-400 transition-colors line-clamp-1 tracking-tight">
                  {place.name}
                </h3>
                <p className="text-white/50 text-sm mb-4 line-clamp-2 leading-relaxed">
                  {place.overview}
                </p>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  {place.distance_miles && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-3.5 h-3.5 text-rust-500/70" />
                      <span className="text-white/40">{place.distance_miles} mi</span>
                    </div>
                  )}
                  {place.drive_time_minutes && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-3.5 h-3.5 text-rust-500/70" />
                      <span className="text-white/40">{place.drive_time_minutes} min</span>
                    </div>
                  )}
                  {place.google_rating && (
                    <div className="flex items-center gap-2 text-sm">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-white/40">{place.google_rating.toFixed(1)}</span>
                    </div>
                  )}
                  {place.average_spend && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-3.5 h-3.5 text-rust-500/70" />
                      <span className="text-white/40">${place.average_spend}</span>
                    </div>
                  )}
                </div>

                <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/[0.03] group-hover:bg-rust-500 text-white/50 group-hover:text-white font-medium rounded-lg transition-all uppercase tracking-wider text-xs border border-white/[0.06] group-hover:border-rust-500">
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {places.length > 6 && (
          <div className="text-center mt-12">
            <button className="px-8 py-3 bg-rust-500 hover:bg-rust-600 text-white font-medium rounded-lg transition-all uppercase tracking-wider text-sm">
              View All {places.length} Destinations
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
