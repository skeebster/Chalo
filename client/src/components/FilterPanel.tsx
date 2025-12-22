import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Filter, X, Baby, Accessibility, Home, TreePine, Star, MapPin, Heart } from "lucide-react";
import { PlaceFilters } from "@/hooks/use-places";

interface FilterPanelProps {
  filters: PlaceFilters;
  onFiltersChange: (filters: PlaceFilters) => void;
}

export function FilterPanel({ filters, onFiltersChange }: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeFilterCount = [
    filters.kidFriendly,
    filters.wheelchairAccessible,
    filters.indoorOutdoor && filters.indoorOutdoor !== 'all',
    filters.maxDistance && filters.maxDistance < 100,
    filters.minRating && filters.minRating > 0,
    filters.favoritesOnly,
  ].filter(Boolean).length;

  const clearFilters = () => {
    onFiltersChange({
      ...filters,
      kidFriendly: undefined,
      wheelchairAccessible: undefined,
      indoorOutdoor: 'all',
      maxDistance: undefined,
      minRating: undefined,
      favoritesOnly: undefined,
    });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <div className="flex items-center gap-2">
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="gap-2" data-testid="button-toggle-filters">
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">{activeFilterCount}</Badge>
            )}
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </CollapsibleTrigger>
        
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground" data-testid="button-clear-filters">
            <X className="w-4 h-4" />
            Clear all
          </Button>
        )}
      </div>

      <CollapsibleContent className="mt-4">
        <div className="bg-card border border-white/10 rounded-xl p-4 space-y-6">
          {/* Quick Toggles */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-white">Quick Filters</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filters.kidFriendly ? "default" : "outline"}
                size="sm"
                className="gap-2"
                onClick={() => onFiltersChange({ ...filters, kidFriendly: !filters.kidFriendly })}
                data-testid="button-filter-kid-friendly"
              >
                <Baby className="w-4 h-4" />
                Kid Friendly
              </Button>
              
              <Button
                variant={filters.wheelchairAccessible ? "default" : "outline"}
                size="sm"
                className="gap-2"
                onClick={() => onFiltersChange({ ...filters, wheelchairAccessible: !filters.wheelchairAccessible })}
                data-testid="button-filter-wheelchair"
              >
                <Accessibility className="w-4 h-4" />
                Wheelchair Accessible
              </Button>

              <Button
                variant={filters.favoritesOnly ? "default" : "outline"}
                size="sm"
                className="gap-2"
                onClick={() => onFiltersChange({ ...filters, favoritesOnly: !filters.favoritesOnly })}
                data-testid="button-filter-favorites"
              >
                <Heart className="w-4 h-4" />
                Favorites Only
              </Button>
            </div>
          </div>

          {/* Indoor/Outdoor */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-white">Setting</Label>
            <div className="flex gap-2">
              <Button
                variant={!filters.indoorOutdoor || filters.indoorOutdoor === 'all' ? "default" : "outline"}
                size="sm"
                onClick={() => onFiltersChange({ ...filters, indoorOutdoor: 'all' })}
                data-testid="button-filter-setting-all"
              >
                All
              </Button>
              <Button
                variant={filters.indoorOutdoor === 'indoor' ? "default" : "outline"}
                size="sm"
                className="gap-2"
                onClick={() => onFiltersChange({ ...filters, indoorOutdoor: 'indoor' })}
                data-testid="button-filter-setting-indoor"
              >
                <Home className="w-4 h-4" />
                Indoor
              </Button>
              <Button
                variant={filters.indoorOutdoor === 'outdoor' ? "default" : "outline"}
                size="sm"
                className="gap-2"
                onClick={() => onFiltersChange({ ...filters, indoorOutdoor: 'outdoor' })}
                data-testid="button-filter-setting-outdoor"
              >
                <TreePine className="w-4 h-4" />
                Outdoor
              </Button>
            </div>
          </div>

          {/* Distance Range */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Max Distance
              </Label>
              <span className="text-sm text-muted-foreground">
                {filters.maxDistance ? `${filters.maxDistance} miles` : 'Any distance'}
              </span>
            </div>
            <Slider
              value={[filters.maxDistance || 100]}
              onValueChange={([value]) => onFiltersChange({ ...filters, maxDistance: value < 100 ? value : undefined })}
              max={100}
              min={5}
              step={5}
              className="w-full"
              data-testid="slider-max-distance"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>5 mi</span>
              <span>50 mi</span>
              <span>100+ mi</span>
            </div>
          </div>

          {/* Min Rating */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-white flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400" />
                Min Rating
              </Label>
              <span className="text-sm text-muted-foreground">
                {filters.minRating ? `${filters.minRating}+ stars` : 'Any rating'}
              </span>
            </div>
            <Slider
              value={[filters.minRating || 0]}
              onValueChange={([value]) => onFiltersChange({ ...filters, minRating: value > 0 ? value : undefined })}
              max={5}
              min={0}
              step={0.5}
              className="w-full"
              data-testid="slider-min-rating"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Any</span>
              <span>3.0</span>
              <span>4.0</span>
              <span>5.0</span>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
