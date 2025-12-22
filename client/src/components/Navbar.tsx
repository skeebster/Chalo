import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Compass, Map, Settings, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavbarProps {
  onUploadClick: () => void;
}

export function Navbar({ onUploadClick }: NavbarProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Explore", icon: Compass },
    { href: "/planner", label: "My Plans", icon: Map },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-white/10 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
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

        <div className="flex items-center gap-4">
          <Button 
            onClick={onUploadClick}
            variant="default"
            size="sm"
            className="hidden sm:flex gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            Upload
          </Button>
          
          {/* Mobile Menu Button - simplified for this output */}
          <div className="md:hidden">
             <Button variant="ghost" size="icon">
               <Map className="w-5 h-5" />
             </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
