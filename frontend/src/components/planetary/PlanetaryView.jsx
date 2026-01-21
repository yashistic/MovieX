import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Grid, X } from 'lucide-react';
import GenrePlanet from './GenrePlanet';
import ZoomedOrbit from './ZoomedOrbit';
import movieService from '../../services/movieService';

// Genre color palette based on emotional tone
const genreColors = {
  'Action': { primary: '#dc2626', glow: '#ef4444', tone: 'intense' },
  'Adventure': { primary: '#f59e0b', glow: '#fbbf24', tone: 'warm' },
  'Animation': { primary: '#8b5cf6', glow: '#a78bfa', tone: 'playful' },
  'Comedy': { primary: '#fcd34d', glow: '#fde68a', tone: 'bright' },
  'Crime': { primary: '#1f2937', glow: '#4b5563', tone: 'dark' },
  'Documentary': { primary: '#6b7280', glow: '#9ca3af', tone: 'neutral' },
  'Drama': { primary: '#7c3aed', glow: '#8b5cf6', tone: 'deep' },
  'Family': { primary: '#10b981', glow: '#34d399', tone: 'gentle' },
  'Fantasy': { primary: '#6366f1', glow: '#818cf8', tone: 'mystical' },
  'History': { primary: '#92400e', glow: '#b45309', tone: 'earthy' },
  'Horror': { primary: '#991b1b', glow: '#b91c1c', tone: 'ominous' },
  'Music': { primary: '#ec4899', glow: '#f472b6', tone: 'vibrant' },
  'Mystery': { primary: '#1e3a5f', glow: '#2563eb', tone: 'enigmatic' },
  'Romance': { primary: '#e11d48', glow: '#fb7185', tone: 'passionate' },
  'Science Fiction': { primary: '#06b6d4', glow: '#22d3ee', tone: 'futuristic' },
  'Thriller': { primary: '#374151', glow: '#6b7280', tone: 'tense' },
  'War': { primary: '#78350f', glow: '#a16207', tone: 'somber' },
  'Western': { primary: '#b45309', glow: '#d97706', tone: 'rugged' },
  'TV Movie': { primary: '#64748b', glow: '#94a3b8', tone: 'casual' },
};

const defaultColor = { primary: '#6366f1', glow: '#818cf8', tone: 'default' };

export default function PlanetaryView({ onSelectGenre, theme }) {
  const [genres, setGenres] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [movies, setMovies] = useState({});
  const [loading, setLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomedMovies, setZoomedMovies] = useState([]);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await movieService.getGenres();
        setGenres(response.data || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching genres:', err);
        setLoading(false);
      }
    };
    fetchGenres();
  }, []);

  useEffect(() => {
    const fetchMoviesForGenre = async () => {
      if (!genres[currentIndex]) return;

      const genreName = genres[currentIndex].name;
      if (movies[genreName]) return;

      try {
        const response = await movieService.getMoviesByGenre(genreName, { limit: 15 });
        setMovies(prev => ({
          ...prev,
          [genreName]: response.data || []
        }));
      } catch (err) {
        console.error('Error fetching movies:', err);
      }
    };
    fetchMoviesForGenre();
  }, [currentIndex, genres, movies]);

  // Handle zoom into planet
  const handleZoom = useCallback(async () => {
    if (!genres[currentIndex]) return;

    const genreName = genres[currentIndex].name;
    setIsZoomed(true);

    // Fetch more movies for zoomed view
    try {
      const response = await movieService.getMoviesByGenre(genreName, { limit: 24 });
      setZoomedMovies(response.data || []);
    } catch (err) {
      console.error('Error fetching zoomed movies:', err);
      setZoomedMovies(movies[genreName] || []);
    }
  }, [currentIndex, genres, movies]);

  // Handle zoom out
  const handleZoomOut = useCallback(() => {
    setIsZoomed(false);
    setZoomedMovies([]);
  }, []);

  // Handle go to grid view
  const handleGoToGrid = useCallback(() => {
    if (genres[currentIndex] && onSelectGenre) {
      onSelectGenre(genres[currentIndex]);
    }
  }, [currentIndex, genres, onSelectGenre]);

  const navigatePrev = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(prev => (prev - 1 + genres.length) % genres.length);
    setTimeout(() => setIsTransitioning(false), 800);
  }, [genres.length, isTransitioning]);

  const navigateNext = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(prev => (prev + 1) % genres.length);
    setTimeout(() => setIsTransitioning(false), 800);
  }, [genres.length, isTransitioning]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isZoomed) {
        handleZoomOut();
        return;
      }
      if (!isZoomed) {
        if (e.key === 'ArrowLeft') navigatePrev();
        if (e.key === 'ArrowRight') navigateNext();
        if (e.key === 'Enter') handleZoom();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigatePrev, navigateNext, isZoomed, handleZoom, handleZoomOut]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse" />
      </div>
    );
  }

  const currentGenre = genres[currentIndex];
  const genreColor = genreColors[currentGenre?.name] || defaultColor;
  const genreMovies = movies[currentGenre?.name] || [];

  return (
    <div className="min-h-screen bg-[#0a0a0f] overflow-hidden relative">
      {/* Starfield background */}
      <div className="stars-container absolute inset-0" />

      {/* Ambient glow */}
      <div
        className={`absolute inset-0 transition-all duration-1000 ease-out pointer-events-none ${
          isZoomed ? 'opacity-150' : ''
        }`}
        style={{
          background: `radial-gradient(ellipse at center, ${genreColor.glow}${isZoomed ? '25' : '15'} 0%, transparent ${isZoomed ? '80%' : '60%'})`
        }}
      />

      {/* Navigation - hidden when zoomed */}
      {!isZoomed && (
        <>
          <button
            onClick={navigatePrev}
            className="absolute left-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/5 hover:bg-white/10 transition-all duration-300 backdrop-blur-sm border border-white/10 group"
          >
            <ChevronLeft className="w-6 h-6 text-white/40 group-hover:text-white/70 transition-colors" />
          </button>

          <button
            onClick={navigateNext}
            className="absolute right-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/5 hover:bg-white/10 transition-all duration-300 backdrop-blur-sm border border-white/10 group"
          >
            <ChevronRight className="w-6 h-6 text-white/40 group-hover:text-white/70 transition-colors" />
          </button>
        </>
      )}

      {/* Zoomed view controls */}
      {isZoomed && (
        <>
          <button
            onClick={handleZoomOut}
            className="absolute left-8 top-8 z-30 p-3 rounded-full bg-white/5 hover:bg-white/10 transition-all duration-300 backdrop-blur-sm border border-white/10 group"
          >
            <X className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
          </button>

          <button
            onClick={handleGoToGrid}
            className="absolute right-8 top-8 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-all duration-300 backdrop-blur-sm border border-white/10 group"
          >
            <Grid className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" />
            <span className="text-white/50 group-hover:text-white text-sm transition-colors">View All</span>
          </button>

          {/* Genre title when zoomed */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30">
            <h2
              className="text-3xl font-light tracking-[0.3em] uppercase"
              style={{ color: genreColor.glow }}
            >
              {currentGenre?.name}
            </h2>
          </div>
        </>
      )}

      {/* Genre indicators - hidden when zoomed */}
      {!isZoomed && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {genres.map((genre, idx) => (
            <button
              key={genre._id}
              onClick={() => {
                if (!isTransitioning && idx !== currentIndex) {
                  setIsTransitioning(true);
                  setCurrentIndex(idx);
                  setTimeout(() => setIsTransitioning(false), 800);
                }
              }}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                idx === currentIndex
                  ? 'w-8 bg-white/50'
                  : 'w-1.5 bg-white/20 hover:bg-white/30'
              }`}
            />
          ))}
        </div>
      )}

      {/* Planet view (non-zoomed) */}
      {!isZoomed && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={`transition-all duration-700 ease-out ${
              isTransitioning ? 'opacity-0 scale-90' : 'opacity-100 scale-100'
            }`}
          >
            {currentGenre && (
              <GenrePlanet
                genre={currentGenre}
                color={genreColor}
                movies={genreMovies}
                onZoom={handleZoom}
              />
            )}
          </div>
        </div>
      )}

      {/* Zoomed orbit view */}
      {isZoomed && (
        <ZoomedOrbit
          movies={zoomedMovies.length > 0 ? zoomedMovies : genreMovies}
          color={genreColor}
          genre={currentGenre}
        />
      )}

      {/* Hint - hidden when zoomed */}
      {!isZoomed && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-white/20 text-xs tracking-[0.3em] uppercase">
          Click planet to explore
        </div>
      )}
    </div>
  );
}
