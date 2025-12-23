import { cn } from "@/lib/utils";
import { Compass, Zap, Moon, Leaf, Flame, Heart, Utensils, Wind, Palette, PawPrint } from "lucide-react";

interface CategoriesProps {
  selectedCategory: string;
  onSelect: (category: string) => void;
}

export function Categories({ selectedCategory, onSelect }: CategoriesProps) {
  const categories = [
    { id: "all", label: "All Moods", icon: Compass },
    { id: "adventurous", label: "Adventurous", icon: Flame },
    { id: "exercise", label: "Exercise", icon: Zap },
    { id: "lazy", label: "Lazy", icon: Moon },
    { id: "chill", label: "Chill", icon: Wind },
    { id: "nature", label: "Nature", icon: Leaf },
    { id: "family", label: "Family", icon: Heart },
    { id: "hungry", label: "Hungry", icon: Utensils },
    { id: "artistic", label: "Artistic", icon: Palette },
    { id: "animals", label: "Animals", icon: PawPrint },
    { id: "beach", label: "Beach", icon: Compass },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-4 pt-2 scrollbar-none mask-fade-right">
      {categories.map((cat) => {
        const isActive = selectedCategory === cat.id;
        const Icon = cat.icon;
        
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap border",
              isActive
                ? "bg-primary border-primary text-white shadow-lg shadow-primary/25 scale-105"
                : "bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-white"
            )}
          >
            <Icon className="w-4 h-4" />
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}
