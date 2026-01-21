import React, { useState, useEffect, useRef } from 'react';
import { Star, Clock, Calendar } from 'lucide-react';

export default function MovieParticle({ movie, index, total, color, planetHovered }) {
  const [isHovered, setIsHovered] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const animationRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  // Orbital parameters - each particle gets unique orbit
  const orbitRadius = 140 + (index % 3) * 80;
  const orbitEccentricity = 0.3 + (index % 4) * 0.1;
  const orbitTilt = (index * 37) % 360;
  const orbitSpeed = 0.00015 + (index % 5) * 0.00005;
  const startAngle = (index / total) * Math.PI * 2;

  useEffect(() => {
    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const speed = isHovered ? orbitSpeed * 0.2 : orbitSpeed;
      const angle = startAngle + elapsed * speed;

      // Elliptical orbit calculation
      const x = Math.cos(angle) * orbitRadius;
      const y = Math.sin(angle) * orbitRadius * orbitEccentricity;

      // Apply tilt rotation
      const tiltRad = (orbitTilt * Math.PI) / 180;
      const rotatedX = x * Math.cos(tiltRad) - y * Math.sin(tiltRad);
      const rotatedY = x * Math.sin(tiltRad) + y * Math.cos(tiltRad);

      setPosition({ x: rotatedX, y: rotatedY });
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isHovered, orbitRadius, orbitEccentricity, orbitTilt, orbitSpeed, startAngle]);

  const posterUrl = movie.posterPath
    ? `https://image.tmdb.org/t/p/w200${movie.posterPath}`
    : null;

  const backdropUrl = movie.backdropPath
    ? `https://image.tmdb.org/t/p/w780${movie.backdropPath}`
    : posterUrl;

  const rating = movie.voteAverage ? movie.voteAverage.toFixed(1) : 'N/A';
  const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 'N/A';
  const runtime = movie.runtime ? `${movie.runtime} min` : null;

  return (
    <div
      className="absolute"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        zIndex: isHovered ? 100 : Math.round(position.y + 500),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Particle */}
      <div
        className={`relative cursor-pointer transition-all duration-500 ${
          isHovered ? 'scale-150' : 'scale-100'
        }`}
      >
        {/* Glow effect */}
        <div
          className={`absolute inset-0 rounded-full blur-md transition-all duration-500 ${
            isHovered ? 'opacity-100 scale-200' : planetHovered ? 'opacity-60' : 'opacity-30'
          }`}
          style={{
            backgroundColor: color.glow,
            width: '12px',
            height: '12px',
            transform: 'translate(-50%, -50%)',
          }}
        />

        {/* Core particle */}
        <div
          className={`w-3 h-3 rounded-full transition-all duration-300 ${
            isHovered ? 'bg-white' : ''
          }`}
          style={{
            backgroundColor: isHovered ? '#fff' : color.glow,
            boxShadow: isHovered
              ? `0 0 20px ${color.glow}, 0 0 40px ${color.glow}50`
              : `0 0 10px ${color.glow}80`,
          }}
        />
      </div>

      {/* Info panel on hover */}
      {isHovered && (
        <div
          className="absolute left-6 top-1/2 -translate-y-1/2 w-72 rounded-xl overflow-hidden shadow-2xl z-50"
          style={{
            animation: 'fadeInPanel 0.3s ease-out forwards',
          }}
        >
          {/* Blurred backdrop */}
          <div className="absolute inset-0">
            {backdropUrl && (
              <img
                src={backdropUrl}
                alt=""
                className="w-full h-full object-cover blur-sm scale-110"
              />
            )}
            <div className="absolute inset-0 bg-black/80" />
          </div>

          {/* Content */}
          <div className="relative p-4">
            <div className="flex gap-3 mb-3">
              {/* Mini poster */}
              {posterUrl && (
                <img
                  src={posterUrl}
                  alt={movie.title}
                  className="w-16 h-24 object-cover rounded-lg shadow-lg flex-shrink-0"
                />
              )}

              <div className="flex-1 min-w-0">
                {/* Title */}
                <h4 className="text-white font-semibold text-sm leading-tight mb-2 line-clamp-2">
                  {movie.title}
                </h4>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-2">
                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                  <span className="text-yellow-500 font-medium text-sm">{rating}</span>
                  <span className="text-white/40 text-xs ml-1">
                    ({movie.voteCount?.toLocaleString() || 0})
                  </span>
                </div>

                {/* Meta */}
                <div className="flex flex-wrap gap-3 text-xs text-white/50">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {year}
                  </span>
                  {runtime && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {runtime}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Synopsis */}
            {movie.overview && (
              <p className="text-white/60 text-xs leading-relaxed line-clamp-3">
                {movie.overview}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
