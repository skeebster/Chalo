import { useState, useMemo } from "react";
import { Place } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Backpack, Check, Copy, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PackingChecklistProps {
  places: Place[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ChecklistItem {
  id: string;
  name: string;
  category: string;
  checked: boolean;
}

const PACKING_ITEMS: Record<string, string[]> = {
  nature: [
    "Comfortable hiking shoes/boots",
    "Sunscreen (SPF 30+)",
    "Insect repellent",
    "Reusable water bottles",
    "Trail snacks (granola bars, nuts)",
    "First aid kit",
    "Hat or sun visor",
    "Sunglasses",
    "Light rain jacket",
    "Camera",
  ],
  family: [
    "Snacks for kids",
    "Water bottles",
    "Hand sanitizer",
    "Wet wipes",
    "Change of clothes for kids",
    "Comfort items (toys, blankets)",
    "Phone charger/power bank",
    "Cash for games/activities",
  ],
  animals: [
    "Comfortable walking shoes",
    "Sunscreen",
    "Hat",
    "Camera with zoom lens",
    "Snacks",
    "Water bottles",
    "Stroller for young kids",
    "Hand sanitizer",
  ],
  adventurous: [
    "Athletic wear",
    "Comfortable closed-toe shoes",
    "Water bottle",
    "Towel",
    "Change of clothes",
    "Hair ties",
    "Grip socks (if required)",
    "Energy snacks",
  ],
  exercise: [
    "Athletic shoes",
    "Comfortable workout clothes",
    "Water bottle",
    "Towel",
    "Hair ties",
    "Deodorant",
    "Grip socks",
    "Snacks for after",
  ],
  historical: [
    "Comfortable walking shoes",
    "Notebook/journal",
    "Camera",
    "Light jacket (museums can be cold)",
    "Water bottle",
    "Snacks",
    "Phone charger",
  ],
  educational: [
    "Comfortable shoes",
    "Notebook for kids",
    "Camera",
    "Light jacket",
    "Snacks",
    "Water bottles",
    "Hand sanitizer",
  ],
  seasonal: [
    "Weather-appropriate clothing",
    "Comfortable shoes",
    "Camera",
    "Sunscreen (if outdoors)",
    "Snacks",
    "Water bottles",
    "Cash for vendors",
  ],
  general: [
    "Phone and charger",
    "Wallet/ID",
    "Snacks",
    "Water bottles",
    "First aid basics",
    "Sunglasses",
    "Comfortable shoes",
  ],
};

const OUTDOOR_EXTRAS = [
  "Blanket for picnics",
  "Portable phone charger",
  "Trash bags",
];

const LONG_DRIVE_EXTRAS = [
  "Car snacks",
  "Entertainment for kids (books, games)",
  "Pillows for napping",
  "Cooler with drinks",
];

export function PackingChecklist({ places, open, onOpenChange }: PackingChecklistProps) {
  const { toast } = useToast();
  
  const generatedItems = useMemo(() => {
    const itemSet = new Set<string>();
    const categories = new Set<string>();
    
    places.forEach(place => {
      const category = place.category || "general";
      categories.add(category);
      
      const categoryItems = PACKING_ITEMS[category] || PACKING_ITEMS.general;
      categoryItems.forEach(item => itemSet.add(item));
      
      if (place.indoorOutdoor === "outdoor" || place.indoorOutdoor === "both") {
        OUTDOOR_EXTRAS.forEach(item => itemSet.add(item));
      }
      
      if (place.driveTimeMinutes && place.driveTimeMinutes > 45) {
        LONG_DRIVE_EXTRAS.forEach(item => itemSet.add(item));
      }
    });
    
    PACKING_ITEMS.general.forEach(item => itemSet.add(item));
    
    return Array.from(itemSet).map((name, idx) => ({
      id: `item-${idx}`,
      name,
      category: "essentials",
      checked: false,
    }));
  }, [places]);

  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const toggleItem = (itemId: string) => {
    setCheckedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const copyToClipboard = () => {
    const uncheckedItems = generatedItems
      .filter(item => !checkedItems.has(item.id))
      .map(item => `- ${item.name}`)
      .join("\n");
    
    navigator.clipboard.writeText(uncheckedItems);
    toast({
      title: "Copied to clipboard",
      description: "Packing list copied successfully",
    });
  };

  const checkedCount = checkedItems.size;
  const totalCount = generatedItems.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-white/10 text-white p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-white/10 bg-secondary/30">
          <DialogTitle className="font-display text-lg uppercase tracking-wider flex items-center gap-2">
            <Backpack className="w-5 h-5 text-primary" />
            Packing Checklist
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Based on your {places.length} planned destination{places.length > 1 ? "s" : ""}
          </p>
        </DialogHeader>

        <div className="px-6 py-3 border-b border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {checkedCount}/{totalCount} packed
            </Badge>
            {checkedCount === totalCount && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <Check className="w-3 h-3 mr-1" /> Ready!
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="gap-1.5"
            data-testid="button-copy-checklist"
          >
            <Copy className="w-4 h-4" />
            Copy
          </Button>
        </div>

        <ScrollArea className="h-[400px]">
          <div className="p-6 space-y-2">
            {generatedItems.map((item) => (
              <label
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5 hover-elevate cursor-pointer"
                data-testid={`checklist-item-${item.id}`}
              >
                <Checkbox
                  checked={checkedItems.has(item.id)}
                  onCheckedChange={() => toggleItem(item.id)}
                  className="border-white/30"
                />
                <span className={`text-sm ${checkedItems.has(item.id) ? "line-through text-muted-foreground" : "text-white"}`}>
                  {item.name}
                </span>
              </label>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-white/10 flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
