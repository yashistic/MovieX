# Movie Catalog Ingestion Service

A robust, production-grade catalog ingestion service that builds and maintains a comprehensive movie catalog from JustWatch and TMDB APIs. This service forms the foundation for a movie recommendation platform.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CATALOG INGESTION SERVICE                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────────────────────┐    │
│  │   HTTP API   │      │   Background Jobs (Cron)     │    │
│  │  (Read-Only) │      │                               │    │
│  └──────┬───────┘      └─────────┬────────────────────┘    │
│         │                         │                          │
│  ┌──────▼─────────────────────────▼──────────────────┐     │
│  │           Service Layer (Business Logic)           │     │
│  └──────┬─────────────────────────┬──────────────────┘     │
│         │                         │                          │
│  ┌──────▼─────────┐      ┌───────▼──────────┐             │
│  │  Repositories   │      │   External APIs   │             │
│  └──────┬─────────┘      └───────────────────┘             │
│         │                                                     │
│  ┌──────▼─────────────────────────────────────────────┐    │
│  │              MongoDB (Mongoose Models)              │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Features

- **Platform-First Catalog**: JustWatch defines what exists on streaming platforms
- **Metadata Enrichment**: TMDB provides comprehensive movie details
- **Idempotent Operations**: Safe to run multiple times without data corruption
- **Historical Tracking**: Availability timestamps prevent data loss
- **Scheduled Updates**: Automated catalog refresh via cron jobs
- **Read-Only API**: RESTful endpoints for querying the catalog
- **Comprehensive Filtering**: Query by genre, platform, rating, year, and more

## 📊 Data Model

### Core Entities

1. **Movie**: Central entity with metadata (title, year, ratings, etc.)
2. **Genre**: Movie categories (Action, Drama, Comedy, etc.)
3. **Platform**: Streaming services (Netflix, Prime Video, etc.)
4. **Availability**: Junction table tracking which movies are on which platforms

### Key Relationships

- Movie ← many → Genres
- Movie ← one-to-many → Availabilities
- Platform ← one-to-many → Availabilities

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB 6.0+
- TMDB API key (get from https://www.themoviedb.org/settings/api)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd catalog-ingestion-service
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env
```

4. Edit `.env` and add your configuration:
```env
MONGODB_URI=mongodb://localhost:27017/movie_catalog
TMDB_API_KEY=your_tmdb_api_key_here
```

### Running the Service

#### Option 1: Run with automatic bootstrap
```bash
# Set bootstrap flag in .env
BOOTSTRAP_ON_START=true

# Start the server
npm start
```

#### Option 2: Manual bootstrap
```bash
# Run bootstrap script first
npm run bootstrap

# Then start the server
npm start
```

#### Option 3: Bootstrap specific platforms
```bash
# Bootstrap only Netflix and Prime Video
node scripts/bootstrap.js --platforms "Netflix,Amazon Prime Video" --max-pages 30

# Then start the server
npm start
```

### Development Mode

```bash
npm run dev
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | Required |
| `TMDB_API_KEY` | TMDB API key | Required |
| `PORT` | HTTP server port | 3000 |
| `INGESTION_CRON_SCHEDULE` | Cron expression for updates | `0 */6 * * *` |
| `BOOTSTRAP_ON_START` | Run bootstrap on startup | `false` |
| `BOOTSTRAP_PLATFORMS` | Comma-separated platform names | All |
| `MAX_RETRIES` | API retry attempts | 3 |
| `LOG_LEVEL` | Logging level (error/warn/info/debug) | info |

### Cron Schedule Examples

- `0 */6 * * *` - Every 6 hours
- `0 0 * * *` - Daily at midnight
- `0 2 * * 0` - Weekly on Sunday at 2 AM
- `0 0 1 * *` - Monthly on the 1st at midnight

## 📡 API Endpoints

### Movies

```http
GET /api/movies
  ?page=1
  &limit=20
  &genres=action,thriller
  &platforms=netflix
  &minRating=7.0
  &releaseYear=2023
  &monetizationTypes=flatrate,free
  &sortBy=popularity
  &sortOrder=desc
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### Get Movie by ID

```http
GET /api/movies/:id
```

### Genres

```http
GET /api/genres
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "tmdbId": 28,
      "name": "Action",
      "slug": "action"
    }
  ]
}
```

### Movies by Genre

```http
GET /api/genres/:genreSlug/movies
  ?page=1
  &limit=20
```

### Platforms

```http
GET /api/platforms
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "justWatchId": "8",
      "name": "Netflix",
      "slug": "netflix",
      "isActive": true
    }
  ]
}
```

### Movies by Platform

```http
GET /api/platforms/:platformSlug/movies
  ?minRating=7.0
  &monetizationTypes=flatrate
  &page=1
```

### Statistics

```http
GET /api/statistics
```

**Response:**
```json
{
  "success": true,
  "data": {
    "movies": {
      "total": 15420,
      "enriched": 14850,
      "needingEnrichment": 570
    },
    "availabilities": {
      "total": 48920,
      "available": 46100,
      "unavailable": 2820,
      "byPlatform": [...]
    },
    "genres": {
      "total": 19
    },
    "platforms": {
      "total": 12,
      "active": 10
    }
  }
}
```

### Health Check

```http
GET /api/health
GET /api/health/detailed
```

## 🔄 Ingestion Pipeline

### Pipeline Stages

1. **Platform Sync**: Fetch available streaming platforms from JustWatch
2. **Genre Sync**: Fetch movie genres from TMDB
3. **Movie Ingestion**: Fetch movies from JustWatch platform-by-platform
4. **Metadata Enrichment**: Enhance movies with TMDB data

### How It Works

```javascript
// Automatic (via cron)
Every 6 hours → updateCatalog() → Refresh availability data

// Manual (via script)
npm run bootstrap → Full initialization with all stages
```

### Availability Tracking

- Movies are **never deleted**
- When a movie disappears from a platform, it's marked `isAvailable: false`
- `lastSeenAt` timestamp tracks last known availability
- `lastUnavailableAt` records when it became unavailable

## 🗂️ Project Structure

```
catalog-ingestion-service/
├── src/
│   ├── config/              # Configuration and database
│   ├── models/              # Mongoose schemas
│   ├── repositories/        # Data access layer
│   ├── services/
│   │   ├── external/        # API clients (JustWatch, TMDB)
│   │   ├── ingestion/       # Ingestion logic
│   │   └── MovieService.js  # Business logic
│   ├── jobs/                # Cron jobs
│   ├── api/
│   │   ├── routes/          # Express routes
│   │   └── controllers/     # Request handlers
│   ├── utils/               # Utilities (logger, helpers)
│   └── app.js               # Express app
├── scripts/
│   └── bootstrap.js         # Initial setup script
├── .env.example
├── package.json
└── server.js                # Entry point
```

## 🧪 Testing Locally

### 1. Check Health
```bash
curl http://localhost:3000/api/health
```

### 2. Get Statistics
```bash
curl http://localhost:3000/api/statistics
```

### 3. List Platforms
```bash
curl http://localhost:3000/api/platforms
```

### 4. Get Movies on Netflix
```bash
curl "http://localhost:3000/api/platforms/netflix/movies?limit=5"
```

### 5. Get Action Movies
```bash
curl "http://localhost:3000/api/genres/action/movies?minRating=7&limit=10"
```

### 6. Search Movies
```bash
curl "http://localhost:3000/api/movies?q=inception&minRating=8"
```

## 📈 Monitoring

### Logs

The service uses structured logging with configurable levels:

```bash
# Set log level in .env
LOG_LEVEL=debug  # error, warn, info, debug
```

### Metrics to Track

- Total movies in catalog
- Enrichment completion rate
- Availability freshness (lastSeenAt)
- Ingestion job success rate
- API response times

## 🔒 Production Considerations

### Database

- Use MongoDB replica set for high availability
- Set up proper indexes (already defined in schemas)
- Configure connection pooling (maxPoolSize in config)
- Regular backups

### Performance

- Rate limiting already implemented for external APIs
- Consider caching frequently accessed data
- Monitor MongoDB query performance
- Add Redis for caching if needed

### Security

- Use environment variables for secrets
- Implement authentication for admin endpoints
- Use HTTPS in production
- Regular security audits

### Scaling

- Horizontal scaling: Run multiple instances behind load balancer
- Vertical scaling: Increase resources for MongoDB
- Separate ingestion from API (microservices)
- Use message queues for async processing

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Failed**
```bash
# Check MongoDB is running
mongosh

# Verify connection string in .env
MONGODB_URI=mongodb://localhost:27017/movie_catalog
```

**TMDB API Errors**
```bash
# Verify API key
curl "https://api.themoviedb.org/3/genre/movie/list?api_key=YOUR_KEY"

# Check rate limits (default: 4 req/sec)
```

**JustWatch API Issues**
```bash
# JustWatch is unofficial - be gentle with requests
# Default: 2 req/sec

# If blocked, increase delays in config
JUSTWATCH_REQUESTS_PER_SECOND=1
```

**No Movies Ingested**
```bash
# Check platform names match JustWatch
# Run bootstrap with specific platforms
node scripts/bootstrap.js --platforms "Netflix" --max-pages 2
```

## 🛣️ Roadmap

### Phase 1 (Current)
- ✅ Basic catalog ingestion
- ✅ TMDB enrichment
- ✅ Read-only API
- ✅ Scheduled updates

### Phase 2 (Next)
- [ ] Add recommendation engine
- [ ] User preferences and ratings
- [ ] Social features (watchlists, reviews)
- [ ] Advanced search (full-text, filters)

### Phase 3 (Future)
- [ ] Real-time notifications
- [ ] ML-based recommendations
- [ ] Analytics dashboard
- [ ] Mobile app integration

## 📝 License

MIT

## 🤝 Contributing

This is a learning project. Feedback and suggestions are welcome!

---

**Built with ❤️ for movie lovers**