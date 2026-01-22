import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import CatalogPage from './pages/CatalogPage';
import RecommendationsPage from './pages/RecommendationsPage';
import MovieDetailPage from './pages/MovieDetailPage';
import UserProfilePage from './pages/UserProfilePage';
import AuthPage from './pages/AuthPage';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('catalog');
  const [selectedMovie, setSelectedMovie] = useState(null);

  const handleNavigate = (page) => {
    setCurrentPage(page);
    setSelectedMovie(null);
  };

  const handleSelectMovie = (movie) => {
    setSelectedMovie(movie);
    setCurrentPage('movie');
  };

  const handleBackFromMovie = () => {
    setSelectedMovie(null);
    setCurrentPage('catalog');
  };

  return (
    <div className="min-h-screen bg-[#050508]">
      {currentPage === 'catalog' && (
        <CatalogPage
          onSelectMovie={handleSelectMovie}
          onNavigate={handleNavigate}
        />
      )}

      {currentPage === 'movie' && selectedMovie && (
        <MovieDetailPage
          movie={selectedMovie}
          onBack={handleBackFromMovie}
        />
      )}

      {currentPage === 'recommendations' && (
        <RecommendationsPage onNavigate={handleNavigate} />
      )}

      {currentPage === 'profile' && (
        <UserProfilePage
          onNavigate={handleNavigate}
          onSelectMovie={handleSelectMovie}
        />
      )}

      {currentPage === 'auth' && (
        <AuthPage onNavigate={handleNavigate} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
