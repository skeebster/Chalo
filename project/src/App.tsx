import { useState, useEffect } from 'react';
import { supabase, Place } from './lib/supabase';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Categories from './components/Categories';
import FeaturedDestinations from './components/FeaturedDestinations';
import CallToAction from './components/CallToAction';
import Footer from './components/Footer';
import PlaceDetail from './components/PlaceDetail';
import UploadModal from './components/UploadModal';
import { importSampleData } from './utils/importData';

function App() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    loadPlaces();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [places, searchQuery, selectedCategory]);

  const loadPlaces = async () => {
    try {
      const { data, error } = await supabase
        .from('places')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlaces(data || []);
    } catch (error) {
      console.error('Error loading places:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...places];

    if (selectedCategory !== 'all') {
      const categoryMap: Record<string, string> = {
        indoor: 'Indoor Attraction',
        outdoor: 'Outdoor Attraction',
        museum: 'Museum',
        theme: 'Theme Park',
      };
      const category = categoryMap[selectedCategory];
      if (category) {
        filtered = filtered.filter(p => p.category === category);
      }
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.overview?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query) ||
        p.subcategory?.toLowerCase().includes(query)
      );
    }

    setFilteredPlaces(filtered);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    const element = document.getElementById('destinations');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-rust-500/20 border-t-rust-500 mx-auto mb-4"></div>
          <p className="text-white/40 text-sm tracking-wide">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar onUploadClick={() => setShowUploadModal(true)} />

      <Hero onSearch={handleSearch} onUploadClick={() => setShowUploadModal(true)} />

      <Categories onCategorySelect={handleCategorySelect} />

      {filteredPlaces.length > 0 ? (
        <FeaturedDestinations
          places={filteredPlaces}
          onViewDetails={setSelectedPlace}
        />
      ) : (
        <section className="py-20 bg-dark-800">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <div className="bg-dark-900 border border-white/[0.08] rounded-xl p-12">
              <h3 className="text-2xl font-semibold text-white mb-3 tracking-tight">
                No destinations found
              </h3>
              <p className="text-white/50 mb-8 max-w-md mx-auto">
                {places.length === 0
                  ? "Get started by importing sample destinations to explore amazing places."
                  : "Try adjusting your search or filters to find more destinations."}
              </p>
              {places.length === 0 && (
                <button
                  onClick={async () => {
                    const result = await importSampleData();
                    if (result.success) {
                      await loadPlaces();
                    }
                  }}
                  className="px-6 py-3 bg-rust-500 hover:bg-rust-600 text-white font-medium rounded-lg transition-all text-sm tracking-wide"
                >
                  Import Sample Data
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      <CallToAction />

      <Footer />

      {selectedPlace && (
        <PlaceDetail
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
          onUpdate={loadPlaces}
        />
      )}

      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            loadPlaces();
          }}
        />
      )}
    </div>
  );
}

export default App;
