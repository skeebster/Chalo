import { Upload, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface NavbarProps {
  onUploadClick: () => void;
}

export default function Navbar({ onUploadClick }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-900/80 backdrop-blur-md border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 bg-rust-500 rounded-full"></div>
            <h1 className="text-sm font-semibold text-white tracking-widest uppercase">Travel</h1>
          </div>

          <div className="hidden md:flex items-center gap-10">
            <a href="#discover" className="text-white/50 hover:text-white text-xs uppercase tracking-widest transition-colors">
              Discover
            </a>
            <a href="#destinations" className="text-white/50 hover:text-white text-xs uppercase tracking-widest transition-colors">
              Places
            </a>
            <a href="#categories" className="text-white/50 hover:text-white text-xs uppercase tracking-widest transition-colors">
              Categories
            </a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={onUploadClick}
              className="flex items-center gap-2 px-4 py-2 bg-rust-500 hover:bg-rust-600 text-white text-xs font-medium rounded-lg transition-all uppercase tracking-wider"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload
            </button>
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            {isMenuOpen ? (
              <X className="w-5 h-5 text-white" />
            ) : (
              <Menu className="w-5 h-5 text-white" />
            )}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden pt-4 pb-2 border-t border-white/[0.06] mt-4">
            <div className="flex flex-col gap-1">
              <a href="#discover" className="px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-lg text-xs uppercase tracking-widest transition-colors">
                Discover
              </a>
              <a href="#destinations" className="px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-lg text-xs uppercase tracking-widest transition-colors">
                Places
              </a>
              <a href="#categories" className="px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-lg text-xs uppercase tracking-widest transition-colors">
                Categories
              </a>
              <button
                onClick={onUploadClick}
                className="mt-3 px-4 py-3 bg-rust-500 text-white text-xs font-medium rounded-lg hover:bg-rust-600 transition-all flex items-center gap-2 justify-center uppercase tracking-wider"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
