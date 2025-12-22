import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Place } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MapPin, Calendar, Clock, DollarSign, ExternalLink, ThumbsUp, Car, Info } from "lucide-react";

interface PlaceDetailProps {
  place: Place | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlaceDetail({ place, open, onOpenChange }: PlaceDetailProps) {
  if (!place) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[85vh] p-0 overflow-hidden bg-card border-white/10">
        <div className="relative h-64 w-full shrink-0">
          <img 
            src={place.imageUrl || "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&auto=format&fit=crop&q=60"} 
            alt={place.name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
          
          <div className="absolute bottom-4 left-6 right-6">
            <div className="flex gap-2 mb-2">
              <Badge className="bg-primary/90 hover:bg-primary">{place.category}</Badge>
              {place.subcategory && <Badge variant="outline" className="text-white border-white/20 bg-black/40 backdrop-blur-md">{place.subcategory}</Badge>}
            </div>
            <h2 className="text-3xl font-display font-bold text-white shadow-sm">{place.name}</h2>
            {place.address && (
              <div className="flex items-center gap-2 text-white/80 mt-1 text-sm">
                <MapPin className="w-4 h-4" />
                {place.address}
              </div>
            )}
          </div>
        </div>

        <ScrollArea className="h-full">
          <div className="p-6 space-y-8">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatBox icon={Clock} label="Drive Time" value={`${place.driveTimeMinutes || '--'} min`} />
              <StatBox icon={Car} label="Distance" value={`${place.distanceMiles || '--'} mi`} />
              <StatBox icon={DollarSign} label="Avg Spend" value={`$${place.averageSpend || '--'}`} />
              <StatBox icon={ThumbsUp} label="Rating" value={place.googleRating?.toString() || '--'} />
            </div>

            {/* Overview */}
            <section>
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" /> Overview
              </h3>
              <p className="text-muted-foreground leading-relaxed">{place.overview || "No overview available."}</p>
            </section>

            <Separator className="bg-white/10" />

            {/* Highlights & Tips */}
            <div className="grid md:grid-cols-2 gap-8">
              <section>
                <h3 className="text-lg font-bold text-white mb-3">Highlights</h3>
                <div className="bg-secondary/50 p-4 rounded-xl border border-white/5">
                  <p className="text-sm text-muted-foreground">{place.keyHighlights || "No highlights listed."}</p>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-bold text-white mb-3">Insider Tips</h3>
                <div className="bg-primary/10 p-4 rounded-xl border border-primary/20">
                  <p className="text-sm text-primary-foreground/90">{place.insiderTips || "No tips available."}</p>
                </div>
              </section>
            </div>

            {/* Details Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              <DetailRow label="Best Seasons" value={place.bestSeasons} />
              <DetailRow label="Best Day to Visit" value={place.bestDay} />
              <DetailRow label="Entry Fee" value={place.entryFee} />
              <DetailRow label="Parking" value={place.parkingInfo} />
            </div>

            {/* Action Bar */}
            <div className="pt-4 flex justify-end gap-3">
              {place.googleMapsUrl && (
                <Button variant="outline" className="gap-2" onClick={() => window.open(place.googleMapsUrl!, '_blank')}>
                  <MapPin className="w-4 h-4" />
                  Open in Maps
                </Button>
              )}
              {/* Future feature: Add to Plan */}
              <Button className="gap-2">
                <Calendar className="w-4 h-4" />
                Add to Plan
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function StatBox({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="bg-white/5 border border-white/5 p-3 rounded-xl flex flex-col items-center justify-center text-center">
      <Icon className="w-5 h-5 text-primary mb-1" />
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className="font-bold text-white">{value}</span>
    </div>
  );
}

function DetailRow({ label, value }: { label: string, value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide block mb-1">{label}</span>
      <p className="text-sm text-white">{value}</p>
    </div>
  );
}
