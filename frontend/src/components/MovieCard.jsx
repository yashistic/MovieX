import React, { useState, useEffect } from 'react';
import { Star, Clock, Calendar, Film, Heart, Bookmark, Eye, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';

export default function MovieCard({ movie, theme, onSelectMovie }) {
  const [isHovered, setIsHovered] = useState(false);
  const { isAuthenticated } = useAuth();
  const isDark = theme === 'retro';

  // Movie action states
  const [isFavorite, setIsFavorite] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  const [actionLoading, setActionLoading] = useState({ favorite: false, watchlist: false, watched: false });

  // Check initial states when component mounts
  useEffect(() => {
    const checkMovieStatus = async () => {
      if (!isAuthenticated || !movie?._id) return;

      try {
        const [favRes, watchlistRes, watchedRes] = await Promise.all([
          userService.getFavorites(),
          userService.getWatchlist(),
          userService.getWatched()
        ]);

        if (favRes.success) {
          setIsFavorite(favRes.data.favorites?.some(m => m._id === movie._id) || false);
        }
        if (watchlistRes.success) {
          setIsInWatchlist(watchlistRes.data.watchlist?.some(m => m._id === movie._id) || false);
        }
        if (watchedRes.success) {
          setIsWatched(watchedRes.data.watched?.some(w => w.movie?._id === movie._id) || false);
        }
      } catch (error) {
        // Silently fail - user may not be authenticated
      }
    };

    checkMovieStatus();
  }, [isAuthenticated, movie?._id]);

  // Safely extract data with fallbacks
  const title = movie.title || 'Untitled';
  const posterUrl = movie.posterPath
    ? `https://image.tmdb.org/t/p/w500${movie.posterPath}`
    : '/placeholder-movie.jpg';
  const backdropUrl = movie.backdropPath
    ? `https://image.tmdb.org/t/p/w780${movie.backdropPath}`
    : posterUrl;
  const rating = movie.voteAverage ? movie.voteAverage.toFixed(1) : 'N/A';
  const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 'N/A';
  const runtime = movie.runtime ? `${movie.runtime} min` : null;
  const genres = movie.genres?.slice(0, 3).map(g => g.name).join(', ') || 'Unknown';
  const overview = movie.overview || 'No synopsis available.';
  const language = movie.originalLanguage?.toUpperCase() || 'N/A';

  const handleFavoriteToggle = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated || !movie?._id) return;

    setActionLoading(prev => ({ ...prev, favorite: true }));
    try {
      if (isFavorite) {
        await userService.removeFromFavorites(movie._id);
        setIsFavorite(false);
      } else {
        await userService.addToFavorites(movie._id);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setActionLoading(prev => ({ ...prev, favorite: false }));
    }
  };

  const handleWatchlistToggle = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated || !movie?._id) return;

    setActionLoading(prev => ({ ...prev, watchlist: true }));
    try {
      if (isInWatchlist) {
        await userService.removeFromWatchlist(movie._id);
        setIsInWatchlist(false);
      } else {
        await userService.addToWatchlist(movie._id);
        setIsInWatchlist(true);
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
    } finally {
      setActionLoading(prev => ({ ...prev, watchlist: false }));
    }
  };

  const handleWatchedToggle = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated || !movie?._id) return;

    setActionLoading(prev => ({ ...prev, watched: true }));
    try {
      if (isWatched) {
        await userService.removeFromWatched(movie._id);
        setIsWatched(false);
      } else {
        await userService.markAsWatched(movie._id);
        setIsWatched(true);
        // Auto-remove from watchlist when marked as watched
        if (isInWatchlist) {
          setIsInWatchlist(false);
        }
      }
    } catch (error) {
      console.error('Error toggling watched:', error);
    } finally {
      setActionLoading(prev => ({ ...prev, watched: false }));
    }
  };

  const ActionButton = ({ onClick, isActive, isLoading, activeColor, Icon, label }) => (
    <button
      onClick={onClick}
      disabled={isLoading || !isAuthenticated}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
        isActive
          ? `${activeColor} text-white`
          : isAuthenticated
            ? 'bg-black/40 text-white/70 hover:bg-black/60 hover:text-white'
            : 'bg-black/20 text-white/30 cursor-not-allowed'
      }`}
      title={!isAuthenticated ? 'Sign in to use this feature' : label}
    >
      {isLoading ? (
        <Loader className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Icon className={`w-3.5 h-3.5 ${isActive ? 'fill-current' : ''}`} />
      )}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Card */}
      <div
        onClick={() => onSelectMovie && onSelectMovie(movie)}
        className={`rounded-lg overflow-hidden ${
          isDark
            ? 'bg-stone-900 border border-stone-800 hover:border-yellow-500'
            : 'bg-white border border-stone-200 hover:border-stone-400'
        } transition-all duration-300 cursor-pointer`}
      >
        {/* Poster */}
        <div className="relative overflow-hidden aspect-[2/3]">
          <img
            src={posterUrl}
            alt={title}
            className={`w-full h-full object-cover transition-transform duration-500 ${isHovered ? 'scale-110' : 'scale-100'}`}
            onError={(e) => {
              e.target.src = '/placeholder-movie.jpg';
            }}
          />
          <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="text-white text-sm font-semibold">{rating}</span>
          </div>

          {/* Action buttons overlay */}
          <div
            className={`absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="flex justify-center gap-1.5">
              <ActionButton
                onClick={handleFavoriteToggle}
                isActive={isFavorite}
                isLoading={actionLoading.favorite}
                activeColor="bg-red-500"
                Icon={Heart}
                label="Favorite"
              />
              <ActionButton
                onClick={handleWatchlistToggle}
                isActive={isInWatchlist}
                isLoading={actionLoading.watchlist}
                activeColor="bg-blue-500"
                Icon={Bookmark}
                label="Watchlist"
              />
              <ActionButton
                onClick={handleWatchedToggle}
                isActive={isWatched}
                isLoading={actionLoading.watched}
                activeColor="bg-green-500"
                Icon={Eye}
                label="Watched"
              />
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="p-4">
          <h3 className={`font-bold text-lg mb-2 line-clamp-2 ${
            isDark ? 'text-stone-100' : 'text-stone-900'
          }`}>
            {title}
          </h3>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Clock className={`w-4 h-4 ${isDark ? 'text-stone-500' : 'text-stone-400'}`} />
              <span className={isDark ? 'text-stone-400' : 'text-stone-600'}>
                {runtime || 'N/A'} • {year}
              </span>
            </div>

            <p className={`text-sm ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
              {genres}
            </p>
          </div>
        </div>
      </div>

      {/* Hover Info Card */}
      {isHovered && (
        <div
          className="absolute z-50 left-1/2 -translate-x-1/2 top-0 w-80 rounded-xl overflow-hidden shadow-2xl animate-fadeInUp"
        >
          {/* Background with poster */}
          <div className="relative">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${backdropUrl})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black/95" />

            {/* Content */}
            <div className="relative p-5">
              {/* Header */}
              <div className="flex gap-4 mb-4">
                <img
                  src={posterUrl}
                  alt={title}
                  className="w-20 h-28 object-cover rounded-lg shadow-lg flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-bold text-lg leading-tight mb-2 line-clamp-2">
                    {title}
                  </h4>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1 bg-yellow-500/20 px-2 py-1 rounded">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-yellow-500 font-bold text-sm">{rating}</span>
                    </div>
                    <span className="text-stone-400 text-xs">
                      ({movie.voteCount?.toLocaleString() || 0} votes)
                    </span>
                  </div>

                  {/* Meta info */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="flex items-center gap-1 text-stone-300">
                      <Calendar className="w-3 h-3" />
                      {year}
                    </span>
                    {runtime && (
                      <span className="flex items-center gap-1 text-stone-300">
                        <Clock className="w-3 h-3" />
                        {runtime}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-stone-300">
                      <Film className="w-3 h-3" />
                      {language}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons in hover card */}
              <div className="flex gap-2 mb-4">
                <ActionButton
                  onClick={handleFavoriteToggle}
                  isActive={isFavorite}
                  isLoading={actionLoading.favorite}
                  activeColor="bg-red-500"
                  Icon={Heart}
                  label="Favorite"
                />
                <ActionButton
                  onClick={handleWatchlistToggle}
                  isActive={isInWatchlist}
                  isLoading={actionLoading.watchlist}
                  activeColor="bg-blue-500"
                  Icon={Bookmark}
                  label="Watchlist"
                />
                <ActionButton
                  onClick={handleWatchedToggle}
                  isActive={isWatched}
                  isLoading={actionLoading.watched}
                  activeColor="bg-green-500"
                  Icon={Eye}
                  label="Watched"
                />
              </div>

              {/* Genres */}
              <div className="flex flex-wrap gap-2 mb-3">
                {movie.genres?.slice(0, 3).map((genre, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-white/10 text-stone-300 text-xs rounded-full backdrop-blur-sm"
                  >
                    {genre.name}
                  </span>
                )) || (
                  <span className="px-2 py-1 bg-white/10 text-stone-300 text-xs rounded-full">
                    {genres}
                  </span>
                )}
              </div>

              {/* Synopsis */}
              <div>
                <h5 className="text-stone-400 text-xs uppercase tracking-wider mb-1">Synopsis</h5>
                <p className="text-stone-300 text-sm leading-relaxed line-clamp-4">
                  {overview}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
