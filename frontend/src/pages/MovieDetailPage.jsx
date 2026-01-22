import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, Clock, Calendar, Play, Film, Users, Globe } from 'lucide-react';
import movieService from '../services/movieService';

export default function MovieDetailPage({ movie, onBack, theme }) {
  const [fullMovie, setFullMovie] = useState(movie);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch full movie details if we only have partial data
    const fetchFullDetails = async () => {
      if (movie?.tmdbId && !movie.overview) {
        setLoading(true);
        try {
          const response = await movieService.getMovieById(movie._id);
          if (response.data) {
            setFullMovie(response.data);
          }
        } catch (err) {
          console.error('Error fetching movie details:', err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchFullDetails();
  }, [movie]);

  if (!fullMovie) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <p className="text-white/50">Movie not found</p>
      </div>
    );
  }

  const posterUrl = fullMovie.posterPath
    ? `https://image.tmdb.org/t/p/w500${fullMovie.posterPath}`
    : null;

  const backdropUrl = fullMovie.backdropPath
    ? `https://image.tmdb.org/t/p/original${fullMovie.backdropPath}`
    : null;

  const rating = fullMovie.voteAverage ? fullMovie.voteAverage.toFixed(1) : 'N/A';
  const year = fullMovie.releaseDate ? new Date(fullMovie.releaseDate).getFullYear() : 'N/A';
  const runtime = fullMovie.runtime ? `${fullMovie.runtime} min` : null;

  return (
    <div className="min-h-screen bg-[#050508] relative">
      {/* Background backdrop */}
      {backdropUrl && (
        <div className="absolute inset-0 z-0">
          <img
            src={backdropUrl}
            alt=""
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/80 to-[#050508]/60" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050508] via-transparent to-[#050508]" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        {/* Back button */}
        <button
          onClick={onBack}
          className="fixed left-6 top-6 z-30 p-3 rounded-full bg-black/50 hover:bg-black/70 transition-colors flex items-center gap-2 backdrop-blur-sm"
        >
          <ArrowLeft className="w-5 h-5 text-white/70" />
          <span className="text-white/70 text-sm">Back</span>
        </button>

        {/* Main content */}
        <div className="container mx-auto px-4 pt-20 pb-12">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            {/* Poster */}
            <div className="flex-shrink-0 mx-auto lg:mx-0">
              {posterUrl ? (
                <div className="relative group">
                  <img
                    src={posterUrl}
                    alt={fullMovie.title}
                    className="w-64 sm:w-72 lg:w-80 rounded-xl shadow-2xl"
                    style={{
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
                    }}
                  />
                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 rounded-xl">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Play className="w-8 h-8 text-white fill-white" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-64 sm:w-72 lg:w-80 h-96 bg-white/5 rounded-xl flex items-center justify-center">
                  <Film className="w-16 h-16 text-white/20" />
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 text-center lg:text-left">
              {/* Title */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                {fullMovie.title}
              </h1>

              {/* Original title if different */}
              {fullMovie.originalTitle && fullMovie.originalTitle !== fullMovie.title && (
                <p className="text-white/40 text-lg mb-4 italic">
                  {fullMovie.originalTitle}
                </p>
              )}

              {/* Meta info */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-6">
                {/* Rating */}
                <div className="flex items-center gap-2 bg-yellow-500/20 px-3 py-1.5 rounded-full">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <span className="text-yellow-500 font-semibold">{rating}</span>
                  {fullMovie.voteCount && (
                    <span className="text-yellow-500/60 text-sm">
                      ({fullMovie.voteCount.toLocaleString()} votes)
                    </span>
                  )}
                </div>

                {/* Year */}
                <div className="flex items-center gap-2 text-white/60">
                  <Calendar className="w-4 h-4" />
                  <span>{year}</span>
                </div>

                {/* Runtime */}
                {runtime && (
                  <div className="flex items-center gap-2 text-white/60">
                    <Clock className="w-4 h-4" />
                    <span>{runtime}</span>
                  </div>
                )}

                {/* Language */}
                {fullMovie.originalLanguage && (
                  <div className="flex items-center gap-2 text-white/60">
                    <Globe className="w-4 h-4" />
                    <span className="uppercase">{fullMovie.originalLanguage}</span>
                  </div>
                )}
              </div>

              {/* Genres */}
              {fullMovie.genres && fullMovie.genres.length > 0 && (
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-6">
                  {fullMovie.genres.map((genre, index) => (
                    <span
                      key={genre._id || index}
                      className="px-3 py-1 rounded-full bg-white/10 text-white/70 text-sm"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Tagline */}
              {fullMovie.tagline && (
                <p className="text-xl text-white/50 italic mb-6">
                  "{fullMovie.tagline}"
                </p>
              )}

              {/* Overview */}
              {fullMovie.overview && (
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-white/80 mb-3">Overview</h2>
                  <p className="text-white/60 leading-relaxed max-w-2xl">
                    {fullMovie.overview}
                  </p>
                </div>
              )}

              {/* Additional details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
                {/* Popularity */}
                {fullMovie.popularity && (
                  <div>
                    <h3 className="text-sm font-medium text-white/40 mb-1">Popularity</h3>
                    <p className="text-white/70">{fullMovie.popularity.toFixed(1)}</p>
                  </div>
                )}

                {/* Release Date */}
                {fullMovie.releaseDate && (
                  <div>
                    <h3 className="text-sm font-medium text-white/40 mb-1">Release Date</h3>
                    <p className="text-white/70">
                      {new Date(fullMovie.releaseDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}

                {/* Platforms */}
                {fullMovie.platforms && fullMovie.platforms.length > 0 && (
                  <div className="sm:col-span-2">
                    <h3 className="text-sm font-medium text-white/40 mb-2">Available On</h3>
                    <div className="flex flex-wrap gap-2">
                      {fullMovie.platforms.map((platform, index) => (
                        <span
                          key={platform._id || index}
                          className="px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-sm"
                        >
                          {platform.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* TMDB link */}
              {fullMovie.tmdbId && (
                <div className="mt-8">
                  <a
                    href={`https://www.themoviedb.org/movie/${fullMovie.tmdbId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors text-sm"
                  >
                    <Globe className="w-4 h-4" />
                    View on TMDB
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      )}
    </div>
  );
}
