import { Mail, MapPin } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark-900 text-white border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-1.5 h-1.5 bg-rust-500 rounded-full"></div>
              <h3 className="text-sm font-semibold tracking-widest uppercase">Travel</h3>
            </div>
            <p className="text-white/40 mb-6 leading-relaxed max-w-md text-sm">
              Discover amazing destinations and create unforgettable memories. Your journey begins here with us.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="w-10 h-10 bg-dark-800 hover:bg-rust-500 rounded-lg flex items-center justify-center transition-colors border border-white/[0.06]"
              >
                <Mail className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-dark-800 hover:bg-rust-500 rounded-lg flex items-center justify-center transition-colors border border-white/[0.06]"
              >
                <MapPin className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4 uppercase tracking-wider">Explore</h4>
            <ul className="space-y-3">
              <li>
                <a href="#home" className="text-white/40 hover:text-rust-400 transition-colors text-sm">
                  Home
                </a>
              </li>
              <li>
                <a href="#tours" className="text-white/40 hover:text-rust-400 transition-colors text-sm">
                  Tours
                </a>
              </li>
              <li>
                <a href="#gallery" className="text-white/40 hover:text-rust-400 transition-colors text-sm">
                  Gallery
                </a>
              </li>
              <li>
                <a href="#reviews" className="text-white/40 hover:text-rust-400 transition-colors text-sm">
                  Reviews
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4 uppercase tracking-wider">Company</h4>
            <ul className="space-y-3">
              <li>
                <a href="#about" className="text-white/40 hover:text-rust-400 transition-colors text-sm">
                  About Us
                </a>
              </li>
              <li>
                <a href="#contact" className="text-white/40 hover:text-rust-400 transition-colors text-sm">
                  Contact
                </a>
              </li>
              <li>
                <a href="#privacy" className="text-white/40 hover:text-rust-400 transition-colors text-sm">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#terms" className="text-white/40 hover:text-rust-400 transition-colors text-sm">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/[0.06] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/30 text-xs">
            {currentYear} Travel. All rights reserved.
          </p>
          <p className="text-white/30 text-xs">
            Designed with passion for travelers
          </p>
        </div>
      </div>
    </footer>
  );
}
