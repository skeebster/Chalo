import { ArrowRight, Check } from 'lucide-react';

export default function CallToAction() {
  return (
    <section className="py-20 bg-dark-900 relative overflow-hidden border-y border-white/[0.06]">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-rust-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-rust-500 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">
            Ready for Your Next Adventure?
          </h2>
          <p className="text-base text-white/50 mb-8 leading-relaxed">
            Start discovering amazing weekend destinations. Upload images or PDFs with multiple places - AI extracts them all!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10">
            <button className="group px-8 py-3 bg-rust-500 hover:bg-rust-600 text-white font-medium rounded-lg transition-all flex items-center gap-2 uppercase tracking-wider text-sm">
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button className="px-8 py-3 bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] text-white/70 font-medium rounded-lg hover:bg-white/[0.06] hover:border-rust-500/40 hover:text-white transition-all uppercase tracking-wider text-sm">
              Learn More
            </button>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 text-white/60">
              <div className="w-8 h-8 bg-rust-500/15 backdrop-blur-sm rounded-lg flex items-center justify-center border border-rust-500/25">
                <Check className="w-4 h-4 text-rust-400" />
              </div>
              <span className="font-medium uppercase tracking-wider text-xs">AI Powered</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-white/60">
              <div className="w-8 h-8 bg-rust-500/15 backdrop-blur-sm rounded-lg flex items-center justify-center border border-rust-500/25">
                <Check className="w-4 h-4 text-rust-400" />
              </div>
              <span className="font-medium uppercase tracking-wider text-xs">Bulk Extract</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-white/60">
              <div className="w-8 h-8 bg-rust-500/15 backdrop-blur-sm rounded-lg flex items-center justify-center border border-rust-500/25">
                <Check className="w-4 h-4 text-rust-400" />
              </div>
              <span className="font-medium uppercase tracking-wider text-xs">PDF Support</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
