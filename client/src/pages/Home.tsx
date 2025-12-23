import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Categories } from "@/components/Categories";
import { PlaceCard } from "@/components/PlaceCard";
import { PlaceDetail } from "@/components/PlaceDetail";
import { AddPlaceModal } from "@/components/AddPlaceModal";
import { FilterPanel } from "@/components/FilterPanel";
import { usePlaces, useImportSampleData, PlaceFilters } from "@/hooks/use-places";
import { Place } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Loader2, Database } from "lucide-react";

export default function Home() {
  const [filters, setFilters] = useState<PlaceFilters>({
    category: "all",
    search: "",
  });
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const { data: places, isLoading, refetch } = usePlaces(filters);

  const handleSearch = (query: string) => {
    setFilters(prev => ({ ...prev, search: query }));
  };

  const handleCategorySelect = (category: string) => {
    setFilters(prev => ({ ...prev, category }));
  };
  
  const importMutation = useImportSampleData();

  const handleImport = async () => {
    await importMutation.mutateAsync();
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar onUploadClick={() => setIsUploadOpen(true)} />
      
      <main className="container mx-auto px-4 pt-6 space-y-8">
        <Hero 
          onSearch={handleSearch} 
          onUploadClick={() => setIsUploadOpen(true)} 
        />

        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-2xl font-display font-bold text-white">
              Explore Destinations
            </h2>
            <Categories 
              selectedCategory={filters.category || "all"} 
              onSelect={handleCategorySelect} 
            />
          </div>

          {/* Advanced Filters */}
          <FilterPanel filters={filters} onFiltersChange={setFilters} />

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
          ) : places && places.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {places.map((place) => (
                <PlaceCard 
                  key={place.id} 
                  place={place} 
                  onClick={() => setSelectedPlace(place)} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-card rounded-3xl border border-white/5">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Database className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No places found</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {filters.search || filters.category !== 'all' || filters.kidFriendly || filters.favoritesOnly
                  ? "Try adjusting your filters or search query." 
                  : "Get started by importing sample destinations or upload your own."}
              </p>
              
              {!filters.search && filters.category === 'all' && !filters.kidFriendly && !filters.favoritesOnly && (
                <Button onClick={handleImport} disabled={importMutation.isPending}>
                  {importMutation.isPending ? "Importing..." : "Import Sample Data"}
                </Button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Details Modal */}
      <PlaceDetail 
        place={selectedPlace} 
        open={!!selectedPlace} 
        onOpenChange={(open) => !open && setSelectedPlace(null)} 
      />

      {/* Add Place Modal */}
      <AddPlaceModal 
        open={isUploadOpen} 
        onOpenChange={setIsUploadOpen}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
