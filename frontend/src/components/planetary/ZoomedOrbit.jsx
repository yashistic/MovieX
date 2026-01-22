import React, { useState } from 'react';
import { Star, Play } from 'lucide-react';

// Static movie card positioned on orbit - uses CSS for any animations
function OrbitingMovieCard({ movie, index, total, color, orbitIndex }) {
  const [isHovered, setIsHovered] = useState(false);

  // Calculate fixed position on the orbit
  const angle = (index / total) * 360;
  const orbitRadius = 180 + orbitIndex * 80;

  const posterUrl = movie.posterPath
    ? `https://image.tmdb.org/t/p/w200${movie.posterPath}`
    : null;

  const rating = movie.voteAverage ? movie.voteAverage.toFixed(1) : 'N/A';
  const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 'N/A';

  return (
    <div
      className="absolute left-1/2 top-1/2 transition-all duration-300"
      style={{
        transform: `rotate(${angle}deg) translateX(${orbitRadius}px) rotate(-${angle}deg)`,
        zIndex: isHovered ? 100 : 10,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Movie card */}
      <div
        className={`relative rounded-lg overflow-hidden cursor-pointer transition-all duration-300 -translate-x-1/2 -translate-y-1/2 ${
          isHovered ? 'scale-150' : 'scale-100'
        }`}
        style={{
          width: isHovered ? '120px' : '60px',
          height: isHovered ? '180px' : '90px',
          boxShadow: isHovered
            ? `0 0 20px ${color.glow}60, 0 10px 30px rgba(0,0,0,0.5)`
            : `0 0 10px ${color.glow}30`,
        }}
      >
        {/* Poster */}
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: color.primary }}
          >
            <Play className="w-6 h-6 text-white/50" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        {/* Info overlay - visible on hover */}
        {isHovered && (
          <div className="absolute inset-0 flex flex-col justify-end p-2">
            <h4 className="text-white font-medium text-xs leading-tight mb-1 line-clamp-2">
              {movie.title}
            </h4>
            <div className="flex items-center gap-1 text-xs">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              <span className="text-yellow-500 font-medium">{rating}</span>
              <span className="text-white/40 mx-1">•</span>
              <span className="text-white/60">{year}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ZoomedOrbit({ movies, color, genre }) {
  // Split movies into orbits (max 8 per orbit for readability)
  const orbits = [];
  const moviesPerOrbit = 8;

  for (let i = 0; i < movies.length; i += moviesPerOrbit) {
    orbits.push(movies.slice(i, i + moviesPerOrbit));
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* Central glow - simplified */}
      <div
        className="absolute w-24 h-24 rounded-full opacity-30"
        style={{
          backgroundColor: color.glow,
          filter: 'blur(20px)',
        }}
      />

      {/* Mini planet core */}
      <div
        className="absolute w-12 h-12 rounded-full z-20"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${color.glow}, ${color.primary} 60%)`,
          boxShadow: `inset -4px -4px 10px rgba(0,0,0,0.5)`,
        }}
      />

      {/* Orbit rings - static, no animation */}
      {orbits.map((_, orbitIndex) => (
        <div
          key={orbitIndex}
          className="absolute rounded-full border border-white/10"
          style={{
            width: `${360 + orbitIndex * 160}px`,
            height: `${360 + orbitIndex * 160}px`,
          }}
        />
      ))}

      {/* Orbiting movie cards - positioned statically */}
      {orbits.map((orbitMovies, orbitIndex) =>
        orbitMovies.map((movie, index) => (
          <OrbitingMovieCard
            key={movie._id}
            movie={movie}
            index={index}
            total={orbitMovies.length}
            color={color}
            orbitIndex={orbitIndex}
          />
        ))
      )}

      {/* Movie count */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/30 text-sm">
        {movies.length} movies • Hover to see details
      </div>
    </div>
  );
}
