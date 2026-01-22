import React from 'react';
import { Film, ArrowLeft, Sparkles } from 'lucide-react';

const RecommendationsPage = ({ onNavigate }) => (
  <div className="min-h-screen bg-[#050508] relative overflow-hidden">
    {/* Background glow */}
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-20"
      style={{
        background: 'radial-gradient(circle, rgba(255,200,50,0.3) 0%, transparent 70%)',
        filter: 'blur(60px)',
      }}
    />

    {/* Back button */}
    <button
      onClick={() => onNavigate && onNavigate('catalog')}
      className="fixed left-6 top-6 z-30 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2"
    >
      <ArrowLeft className="w-5 h-5 text-white/70" />
      <span className="text-white/70 text-sm">Back</span>
    </button>

    <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
      <div className="space-y-8">
        {/* Icon */}
        <div className="inline-block p-6 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20">
          <Sparkles size={48} className="text-amber-400" />
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl font-light text-white tracking-wide">
          Coming Soon
        </h1>

        {/* Description */}
        <p className="text-lg sm:text-xl text-white/50 font-light max-w-md mx-auto leading-relaxed">
          Our AI-powered recommendation engine is being carefully calibrated to find the perfect movies for you.
        </p>

        {/* Features preview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mt-12">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <Film className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
            <p className="text-white/60 text-sm">Personalized picks based on your taste</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <Sparkles className="w-6 h-6 text-amber-400 mx-auto mb-2" />
            <p className="text-white/60 text-sm">Discover hidden gems you'll love</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <Film className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <p className="text-white/60 text-sm">Curated collections for every mood</p>
          </div>
        </div>

        {/* Back to browse */}
        <button
          onClick={() => onNavigate && onNavigate('catalog')}
          className="mt-8 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors text-sm tracking-wider"
        >
          Browse Movies Instead
        </button>
      </div>
    </div>
  </div>
);

export default RecommendationsPage;
