import React, { useState, useEffect, useRef } from 'react';
import { Star, Clock, Calendar, Play } from 'lucide-react';

function ZoomedMovieCard({ movie, index, total, color }) {
  const [isHovered, setIsHovered] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0, z: 0 });
  const animationRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  // Larger orbital parameters for zoomed view
  const orbitRadius = 280 + (index % 3) * 60;
  const orbitEccentricity = 0.4 + (index % 3) * 0.1;
  const orbitTilt = (index * 27) % 360;
  const orbitSpeed = 0.0001 + (index % 4) * 0.00002;
  const startAngle = (index / total) * Math.PI * 2;

  useEffect(() => {
    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const speed = isHovered ? orbitSpeed * 0.1 : orbitSpeed;
      const angle = startAngle + elapsed * speed;

      const x = Math.cos(angle) * orbitRadius;
      const y = Math.sin(angle) * orbitRadius * orbitEccentricity;

      const tiltRad = (orbitTilt * Math.PI) / 180;
      const rotatedX = x * Math.cos(tiltRad) - y * Math.sin(tiltRad);
      const rotatedY = x * Math.sin(tiltRad) + y * Math.cos(tiltRad);

      // Z-depth for layering
      const z = Math.sin(angle) * 100;

      setPosition({ x: rotatedX, y: rotatedY, z });
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

  const rating = movie.voteAverage ? movie.voteAverage.toFixed(1) : 'N/A';
  const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 'N/A';

  // Scale based on z-position for depth effect
  const scale = isHovered ? 1.3 : 0.8 + (position.z + 100) / 400;
  const opacity = isHovered ? 1 : 0.6 + (position.z + 100) / 300;

  return (
    <div
      className="absolute transition-all duration-300 cursor-pointer"
      style={{
        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
        zIndex: isHovered ? 100 : Math.round(position.z + 150),
        opacity: Math.min(opacity, 1),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Movie card */}
      <div
        className={`relative rounded-xl overflow-hidden shadow-2xl transition-all duration-500 ${
          isHovered ? 'ring-2' : ''
        }`}
        style={{
          width: isHovered ? '200px' : '80px',
          height: isHovered ? '300px' : '120px',
          ringColor: color.glow,
          boxShadow: isHovered
            ? `0 0 40px ${color.glow}60, 0 20px 40px rgba(0,0,0,0.5)`
            : `0 0 20px ${color.glow}30`,
        }}
      >
        {/* Poster */}
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: color.primary }}
          >
            <Play className="w-8 h-8 text-white/50" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        {/* Info overlay - visible on hover */}
        <div
          className={`absolute inset-0 flex flex-col justify-end p-3 transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <h4 className="text-white font-semibold text-sm leading-tight mb-2 line-clamp-2">
            {movie.title}
          </h4>

          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              <span className="text-yellow-500 font-medium">{rating}</span>
            </div>
            <span className="text-white/40">•</span>
            <span className="text-white/60">{year}</span>
          </div>

          {movie.runtime && (
            <div className="flex items-center gap-1 mt-1 text-xs text-white/50">
              <Clock className="w-3 h-3" />
              <span>{movie.runtime} min</span>
            </div>
          )}
        </div>

        {/* Glow ring on hover */}
        {isHovered && (
          <div
            className="absolute -inset-1 rounded-xl -z-10 blur-md"
            style={{ backgroundColor: color.glow, opacity: 0.5 }}
          />
        )}
      </div>

      {/* Title below card when not hovered */}
      {!isHovered && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className="text-white/40 text-xs font-medium truncate max-w-[100px] block text-center">
            {movie.title?.length > 15 ? movie.title.slice(0, 15) + '...' : movie.title}
          </span>
        </div>
      )}
    </div>
  );
}

export default function ZoomedOrbit({ movies, color, genre }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* Central glow */}
      <div
        className="absolute w-40 h-40 rounded-full blur-3xl opacity-30"
        style={{ backgroundColor: color.glow }}
      />

      {/* Mini planet core */}
      <div
        className="absolute w-16 h-16 rounded-full z-10"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${color.glow}, ${color.primary} 50%, ${color.primary}90 100%)`,
          boxShadow: `
            inset -8px -8px 16px rgba(0,0,0,0.5),
            inset 4px 4px 8px rgba(255,255,255,0.1),
            0 0 40px ${color.glow}40
          `,
        }}
      />

      {/* Orbit rings */}
      {[1, 2, 3].map((ring) => (
        <div
          key={ring}
          className="absolute rounded-full border border-white/5"
          style={{
            width: `${400 + ring * 120}px`,
            height: `${280 + ring * 80}px`,
            transform: `rotate(${ring * 12 - 15}deg)`,
          }}
        />
      ))}

      {/* Orbiting movie cards */}
      {movies.map((movie, index) => (
        <ZoomedMovieCard
          key={movie._id}
          movie={movie}
          index={index}
          total={movies.length}
          color={color}
        />
      ))}

      {/* Movie count */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/30 text-sm">
        {movies.length} movies • Hover to explore
      </div>
    </div>
  );
}
