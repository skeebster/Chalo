import { Search, Camera, Sparkles } from 'lucide-react';

interface HeroProps {
  onSearch: (query: string) => void;
  onUploadClick: () => void;
}

export default function Hero({ onSearch, onUploadClick }: HeroProps) {
  return (
    <div className="relative min-h-screen flex items-center">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(https://images.pexels.com/photos/1659438/pexels-photo-1659438.jpeg?auto=compress&cs=tinysrgb&w=1920)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-dark-900/98 via-dark-900/95 to-dark-800/98"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 w-full min-h-screen flex flex-col justify-center">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-rust-500/15 backdrop-blur-sm border border-rust-500/25 rounded-full px-5 py-2 mb-8">
            <Sparkles className="w-4 h-4 text-rust-400" />
            <span className="text-rust-400 text-xs font-medium uppercase tracking-widest">AI-Powered Discovery</span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-8 leading-none tracking-tight">
            DISCOVER
            <br />
            YOUR NEXT
            <br />
            <span className="text-rust-400">
              ADVENTURE
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/50 mb-12 leading-relaxed max-w-2xl mx-auto">
            Turn screenshots and PDFs into weekend plans. Upload images or documents with multiple places - AI extracts them all.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-16 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <input
                type="text"
                placeholder="Search destinations, activities..."
                onChange={(e) => onSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-lg bg-dark-800/80 backdrop-blur-md border border-white/[0.08] focus:outline-none focus:ring-1 focus:ring-rust-500/50 focus:border-rust-500/50 text-white placeholder-white/30 text-sm"
              />
            </div>
            <button
              onClick={onUploadClick}
              className="px-8 py-4 bg-rust-500 hover:bg-rust-600 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-sm"
            >
              <Camera className="w-4 h-4" />
              Upload
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-dark-800/60 backdrop-blur-md p-6 rounded-lg border border-white/[0.06] hover:border-rust-500/30 transition-all">
              <div className="text-3xl font-bold text-white mb-2">AI</div>
              <p className="text-white/40 text-xs uppercase tracking-widest">Smart Analysis</p>
            </div>
            <div className="bg-dark-800/60 backdrop-blur-md p-6 rounded-lg border border-white/[0.06] hover:border-rust-500/30 transition-all">
              <div className="text-3xl font-bold text-white mb-2">Bulk</div>
              <p className="text-white/40 text-xs uppercase tracking-widest">Multi-Place Extract</p>
            </div>
            <div className="bg-dark-800/60 backdrop-blur-md p-6 rounded-lg border border-white/[0.06] hover:border-rust-500/30 transition-all">
              <div className="text-3xl font-bold text-white mb-2">PDF</div>
              <p className="text-white/40 text-xs uppercase tracking-widest">Document Support</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
