import { useState, useEffect } from 'react';
import { Search, X, Sliders } from 'lucide-react';
import { Place } from '../lib/supabase';

type Props = {
  places: Place[];
  onFilterChange: (filters: {
    category?: string;
    maxDistance?: number;
    onlyUnvisited?: boolean;
    searchQuery?: string;
  }) => void;
  onClose: () => void;
};

export default function FilterPanel({ places, onFilterChange, onClose }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [maxDistance, setMaxDistance] = useState<number>(100);
  const [onlyUnvisited, setOnlyUnvisited] = useState(false);

  const categories = Array.from(new Set(places.map(p => p.category).filter(Boolean))) as string[];

  useEffect(() => {
    onFilterChange({
      searchQuery: searchQuery || undefined,
      category: selectedCategory || undefined,
      maxDistance: maxDistance < 100 ? maxDistance : undefined,
      onlyUnvisited
    });
  }, [searchQuery, selectedCategory, maxDistance, onlyUnvisited]);

  const handleReset = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setMaxDistance(100);
    setOnlyUnvisited(false);
  };

  return (
    <div className="bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Filters</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search places..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Max Distance: {maxDistance === 100 ? 'Any' : `${maxDistance} miles`}
            </label>
            <input
              type="range"
              min="10"
              max="100"
              step="10"
              value={maxDistance}
              onChange={(e) => setMaxDistance(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyUnvisited}
                onChange={(e) => setOnlyUnvisited(e.target.checked)}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">Unvisited only</span>
            </label>

            <button
              onClick={handleReset}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
