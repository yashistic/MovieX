import React, { useState, useEffect } from 'react';
import MovieCard from '../components/MovieCard';
import PlanetaryView from '../components/planetary/PlanetaryView';
import { Search, Loader, ChevronDown, ArrowLeft } from 'lucide-react';
import movieService from '../services/movieService';

export default function CatalogPage({ theme }) {
  const [viewMode, setViewMode] = useState('planetary'); // 'planetary' or 'grid'
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');

  const MOVIES_PER_PAGE = 40;

  // Handle genre selection from planetary view
  const handleSelectGenre = (genre) => {
    setSelectedGenre(genre.name);
    setViewMode('grid');
    fetchMoviesForGenre(genre.name);
  };

  // Fetch movies for selected genre
  const fetchMoviesForGenre = async (genreName) => {
    try {
      setLoading(true);
      setError(null);

      const [moviesData, genresData, platformsData] = await Promise.all([
        movieService.getMoviesByGenre(genreName, { limit: MOVIES_PER_PAGE, page: 1 }),
        movieService.getGenres(),
        movieService.getPlatforms(),
      ]);

      setMovies(moviesData.data || []);
      setPagination(moviesData.pagination || { page: 1, pages: 1, total: 0 });
      setGenres(genresData.data || []);
      setPlatforms(platformsData.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load movies.');
    } finally {
      setLoading(false);
    }
  };

  // Return to planetary view
  const handleBackToPlanetary = () => {
    setViewMode('planetary');
    setSelectedGenre('all');
    setMovies([]);
  };

  // Fetch initial data for grid view
  useEffect(() => {
    if (viewMode === 'grid' && movies.length === 0 && selectedGenre === 'all') {
      fetchInitialData();
    }
  }, [viewMode]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch movies, genres, and platforms in parallel
      const [moviesData, genresData, platformsData] = await Promise.all([
        movieService.getMovies({ limit: MOVIES_PER_PAGE, page: 1 }),
        movieService.getGenres(),
        movieService.getPlatforms(),
      ]);

      setMovies(moviesData.data || []);
      setPagination(moviesData.pagination || { page: 1, pages: 1, total: 0 });
      setGenres(genresData.data || []);
      setPlatforms(platformsData.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load movies. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreMovies = async () => {
    if (loadingMore || pagination.page >= pagination.pages) return;

    try {
      setLoadingMore(true);
      const nextPage = pagination.page + 1;

      // Use genre-specific endpoint if a genre is selected
      const moviesData = selectedGenre !== 'all'
        ? await movieService.getMoviesByGenre(selectedGenre, { limit: MOVIES_PER_PAGE, page: nextPage })
        : await movieService.getMovies({ limit: MOVIES_PER_PAGE, page: nextPage });

      setMovies(prev => [...prev, ...(moviesData.data || [])]);
      setPagination(moviesData.pagination || pagination);
    } catch (err) {
      console.error('Error loading more movies:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Filter movies based on search and filters
  const filteredMovies = movies.filter(movie => {
    const matchesSearch = movie.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = selectedGenre === 'all' || 
      movie.genres?.some(g => g.name === selectedGenre);
    const matchesPlatform = selectedPlatform === 'all' || 
      movie.platforms?.some(p => p.name === selectedPlatform);
    const matchesYear = selectedYear === 'all' || 
      movie.releaseDate?.startsWith(selectedYear);

    return matchesSearch && matchesGenre && matchesPlatform && matchesYear;
  });

  const isDark = theme === 'retro';

  // Show planetary view
  if (viewMode === 'planetary') {
    return <PlanetaryView onSelectGenre={handleSelectGenre} theme={theme} />;
  }

  // Grid view loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-indigo-500" />
          <p className="text-white/50">Loading movies...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <p className="text-lg mb-4 text-red-400">{error}</p>
          <button
            onClick={() => fetchMoviesForGenre(selectedGenre)}
            className="px-6 py-2 rounded bg-indigo-500 text-white hover:bg-indigo-400"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-8">
      <div className="container mx-auto px-4">
        {/* Back button and genre title */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={handleBackToPlanetary}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
          >
            <ArrowLeft className="w-5 h-5 text-white/60" />
          </button>
          <h1 className="text-3xl font-light text-white tracking-wide">
            {selectedGenre !== 'all' ? selectedGenre : 'All Movies'}
          </h1>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Search movies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={selectedGenre}
              onChange={(e) => {
                setSelectedGenre(e.target.value);
                if (e.target.value !== 'all') {
                  fetchMoviesForGenre(e.target.value);
                } else {
                  fetchInitialData();
                }
              }}
              className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="all">All Genres</option>
              {genres.map((genre) => (
                <option key={genre._id} value={genre.name}>
                  {genre.name}
                </option>
              ))}
            </select>

            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="all">All Platforms</option>
              {platforms.map((platform) => (
                <option key={platform._id} value={platform.name}>
                  {platform.name}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="all">All Years</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
            </select>
          </div>
        </div>

        {/* Movies Grid */}
        {filteredMovies.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMovies.map((movie) => (
              <MovieCard key={movie._id} movie={movie} theme="retro" />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-white/40">
              No movies found matching your criteria
            </p>
          </div>
        )}

        {/* Load More Button */}
        {pagination.page < pagination.pages && (
          <div className="flex justify-center mt-8">
            <button
              onClick={loadMoreMovies}
              disabled={loadingMore}
              className="flex items-center gap-2 px-8 py-3 rounded-lg font-medium transition-all bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              {loadingMore ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <ChevronDown className="w-5 h-5" />
                  Load More Movies
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
