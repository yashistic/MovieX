import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, User, LogIn, Heart, Bookmark, Eye, Loader } from 'lucide-react';
import movieService from '../../services/movieService';
import userService from '../../services/userService';
import { useAuth } from '../../context/AuthContext';

// Genre color palette
const genreColors = {
  'Action': { primary: '#dc2626', glow: '#ef4444' },
  'Adventure': { primary: '#f59e0b', glow: '#fbbf24' },
  'Animation': { primary: '#8b5cf6', glow: '#a78bfa' },
  'Comedy': { primary: '#fcd34d', glow: '#fde68a' },
  'Crime': { primary: '#1f2937', glow: '#4b5563' },
  'Documentary': { primary: '#6b7280', glow: '#9ca3af' },
  'Drama': { primary: '#7c3aed', glow: '#8b5cf6' },
  'Family': { primary: '#10b981', glow: '#34d399' },
  'Fantasy': { primary: '#6366f1', glow: '#818cf8' },
  'History': { primary: '#92400e', glow: '#b45309' },
  'Horror': { primary: '#991b1b', glow: '#b91c1c' },
  'Music': { primary: '#ec4899', glow: '#f472b6' },
  'Mystery': { primary: '#1e3a5f', glow: '#2563eb' },
  'Romance': { primary: '#e11d48', glow: '#fb7185' },
  'Science Fiction': { primary: '#06b6d4', glow: '#22d3ee' },
  'Thriller': { primary: '#374151', glow: '#6b7280' },
  'War': { primary: '#78350f', glow: '#a16207' },
  'Western': { primary: '#b45309', glow: '#d97706' },
  'TV Movie': { primary: '#64748b', glow: '#94a3b8' },
};

const defaultColor = { primary: '#6366f1', glow: '#818cf8' };

// Floating background dots for spacey vibe
function SpaceBackground() {
  const dots = useMemo(() => {
    const result = [];
    for (let i = 0; i < 60; i++) {
      result.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.1,
        duration: Math.random() * 20 + 10,
        delay: Math.random() * -20,
      });
    }
    return result;
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {dots.map((dot) => (
        <div
          key={dot.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            width: `${dot.size}px`,
            height: `${dot.size}px`,
            opacity: dot.opacity,
            animation: `float ${dot.duration}s ease-in-out ${dot.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// Simple planet component - stationary position
function SimplePlanet({ genre, color, angle, radius, onSelect }) {
  const [isHovered, setIsHovered] = useState(false);

  // Position relative to center of rotating container
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;

  return (
    <button
      onClick={() => onSelect(genre)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="absolute transition-all duration-300 group"
      style={{
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
        transform: `translate(-50%, -50%) scale(${isHovered ? 1.15 : 1})`,
      }}
    >
      {/* Glow effect */}
      <div
        className={`absolute inset-0 rounded-full transition-opacity duration-300 ${
          isHovered ? 'opacity-60' : 'opacity-20'
        }`}
        style={{
          backgroundColor: color.glow,
          transform: 'scale(1.8)',
          filter: 'blur(15px)',
        }}
      />

      {/* Planet surface */}
      <div
        className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full transition-all duration-300 flex items-center justify-center"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${color.glow}40, ${color.primary} 60%)`,
          boxShadow: isHovered
            ? `inset -8px -8px 20px rgba(0,0,0,0.5), 0 0 40px ${color.glow}60`
            : `inset -6px -6px 15px rgba(0,0,0,0.4), 0 0 20px ${color.glow}30`,
        }}
      >
        {/* Genre label */}
        <span
          className="text-[8px] sm:text-[9px] md:text-[10px] font-semibold tracking-wide uppercase text-center leading-tight px-1"
          style={{
            color: 'rgba(255,255,255,0.95)',
            textShadow: '0 1px 4px rgba(0,0,0,0.9)',
            maxWidth: '90%',
          }}
        >
          {genre.name}
        </span>
      </div>
    </button>
  );
}

// Movie dot positioned around enlarged planet
function MovieDot({ movie, index, total, color, onHover, onSelect, hoveredId, isAuthenticated, movieStatuses, onToggleFavorite, onToggleWatchlist, onToggleWatched }) {
  const isHovered = hoveredId === movie._id;

  // Calculate static position for this dot
  const angleInRadians = (index / total) * Math.PI * 2 - Math.PI / 2;
  const orbitRadius = 160 + (index % 2) * 40;

  // Calculate x and y position
  const x = Math.cos(angleInRadians) * orbitRadius;
  const y = Math.sin(angleInRadians) * orbitRadius;

  const posterUrl = movie.posterPath
    ? `https://image.tmdb.org/t/p/w200${movie.posterPath}`
    : null;

  const status = movieStatuses[movie._id] || { isFavorite: false, isInWatchlist: false, isWatched: false, loading: {} };

  const ActionButton = ({ onClick, isActive, isLoading, activeColor, inactiveColor, Icon, label }) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      disabled={isLoading || !isAuthenticated}
      className={`p-1.5 rounded-full transition-all ${
        isActive
          ? `${activeColor} text-white`
          : isAuthenticated
            ? `${inactiveColor} text-white/60 hover:text-white`
            : 'bg-white/5 text-white/30 cursor-not-allowed'
      }`}
      title={!isAuthenticated ? 'Sign in to use this feature' : label}
    >
      {isLoading ? (
        <Loader className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Icon className={`w-3.5 h-3.5 ${isActive ? 'fill-current' : ''}`} />
      )}
    </button>
  );

  return (
    <div
      className="absolute transition-all duration-300"
      style={{
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
        transform: 'translate(-50%, -50%)',
        zIndex: isHovered ? 100 : 10,
      }}
      onMouseEnter={() => onHover(movie._id)}
      onMouseLeave={() => onHover(null)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(movie);
      }}
    >
      {/* The dot */}
      <div
        className={`relative cursor-pointer transition-all duration-300 ${
          isHovered ? 'scale-150' : 'scale-100'
        }`}
      >
        {/* Glow */}
        <div
          className={`absolute rounded-full transition-all duration-300 ${
            isHovered ? 'opacity-80' : 'opacity-40'
          }`}
          style={{
            width: isHovered ? '20px' : '12px',
            height: isHovered ? '20px' : '12px',
            backgroundColor: color.glow,
            filter: 'blur(6px)',
            transform: 'translate(-50%, -50%)',
            left: '50%',
            top: '50%',
          }}
        />

        {/* Core dot */}
        <div
          className="w-3 h-3 rounded-full transition-all duration-300"
          style={{
            backgroundColor: isHovered ? '#fff' : color.glow,
            boxShadow: `0 0 10px ${color.glow}`,
          }}
        />
      </div>

      {/* Hover card with movie info */}
      {isHovered && (
        <div
          className="absolute left-6 top-1/2 -translate-y-1/2 w-52 bg-black/95 backdrop-blur-sm rounded-lg overflow-hidden shadow-2xl border border-white/10 z-50"
          style={{
            boxShadow: `0 0 30px ${color.glow}40`,
          }}
        >
          {posterUrl && (
            <img
              src={posterUrl}
              alt={movie.title}
              className="w-full h-32 object-cover"
            />
          )}
          <div className="p-3">
            <h4 className="text-white font-semibold text-sm leading-tight mb-1">
              {movie.title}
            </h4>
            <p className="text-white/50 text-xs mb-3">
              {movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 'N/A'}
              {movie.voteAverage && ` • ⭐ ${movie.voteAverage.toFixed(1)}`}
            </p>

            {/* Action buttons */}
            <div className="flex items-center gap-2 mb-2">
              <ActionButton
                onClick={() => onToggleFavorite(movie._id)}
                isActive={status.isFavorite}
                isLoading={status.loading?.favorite}
                activeColor="bg-red-500"
                inactiveColor="bg-white/10 hover:bg-red-500/50"
                Icon={Heart}
                label="Favorite"
              />
              <ActionButton
                onClick={() => onToggleWatchlist(movie._id)}
                isActive={status.isInWatchlist}
                isLoading={status.loading?.watchlist}
                activeColor="bg-blue-500"
                inactiveColor="bg-white/10 hover:bg-blue-500/50"
                Icon={Bookmark}
                label="Watchlist"
              />
              <ActionButton
                onClick={() => onToggleWatched(movie._id)}
                isActive={status.isWatched}
                isLoading={status.loading?.watched}
                activeColor="bg-green-500"
                inactiveColor="bg-white/10 hover:bg-green-500/50"
                Icon={Eye}
                label="Watched"
              />
              <span className="text-white/30 text-xs ml-1">Click card for details</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Enlarged planet view with stationary movie dots
function EnlargedPlanetView({ genre, color, movies, onBack, onSelectMovie, isAuthenticated }) {
  const [hoveredMovieId, setHoveredMovieId] = useState(null);
  const [isHoveringPlanet, setIsHoveringPlanet] = useState(false);
  const [movieStatuses, setMovieStatuses] = useState({});

  // Fetch initial movie statuses
  useEffect(() => {
    const fetchMovieStatuses = async () => {
      if (!isAuthenticated || movies.length === 0) return;

      try {
        const [favRes, watchlistRes, watchedRes] = await Promise.all([
          userService.getFavorites(),
          userService.getWatchlist(),
          userService.getWatched()
        ]);

        const statuses = {};
        movies.forEach(movie => {
          statuses[movie._id] = {
            isFavorite: favRes.success && favRes.data.favorites?.some(m => m._id === movie._id),
            isInWatchlist: watchlistRes.success && watchlistRes.data.watchlist?.some(m => m._id === movie._id),
            isWatched: watchedRes.success && watchedRes.data.watched?.some(w => w.movie?._id === movie._id),
            loading: {}
          };
        });
        setMovieStatuses(statuses);
      } catch (error) {
        console.error('Error fetching movie statuses:', error);
      }
    };

    fetchMovieStatuses();
  }, [isAuthenticated, movies]);

  // Toggle handlers
  const handleToggleFavorite = async (movieId) => {
    if (!isAuthenticated) return;

    setMovieStatuses(prev => ({
      ...prev,
      [movieId]: { ...prev[movieId], loading: { ...prev[movieId]?.loading, favorite: true } }
    }));

    try {
      const currentStatus = movieStatuses[movieId]?.isFavorite;
      if (currentStatus) {
        await userService.removeFromFavorites(movieId);
      } else {
        await userService.addToFavorites(movieId);
      }
      setMovieStatuses(prev => ({
        ...prev,
        [movieId]: { ...prev[movieId], isFavorite: !currentStatus, loading: { ...prev[movieId]?.loading, favorite: false } }
      }));
    } catch (error) {
      console.error('Error toggling favorite:', error);
      setMovieStatuses(prev => ({
        ...prev,
        [movieId]: { ...prev[movieId], loading: { ...prev[movieId]?.loading, favorite: false } }
      }));
    }
  };

  const handleToggleWatchlist = async (movieId) => {
    if (!isAuthenticated) return;

    setMovieStatuses(prev => ({
      ...prev,
      [movieId]: { ...prev[movieId], loading: { ...prev[movieId]?.loading, watchlist: true } }
    }));

    try {
      const currentStatus = movieStatuses[movieId]?.isInWatchlist;
      if (currentStatus) {
        await userService.removeFromWatchlist(movieId);
      } else {
        await userService.addToWatchlist(movieId);
      }
      setMovieStatuses(prev => ({
        ...prev,
        [movieId]: { ...prev[movieId], isInWatchlist: !currentStatus, loading: { ...prev[movieId]?.loading, watchlist: false } }
      }));
    } catch (error) {
      console.error('Error toggling watchlist:', error);
      setMovieStatuses(prev => ({
        ...prev,
        [movieId]: { ...prev[movieId], loading: { ...prev[movieId]?.loading, watchlist: false } }
      }));
    }
  };

  const handleToggleWatched = async (movieId) => {
    if (!isAuthenticated) return;

    setMovieStatuses(prev => ({
      ...prev,
      [movieId]: { ...prev[movieId], loading: { ...prev[movieId]?.loading, watched: true } }
    }));

    try {
      const currentStatus = movieStatuses[movieId]?.isWatched;
      if (currentStatus) {
        await userService.removeFromWatched(movieId);
      } else {
        await userService.markAsWatched(movieId);
        // Auto-remove from watchlist when marked as watched
        if (movieStatuses[movieId]?.isInWatchlist) {
          setMovieStatuses(prev => ({
            ...prev,
            [movieId]: { ...prev[movieId], isInWatchlist: false }
          }));
        }
      }
      setMovieStatuses(prev => ({
        ...prev,
        [movieId]: { ...prev[movieId], isWatched: !currentStatus, loading: { ...prev[movieId]?.loading, watched: false } }
      }));
    } catch (error) {
      console.error('Error toggling watched:', error);
      setMovieStatuses(prev => ({
        ...prev,
        [movieId]: { ...prev[movieId], loading: { ...prev[movieId]?.loading, watched: false } }
      }));
    }
  };

  // Handle clicking on the planet to get a random movie suggestion
  const handlePlanetClick = useCallback(() => {
    if (movies.length > 0) {
      const randomIndex = Math.floor(Math.random() * movies.length);
      const randomMovie = movies[randomIndex];
      onSelectMovie(randomMovie);
    }
  }, [movies, onSelectMovie]);

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute left-6 top-6 z-30 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2"
      >
        <ArrowLeft className="w-5 h-5 text-white/70" />
        <span className="text-white/70 text-sm">Back</span>
      </button>

      {/* Ambient glow */}
      <div
        className="absolute rounded-full opacity-30"
        style={{
          width: '400px',
          height: '400px',
          backgroundColor: color.glow,
          filter: 'blur(80px)',
        }}
      />

      {/* Orbit rings */}
      <div
        className="absolute rounded-full border border-white/10"
        style={{ width: '320px', height: '320px' }}
      />
      <div
        className="absolute rounded-full border border-white/5"
        style={{ width: '400px', height: '400px' }}
      />

      {/* Enlarged planet - clickable for random movie */}
      <button
        onClick={handlePlanetClick}
        onMouseEnter={() => setIsHoveringPlanet(true)}
        onMouseLeave={() => setIsHoveringPlanet(false)}
        className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full flex flex-col items-center justify-center z-20 cursor-pointer transition-transform duration-300"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${color.glow}50, ${color.primary} 60%)`,
          boxShadow: `
            inset -15px -15px 30px rgba(0,0,0,0.5),
            inset 8px 8px 20px rgba(255,255,255,0.1),
            0 0 60px ${color.glow}50
          `,
          transform: isHoveringPlanet ? 'scale(1.08)' : 'scale(1)',
        }}
      >
        <span
          className="text-lg sm:text-xl font-semibold tracking-wider uppercase text-center"
          style={{
            color: 'rgba(255,255,255,0.95)',
            textShadow: '0 2px 8px rgba(0,0,0,0.9)',
          }}
        >
          {genre.name}
        </span>

        {/* Random movie hint on hover */}
        <span
          className={`text-[10px] mt-1 transition-opacity duration-300 ${
            isHoveringPlanet ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            color: 'rgba(255,255,255,0.7)',
            textShadow: '0 1px 4px rgba(0,0,0,0.9)',
          }}
        >
          🎲 Surprise me!
        </span>
      </button>

      {/* Movie dots */}
      {movies.map((movie, index) => (
        <MovieDot
          key={movie._id}
          movie={movie}
          index={index}
          total={movies.length}
          color={color}
          onHover={setHoveredMovieId}
          onSelect={onSelectMovie}
          hoveredId={hoveredMovieId}
          isAuthenticated={isAuthenticated}
          movieStatuses={movieStatuses}
          onToggleFavorite={handleToggleFavorite}
          onToggleWatchlist={handleToggleWatchlist}
          onToggleWatched={handleToggleWatched}
        />
      ))}

      {/* Hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/30 text-sm text-center">
        <p>{movies.length} movies • Hover over dots to preview</p>
        <p className="text-white/20 text-xs mt-1">Click the planet for a random suggestion</p>
      </div>
    </div>
  );
}

// Central sun component
function CentralSun({ onNavigate }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={() => onNavigate && onNavigate('recommendations')}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 transition-transform duration-500"
      style={{
        transform: `translate(-50%, -50%) scale(${isHovered ? 1.1 : 1})`,
      }}
    >
      {/* Outer rays/corona */}
      <div
        className={`absolute inset-0 rounded-full transition-all duration-500 ${
          isHovered ? 'opacity-80' : 'opacity-40'
        }`}
        style={{
          background: 'radial-gradient(circle, rgba(255,200,50,0.4) 0%, rgba(255,150,0,0.2) 40%, transparent 70%)',
          transform: 'scale(3)',
          filter: 'blur(8px)',
        }}
      />

      {/* Pulsing glow */}
      <div
        className="absolute inset-0 rounded-full animate-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(255,220,100,0.6) 0%, rgba(255,180,50,0.3) 50%, transparent 70%)',
          transform: 'scale(2)',
          filter: 'blur(15px)',
        }}
      />

      {/* Sun surface */}
      <div
        className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center transition-all duration-300"
        style={{
          background: `radial-gradient(circle at 30% 30%,
            #fff9c4 0%,
            #ffeb3b 20%,
            #ffc107 40%,
            #ff9800 60%,
            #ff5722 80%,
            #e64a19 100%)`,
          boxShadow: isHovered
            ? `0 0 60px rgba(255,200,50,0.8), 0 0 120px rgba(255,150,0,0.5), inset -10px -10px 30px rgba(0,0,0,0.2)`
            : `0 0 40px rgba(255,200,50,0.6), 0 0 80px rgba(255,150,0,0.3), inset -8px -8px 25px rgba(0,0,0,0.2)`,
        }}
      >
        {/* Surface texture */}
        <div
          className="absolute inset-0 rounded-full opacity-30"
          style={{
            background: `
              radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4) 0%, transparent 30%),
              radial-gradient(circle at 80% 80%, rgba(0,0,0,0.2) 0%, transparent 30%)
            `,
          }}
        />

        {/* Text */}
        <div className="text-center z-10 px-2">
          <span
            className="text-[10px] sm:text-xs font-bold tracking-wide uppercase leading-tight block"
            style={{
              color: 'rgba(80,30,0,0.9)',
              textShadow: '0 1px 2px rgba(255,255,255,0.3)',
            }}
          >
            What to
          </span>
          <span
            className="text-sm sm:text-base font-black tracking-wider uppercase"
            style={{
              color: 'rgba(80,30,0,0.95)',
              textShadow: '0 1px 2px rgba(255,255,255,0.3)',
            }}
          >
            Watch?
          </span>
        </div>
      </div>

      {/* Hover hint */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap transition-all duration-300 ${
          isHovered ? 'opacity-100 -bottom-10' : 'opacity-0 -bottom-8'
        }`}
      >
        <span className="text-xs text-amber-400/80 tracking-wider">
          Get Recommendations
        </span>
      </div>
    </button>
  );
}

export default function PlanetaryView({ onSelectGenre, onSelectMovie, onNavigate }) {
  const { user, isAuthenticated } = useAuth();
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [genreMovies, setGenreMovies] = useState([]);

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

  // Calculate circle radius - increased for more gap
  const circleRadius = useMemo(() => {
    if (typeof window === 'undefined') return 280;
    const minDimension = Math.min(window.innerWidth, window.innerHeight);
    return Math.min(minDimension * 0.38, 320);
  }, []);

  // Handle planet click
  const handlePlanetClick = useCallback(async (genre) => {
    setSelectedGenre(genre);
    try {
      const response = await movieService.getMoviesByGenre(genre.name, { limit: 20 });
      setGenreMovies(response.data || []);
    } catch (err) {
      console.error('Error fetching movies:', err);
      setGenreMovies([]);
    }
  }, []);

  // Handle back to main view
  const handleBack = useCallback(() => {
    setSelectedGenre(null);
    setGenreMovies([]);
  }, []);

  // Handle movie selection
  const handleMovieSelect = useCallback((movie) => {
    if (onSelectMovie) {
      onSelectMovie(movie);
    }
  }, [onSelectMovie]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedGenre) {
        handleBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedGenre, handleBack]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const selectedColor = selectedGenre ? (genreColors[selectedGenre.name] || defaultColor) : defaultColor;

  return (
    <div className="min-h-screen bg-[#050508] overflow-hidden relative">
      {/* Floating space background */}
      <SpaceBackground />

      {/* Main planets view */}
      {!selectedGenre && (
        <>
          {/* Header */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 text-center">
            <h1 className="text-xl sm:text-2xl font-light text-white/70 tracking-[0.25em] uppercase">
              Explore Genres
            </h1>
            <p className="text-white/30 text-xs mt-2 tracking-wider">
              Click a planet to discover movies
            </p>
          </div>

          {/* User button - top right */}
          <button
            onClick={() => onNavigate && onNavigate(isAuthenticated ? 'profile' : 'auth')}
            className="absolute top-6 right-6 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: isAuthenticated
                  ? 'radial-gradient(circle at 30% 30%, #818cf8 0%, #6366f1 60%)'
                  : 'radial-gradient(circle at 30% 30%, #4ade80 0%, #22c55e 60%)',
                boxShadow: isAuthenticated
                  ? '0 0 15px rgba(99, 102, 241, 0.3)'
                  : '0 0 15px rgba(34, 197, 94, 0.3)',
              }}
            >
              {isAuthenticated ? (
                <User className="w-4 h-4 text-white/90" />
              ) : (
                <LogIn className="w-4 h-4 text-white/90" />
              )}
            </div>
            <span className="text-white/70 text-sm font-medium tracking-wide group-hover:text-white/90 transition-colors">
              {isAuthenticated ? (user?.name?.split(' ')[0] || 'You') : 'Sign In'}
            </span>
          </button>

          {/* Central Sun */}
          <CentralSun onNavigate={onNavigate} />

          {/* Planets container */}
          <div
            className="absolute inset-0"
          >
            {genres.map((genre, index) => {
              const angle = (index / genres.length) * Math.PI * 2 - Math.PI / 2;
              const color = genreColors[genre.name] || defaultColor;

              return (
                <SimplePlanet
                  key={genre._id}
                  genre={genre}
                  color={color}
                  angle={angle}
                  radius={circleRadius}
                  onSelect={handlePlanetClick}
                />
              );
            })}
          </div>

          {/* Bottom hint */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/20 text-xs tracking-wider uppercase">
            {genres.length} genres available
          </div>
        </>
      )}

      {/* Enlarged planet view */}
      {selectedGenre && (
        <EnlargedPlanetView
          genre={selectedGenre}
          color={selectedColor}
          movies={genreMovies}
          onBack={handleBack}
          onSelectMovie={handleMovieSelect}
          isAuthenticated={isAuthenticated}
        />
      )}
    </div>
  );
}
