import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Compass, Map, UploadCloud, Route, Menu, Calendar, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavbarProps {
  onUploadClick: () => void;
}

export function Navbar({ onUploadClick }: NavbarProps) {
  const [location, setLocation] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Explore", icon: Compass, description: "Discover new destinations" },
    { href: "/trip-planner", label: "Trip Planner", icon: Route, description: "Create AI-optimized itineraries" },
    { href: "/planner", label: "My Plans", icon: Map, description: "View saved weekend plans" },
  ];

  const handleNavClick = (href: string) => {
    setLocation(href);
    setIsMenuOpen(false);
  };

  const handleUploadClick = () => {
    onUploadClick();
    setIsMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-white/10 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-primary/20 p-2 rounded-lg group-hover:bg-primary/30 transition-colors">
            <Compass className="w-6 h-6 text-primary" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-white">
            Weekend<span className="text-primary">Planner</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/5">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer",
                    isActive
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "text-muted-foreground hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Button 
            onClick={onUploadClick}
            variant="default"
            size="sm"
            className="hidden sm:flex gap-2"
            data-testid="button-upload"
          >
            <UploadCloud className="w-4 h-4" />
            Upload
          </Button>
          
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="button-menu">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 bg-background border-white/10">
              <SheetHeader className="pb-6">
                <SheetTitle className="flex items-center gap-2 text-white">
                  <Compass className="w-5 h-5 text-primary" />
                  <span className="font-display">
                    Weekend<span className="text-primary">Planner</span>
                  </span>
                </SheetTitle>
              </SheetHeader>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium px-2">
                    Navigation
                  </p>
                  <div className="space-y-1">
                    {navItems.map((item) => {
                      const isActive = location === item.href;
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.href}
                          onClick={() => handleNavClick(item.href)}
                          className={cn(
                            "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all",
                            isActive
                              ? "bg-primary/20 border border-primary/30"
                              : "hover-elevate"
                          )}
                          data-testid={`menu-${item.label.toLowerCase().replace(' ', '-')}`}
                        >
                          <div className={cn(
                            "p-2 rounded-lg",
                            isActive ? "bg-primary text-white" : "bg-white/5 text-muted-foreground"
                          )}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "font-medium",
                              isActive ? "text-primary" : "text-white"
                            )}>
                              {item.label}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {item.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium px-2">
                    Quick Actions
                  </p>
                  <div className="space-y-1">
                    <button
                      onClick={handleUploadClick}
                      className="w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all hover-elevate"
                      data-testid="menu-upload"
                    >
                      <div className="p-2 rounded-lg bg-white/5 text-muted-foreground">
                        <Plus className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white">Add Destination</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Import from screenshots, URLs, or voice
                        </p>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => handleNavClick('/trip-planner')}
                      className="w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all hover-elevate"
                      data-testid="menu-create-trip"
                    >
                      <div className="p-2 rounded-lg bg-white/5 text-muted-foreground">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white">Plan a Trip</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Get an AI-optimized itinerary
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
