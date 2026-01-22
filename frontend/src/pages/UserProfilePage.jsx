import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, User, Heart, Clock, Star, Settings, LogOut, Loader, Trash2,
  Edit2, X, Check, Calendar, Mail, Shield, Key, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';

export default function UserProfilePage({ onNavigate, onSelectMovie }) {
  const { user, isAuthenticated, logout, updateProfile, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState('favorites');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ favorites: 0, watchlist: 0, watched: 0 });
  const [favorites, setFavorites] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [watched, setWatched] = useState([]);

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Change password state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!isAuthenticated) {
      onNavigate('auth');
    }
  }, [isAuthenticated, onNavigate]);

  // Initialize edit name when user loads
  useEffect(() => {
    if (user?.name) {
      setEditName(user.name);
    }
  }, [user?.name]);

  // Fetch user stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!isAuthenticated) return;
      try {
        const response = await userService.getStats();
        if (response.success) {
          setStats(response.data.stats);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    fetchStats();
  }, [isAuthenticated]);

  // Fetch data when tab changes
  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated) return;
      setLoading(true);

      try {
        let response;
        switch (activeTab) {
          case 'favorites':
            response = await userService.getFavorites();
            if (response.success) setFavorites(response.data.favorites || []);
            break;
          case 'watchlist':
            response = await userService.getWatchlist();
            if (response.success) setWatchlist(response.data.watchlist || []);
            break;
          case 'watched':
            response = await userService.getWatched();
            if (response.success) setWatched(response.data.watched || []);
            break;
          default:
            break;
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab !== 'settings') {
      fetchData();
    }
  }, [activeTab, isAuthenticated]);

  const handleLogout = async () => {
    await logout();
    onNavigate('catalog');
  };

  const handleRemoveFromFavorites = async (movieId) => {
    try {
      await userService.removeFromFavorites(movieId);
      setFavorites(prev => prev.filter(m => m._id !== movieId));
      setStats(prev => ({ ...prev, favorites: prev.favorites - 1 }));
    } catch (error) {
      console.error('Error removing from favorites:', error);
    }
  };

  const handleRemoveFromWatchlist = async (movieId) => {
    try {
      await userService.removeFromWatchlist(movieId);
      setWatchlist(prev => prev.filter(m => m._id !== movieId));
      setStats(prev => ({ ...prev, watchlist: prev.watchlist - 1 }));
    } catch (error) {
      console.error('Error removing from watchlist:', error);
    }
  };

  const handleRemoveFromWatched = async (movieId) => {
    try {
      await userService.removeFromWatched(movieId);
      setWatched(prev => prev.filter(w => w.movie._id !== movieId));
      setStats(prev => ({ ...prev, watched: prev.watched - 1 }));
    } catch (error) {
      console.error('Error removing from watched:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      setEditError('Name is required');
      return;
    }
    if (editName.trim().length < 2) {
      setEditError('Name must be at least 2 characters');
      return;
    }

    setEditLoading(true);
    setEditError('');

    const result = await updateProfile({ name: editName.trim() });

    if (result.success) {
      setIsEditing(false);
    } else {
      setEditError(result.error || 'Failed to update profile');
    }

    setEditLoading(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName(user?.name || '');
    setEditError('');
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      setPasswordError('Password must contain uppercase, lowercase, and numbers');
      return;
    }

    setPasswordLoading(true);

    const result = await changePassword(currentPassword, newPassword);

    if (result.success) {
      setPasswordSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChangingPassword(false);
    } else {
      setPasswordError(result.error || 'Failed to change password');
    }

    setPasswordLoading(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    }
    const years = Math.floor(diffDays / 365);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  };

  const tabs = [
    { id: 'favorites', label: 'Favorites', icon: Heart, count: stats.favorites },
    { id: 'watchlist', label: 'Watchlist', icon: Clock, count: stats.watchlist },
    { id: 'watched', label: 'Watched', icon: Star, count: stats.watched },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const MovieCard = ({ movie, onRemove }) => (
    <div className="group relative bg-white/5 border border-white/10 rounded-lg overflow-hidden hover:border-white/20 transition-all">
      <div
        className="cursor-pointer"
        onClick={() => onSelectMovie && onSelectMovie(movie)}
      >
        {movie.posterPath ? (
          <img
            src={`https://image.tmdb.org/t/p/w300${movie.posterPath}`}
            alt={movie.title}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-white/5 flex items-center justify-center">
            <span className="text-white/20 text-sm">No Poster</span>
          </div>
        )}
        <div className="p-3">
          <h4 className="text-white font-medium text-sm truncate">{movie.title}</h4>
          <p className="text-white/40 text-xs">
            {movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 'N/A'}
            {movie.voteAverage && ` • ${movie.voteAverage.toFixed(1)}`}
          </p>
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(movie._id);
        }}
        className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-white/60 opacity-0 group-hover:opacity-100 hover:bg-red-500/80 hover:text-white transition-all"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#050508] relative overflow-hidden">
      {/* Background stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(40)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              opacity: Math.random() * 0.5 + 0.1,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10">
        <div className="container mx-auto px-6 py-6">
          <button
            onClick={() => onNavigate('catalog')}
            className="flex items-center gap-2 text-white/60 hover:text-white/90 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back to Explore</span>
          </button>
        </div>
      </div>

      {/* Profile Section */}
      <div className="relative z-10 container mx-auto px-6">
        {/* Profile Header */}
        <div className="flex flex-col items-center mb-12">
          {/* Avatar */}
          <div className="relative mb-6">
            <div
              className="w-32 h-32 rounded-full flex items-center justify-center"
              style={{
                background: 'radial-gradient(circle at 30% 30%, #818cf8 0%, #6366f1 60%)',
                boxShadow: '0 0 40px rgba(99, 102, 241, 0.4), inset -8px -8px 20px rgba(0,0,0,0.3)',
              }}
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-16 h-16 text-white/80" />
              )}
            </div>
            {/* Glow effect */}
            <div
              className="absolute inset-0 rounded-full opacity-30"
              style={{
                background: 'radial-gradient(circle, #818cf8 0%, transparent 70%)',
                transform: 'scale(1.5)',
                filter: 'blur(20px)',
              }}
            />
          </div>

          {/* User Info */}
          {isEditing ? (
            <div className="flex flex-col items-center gap-3 mb-6">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="text-2xl font-semibold text-white text-center bg-white/5 border border-white/20 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                placeholder="Your name"
              />
              {editError && (
                <p className="text-red-400 text-sm">{editError}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleSaveProfile}
                  disabled={editLoading}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-400 text-white text-sm transition-colors disabled:opacity-50"
                >
                  {editLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-semibold text-white">{user.name}</h1>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors"
                  title="Edit profile"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-white/40 text-sm mb-6">{user.email}</p>
            </>
          )}

          {/* Stats */}
          <div className="flex gap-8">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{stats.favorites}</p>
              <p className="text-white/40 text-xs uppercase tracking-wider">Favorites</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{stats.watchlist}</p>
              <p className="text-white/40 text-xs uppercase tracking-wider">Watchlist</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{stats.watched}</p>
              <p className="text-white/40 text-xs uppercase tracking-wider">Watched</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all ${
                  activeTab === tab.id
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                    : 'text-white/50 hover:text-white/70 hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="text-xs opacity-60">({tab.count})</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="max-w-4xl mx-auto pb-12">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : (
            <>
              {activeTab === 'favorites' && (
                favorites.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {favorites.map((movie) => (
                      <MovieCard
                        key={movie._id}
                        movie={movie}
                        onRemove={handleRemoveFromFavorites}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Heart className="w-16 h-16 text-white/20 mx-auto mb-4" />
                    <p className="text-white/40 mb-2">Your favorite movies will appear here</p>
                    <p className="text-white/20 text-sm">Start exploring and heart the movies you love</p>
                  </div>
                )
              )}

              {activeTab === 'watchlist' && (
                watchlist.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {watchlist.map((movie) => (
                      <MovieCard
                        key={movie._id}
                        movie={movie}
                        onRemove={handleRemoveFromWatchlist}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Clock className="w-16 h-16 text-white/20 mx-auto mb-4" />
                    <p className="text-white/40 mb-2">Your watchlist is empty</p>
                    <p className="text-white/20 text-sm">Add movies you want to watch later</p>
                  </div>
                )
              )}

              {activeTab === 'watched' && (
                watched.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {watched.map((item) => (
                      <MovieCard
                        key={item.movie._id}
                        movie={item.movie}
                        onRemove={handleRemoveFromWatched}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Star className="w-16 h-16 text-white/20 mx-auto mb-4" />
                    <p className="text-white/40 mb-2">No watched movies yet</p>
                    <p className="text-white/20 text-sm">Mark movies as watched to track your viewing history</p>
                  </div>
                )
              )}

              {activeTab === 'settings' && (
                <div className="space-y-4 max-w-md mx-auto">
                  {/* Account Info */}
                  <div className="p-5 rounded-lg bg-white/5 border border-white/10">
                    <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                      <User className="w-4 h-4 text-indigo-400" />
                      Account Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-white/40 text-sm">Name</span>
                        <span className="text-white text-sm">{user.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/40 text-sm flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5" />
                          Email
                        </span>
                        <span className="text-white text-sm">{user.email}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/40 text-sm flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5" />
                          Role
                        </span>
                        <span className="text-white text-sm capitalize">{user.role || 'User'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Member Since */}
                  <div className="p-5 rounded-lg bg-white/5 border border-white/10">
                    <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-400" />
                      Membership
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-white/40 text-sm">Member since</span>
                        <span className="text-white text-sm">{formatDate(user.createdAt)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/40 text-sm">Account age</span>
                        <span className="text-white text-sm">{formatRelativeTime(user.createdAt)}</span>
                      </div>
                      {user.lastLogin && (
                        <div className="flex items-center justify-between">
                          <span className="text-white/40 text-sm">Last login</span>
                          <span className="text-white text-sm">{formatRelativeTime(user.lastLogin)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Edit Account Button */}
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setActiveTab('favorites');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Account
                  </button>

                  {/* Change Password */}
                  <div className="p-5 rounded-lg bg-white/5 border border-white/10">
                    <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                      <Key className="w-4 h-4 text-indigo-400" />
                      Security
                    </h3>

                    {!isChangingPassword ? (
                      <button
                        onClick={() => setIsChangingPassword(true)}
                        className="w-full py-2 px-4 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-colors text-sm"
                      >
                        Change Password
                      </button>
                    ) : (
                      <div className="space-y-3">
                        {passwordError && (
                          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-400" />
                            <p className="text-red-400 text-sm">{passwordError}</p>
                          </div>
                        )}
                        {passwordSuccess && (
                          <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-400" />
                            <p className="text-green-400 text-sm">{passwordSuccess}</p>
                          </div>
                        )}
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Current password"
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="New password"
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleChangePassword}
                            disabled={passwordLoading}
                            className="flex-1 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {passwordLoading && <Loader className="w-4 h-4 animate-spin" />}
                            Change Password
                          </button>
                          <button
                            onClick={() => {
                              setIsChangingPassword(false);
                              setCurrentPassword('');
                              setNewPassword('');
                              setConfirmPassword('');
                              setPasswordError('');
                            }}
                            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sign Out */}
                  <button
                    onClick={handleLogout}
                    className="w-full p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
