import React, { useState } from 'react';
import { Star, Clock, Calendar, Film } from 'lucide-react';

export default function MovieCard({ movie, theme }) {
  const [isHovered, setIsHovered] = useState(false);
  const isDark = theme === 'retro';

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

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Card */}
      <div
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
