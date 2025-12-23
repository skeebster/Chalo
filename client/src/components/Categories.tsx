import { cn } from "@/lib/utils";
import { TreePine, Tent, Building2, RollerCoaster, Coffee, Waves, Calendar, Navigation } from "lucide-react";

interface CategoriesProps {
  selectedCategory: string;
  onSelect: (category: string) => void;
}

export function Categories({ selectedCategory, onSelect }: CategoriesProps) {
  const categories = [
    { id: "all", label: "All Places", icon: CompassIcon },
    { id: "indoor", label: "Indoor", icon: Building2 },
    { id: "outdoor", label: "Outdoor", icon: TreePine },
    { id: "museum", label: "Museums", icon: Building2 },
    { id: "theme", label: "Theme Parks", icon: RollerCoaster },
    { id: "dining", label: "Dining", icon: Coffee },
    { id: "beach", label: "Beach", icon: Waves },
    { id: "weekend", label: "Weekend Trip", icon: Calendar },
    { id: "roadtrip", label: "Road Trip", icon: Navigation },
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

function CompassIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}
