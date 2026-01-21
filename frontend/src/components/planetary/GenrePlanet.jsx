import React, { useState } from 'react';
import MovieParticle from './MovieParticle';

export default function GenrePlanet({ genre, color, movies, onZoom }) {
  const [isHovered, setIsHovered] = useState(false);

  const handlePlanetClick = () => {
    if (onZoom) {
      onZoom();
    }
  };

  const handleOrbitClick = (e) => {
    // Only trigger if clicking the orbit area, not the planet itself
    if (e.target === e.currentTarget && onZoom) {
      onZoom();
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Orbit rings - clickable elliptical paths */}
      <div
        className="absolute inset-0 flex items-center justify-center cursor-pointer"
        onClick={handleOrbitClick}
        style={{ width: '600px', height: '400px', left: '-300px', top: '-200px' }}
      >
        {[1, 2, 3].map((ring) => (
          <div
            key={ring}
            className={`absolute rounded-full border transition-all duration-700 pointer-events-none ${
              isHovered ? 'border-white/15' : 'border-white/5'
            }`}
            style={{
              width: `${180 + ring * 100}px`,
              height: `${120 + ring * 70}px`,
              transform: `rotate(${ring * 15 - 20}deg)`,
            }}
          />
        ))}
      </div>

      {/* Movie particles in orbit */}
      <div className="absolute inset-0 flex items-center justify-center">
        {movies.map((movie, index) => (
          <MovieParticle
            key={movie._id}
            movie={movie}
            index={index}
            total={movies.length}
            color={color}
            planetHovered={isHovered}
          />
        ))}
      </div>

      {/* Planet core */}
      <button
        onClick={handlePlanetClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative z-10 cursor-pointer group"
      >
        {/* Outer glow */}
        <div
          className={`absolute inset-0 rounded-full blur-3xl transition-all duration-700 ${
            isHovered ? 'opacity-60 scale-150' : 'opacity-30 scale-125'
          }`}
          style={{ backgroundColor: color.glow }}
        />

        {/* Inner glow */}
        <div
          className={`absolute inset-0 rounded-full blur-xl transition-all duration-500 ${
            isHovered ? 'opacity-80' : 'opacity-50'
          }`}
          style={{ backgroundColor: color.primary }}
        />

        {/* Planet surface */}
        <div
          className={`relative w-32 h-32 rounded-full transition-all duration-500 ${
            isHovered ? 'scale-110' : 'scale-100'
          }`}
          style={{
            background: `radial-gradient(circle at 30% 30%, ${color.glow}, ${color.primary} 50%, ${color.primary}90 100%)`,
            boxShadow: `
              inset -20px -20px 40px rgba(0,0,0,0.5),
              inset 10px 10px 20px rgba(255,255,255,0.1),
              0 0 60px ${color.glow}40
            `
          }}
        >
          {/* Surface texture overlay */}
          <div
            className="absolute inset-0 rounded-full opacity-30"
            style={{
              background: `
                radial-gradient(circle at 70% 70%, transparent 40%, rgba(0,0,0,0.3) 100%),
                radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 40%)
              `
            }}
          />
        </div>

        {/* Genre name - appears on hover */}
        <div
          className={`absolute left-1/2 -translate-x-1/2 -bottom-16 whitespace-nowrap transition-all duration-500 ${
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          <span
            className="text-2xl font-light tracking-[0.2em] uppercase"
            style={{ color: color.glow }}
          >
            {genre.name}
          </span>
        </div>
      </button>
    </div>
  );
}
