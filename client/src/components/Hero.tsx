import { Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface HeroProps {
  onSearch: (query: string) => void;
  onUploadClick: () => void;
}

export function Hero({ onSearch, onUploadClick }: HeroProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-black border border-white/10 shadow-2xl">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl opacity-30" />

      <div className="relative z-10 px-6 py-16 md:py-24 text-center max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-display font-extrabold text-white mb-6 leading-tight animate-fade-in-up">
          Discover Your Next <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-300">
            Weekend Adventure
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in-up delay-100">
          Find hidden gems, plan the perfect getaway, or extract travel ideas directly from your screenshots and documents.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-200">
          <form onSubmit={handleSubmit} className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input 
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search destinations, activities..."
              className="w-full h-12 pl-12 pr-4 rounded-xl bg-white/5 border border-white/10 focus:border-primary/50 focus:bg-white/10 focus:ring-2 focus:ring-primary/20 text-white placeholder:text-muted-foreground transition-all outline-none"
            />
          </form>
          
          <Button 
            size="lg" 
            variant="glass" 
            onClick={onUploadClick}
            className="w-full sm:w-auto gap-2"
          >
            <Upload className="w-4 h-4" />
            Analyze Document
          </Button>
        </div>
      </div>
    </div>
  );
}
