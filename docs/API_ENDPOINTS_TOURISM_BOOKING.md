# Tourism & Booking API Endpoints

Complete API documentation for tourism activities and accommodations endpoints.

## Base URL
```
http://localhost:3000/api
```

---

## Tourism Activities

### 1. Get All Tourism Activities
Get a paginated list of tourism activities with filters.

**Endpoint:** `GET /tourism`

**Query Parameters:**
- `location` (string, optional) - Filter by location (e.g., "Cairo", "Luxor", "Giza")
- `category` (string, optional) - Filter by category (e.g., "Historical Site", "Cruise", "Museum")
- `page` (number, optional, default: 1) - Page number
- `limit` (number, optional, default: 20, max: 100) - Items per page
- `sortBy` (string, optional, default: "rating") - Sort field
  - Supported values: `rating`, `-rating`, `price`, `-price`, `duration`, `-duration`
  - Prefix with `-` for descending order

**Example Request:**
```bash
curl "http://localhost:3000/api/tourism?location=Giza&sortBy=-rating&page=1&limit=10"
```

**Response:**
```json
{
  "data": [
    {
      "id": "...",
      "title": "Pyramids of Giza",
      "category": "Historical Site",
      "description": "...",
      "price": 120,
      "currency": "USD",
      "rating": 4.9,
      "reviewCount": 45230,
      "duration": "4 hours",
      "location": "Giza",
      "highlights": ["Great Pyramid", "Sphinx", "..."],
      "languages": ["English", "Arabic"],
      "sourceUrl": "...",
      "scrapedAt": {...}
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 13,
    "totalPages": 2,
    "hasNext": true,
    "hasPrev": false
  },
  "filters": {
    "location": "Giza",
    "category": null,
    "sortBy": "-rating"
  }
}
```

---

### 2. Get Tourism Activity by ID
Get details of a specific tourism activity.

**Endpoint:** `GET /tourism/:id`

**Example Request:**
```bash
curl "http://localhost:3000/api/tourism/aHR0cHM6..."
```

**Response:**
```json
{
  "id": "...",
  "title": "Pyramids of Giza",
  "category": "Historical Site",
  "description": "...",
  "price": 120,
  "currency": "USD",
  "rating": 4.9,
  "reviewCount": 45230,
  "duration": "4 hours",
  "location": "Giza",
  "highlights": [...],
  "languages": [...],
  "sourceUrl": "...",
  "scrapedAt": {...}
}
```

---

### 3. Search Tourism Activities
Full-text search across tourism activities.

**Endpoint:** `GET /tourism/search`

**Query Parameters:**
- `q` (string, required) - Search query
- `page` (number, optional, default: 1)
- `limit` (number, optional, default: 20, max: 100)

**Example Request:**
```bash
curl "http://localhost:3000/api/tourism/search?q=pyramid&page=1"
```

**Response:**
```json
{
  "data": [...],
  "pagination": {...},
  "query": "pyramid"
}
```

---

### 4. Get Available Locations
Get all unique locations with tourism activities.

**Endpoint:** `GET /tourism/locations/list`

**Example Request:**
```bash
curl "http://localhost:3000/api/tourism/locations/list"
```

**Response:**
```json
{
  "locations": [
    "Aswan",
    "Cairo",
    "Giza",
    "Hurghada",
    "Luxor",
    "Matrouh",
    "New Cairo"
  ],
  "count": 7
}
```

---

### 5. Get Available Categories
Get all unique activity categories.

**Endpoint:** `GET /tourism/categories/list`

**Example Request:**
```bash
curl "http://localhost:3000/api/tourism/categories/list"
```

**Response:**
```json
{
  "categories": [
    "Adventure",
    "Archaeological Site",
    "Cruise",
    "Cultural Experience",
    "Historical Site",
    "Museum",
    "Nature",
    "Water Sports"
  ],
  "count": 8
}
```

---

### 6. Get Tourism Statistics
Get aggregate statistics about tourism activities.

**Endpoint:** `GET /tourism/stats/overview`

**Example Request:**
```bash
curl "http://localhost:3000/api/tourism/stats/overview"
```

**Response:**
```json
{
  "totalActivities": 13,
  "locations": ["Giza", "Cairo", ...],
  "locationCount": 7,
  "categories": ["Historical Site", ...],
  "categoryCount": 8,
  "avgRating": "4.73",
  "priceRange": {
    "min": 25,
    "max": 300
  }
}
```

---

## Accommodations

### 1. Get All Accommodations
Get a paginated list of accommodations with filters.

**Endpoint:** `GET /accommodations`

**Query Parameters:**
- `location` (string, optional) - Filter by location
- `type` (string, optional) - Filter by accommodation type ("Hotel", "Hostel")
- `minPrice` (number, optional) - Minimum price per night
- `maxPrice` (number, optional) - Maximum price per night
- `page` (number, optional, default: 1)
- `limit` (number, optional, default: 20, max: 100)
- `sortBy` (string, optional, default: "rating") - Sort field
  - Supported: `rating`, `-rating`, `price`, `-price`, `name`, `-name`

**Example Request:**
```bash
curl "http://localhost:3000/api/accommodations?location=Cairo&type=Hotel&minPrice=100&maxPrice=300&sortBy=-rating"
```

**Response:**
```json
{
  "data": [
    {
      "id": "...",
      "name": "The Ritz-Carlton Cairo",
      "type": "Hotel",
      "description": "...",
      "pricePerNight": 350,
      "currency": "USD",
      "rating": 4.8,
      "reviewCount": 1890,
      "location": "Cairo",
      "address": "Downtown Cairo, Ramsis Street",
      "amenities": ["Spa", "Multiple pools", ...],
      "checkin": "3:00 PM",
      "checkout": "12:00 PM",
      "cancellationPolicy": "...",
      "roomTypes": ["Deluxe", "Club Room", ...],
      "sourceUrl": "booking.com",
      "source": "Booking.com",
      "scrapedAt": {...}
    }
  ],
  "pagination": {...},
  "filters": {
    "location": "Cairo",
    "type": "Hotel",
    "priceRange": {
      "min": 100,
      "max": 300
    },
    "sortBy": "-rating"
  }
}
```

---

### 2. Get Accommodation by ID
Get details of a specific accommodation.

**Endpoint:** `GET /accommodations/:id`

**Example Request:**
```bash
curl "http://localhost:3000/api/accommodations/VGhl..."
```

---

### 3. Search Accommodations
Full-text search across accommodations.

**Endpoint:** `GET /accommodations/search`

**Query Parameters:**
- `q` (string, required) - Search query
- `page` (number, optional)
- `limit` (number, optional)

**Example Request:**
```bash
curl "http://localhost:3000/api/accommodations/search?q=hilton"
```

---

### 4. Get Available Locations
Get all accommodation locations with counts.

**Endpoint:** `GET /accommodations/locations/list`

**Response:**
```json
{
  "locations": [
    { "name": "Cairo", "count": 5 },
    { "name": "Giza", "count": 2 },
    { "name": "Luxor", "count": 2 },
    { "name": "Aswan", "count": 2 },
    { "name": "Hurghada", "count": 2 },
    { "name": "Alexandria", "count": 2 },
    { "name": "Sharm El-Sheikh", "count": 2 }
  ],
  "count": 7
}
```

---

### 5. Get Accommodation Types
Get all accommodation types with counts.

**Endpoint:** `GET /accommodations/types/list`

**Response:**
```json
{
  "types": [
    { "name": "Hotel", "count": 16 },
    { "name": "Hostel", "count": 1 }
  ],
  "count": 2
}
```

---

### 6. Get Accommodation Statistics
Get aggregate statistics about accommodations.

**Endpoint:** `GET /accommodations/stats/overview`

**Response:**
```json
{
  "totalAccommodations": 17,
  "locationStats": [
    { "name": "Cairo", "count": 5 },
    ...
  ],
  "locationCount": 7,
  "typeStats": [
    { "name": "Hotel", "count": 16 },
    { "name": "Hostel", "count": 1 }
  ],
  "typeCount": 2,
  "avgRating": "4.52",
  "priceRange": {
    "min": 15,
    "max": 350
  }
}
```

---

## PM2 Production Deployment

### Install PM2
```bash
npm install -g pm2
```

### Start All Services
```bash
npm run pm2:start
```

This starts:
- **kemet-api** - Main API server (cluster mode, all CPU cores)
- **scraper-egypt** - Experience Egypt scraper (runs daily at 2 AM)
- **scraper-tourism** - Tourism activities scraper (runs every 3 days at 3 AM)
- **scraper-booking** - Booking accommodations scraper (runs every 7 days at 4 AM)

### PM2 Management Commands

```bash
# View process status
npm run pm2:status

# View logs
npm run pm2:logs

# Monitor processes
npm run pm2:monit

# Restart all
npm run pm2:restart

# Reload (zero-downtime)
npm run pm2:reload

# Stop all
npm run pm2:stop

# Delete all processes
npm run pm2:delete

# Clear logs
npm run pm2:flush
```

### Individual Process Management

```bash
# Start only API server
pm2 start ecosystem.config.js --only kemet-api

# Restart specific scraper
pm2 restart scraper-tourism

# View logs for specific process
pm2 logs kemet-api

# View logs for scraper
pm2 logs scraper-egypt --lines 100
```

---

## Data Collections (Firestore)

### Collections:
1. **tourism_activities_egypt** - 13 tourism activities
2. **booking_accommodations_egypt** - 17 accommodations
3. **experienceegypt_pages** - 500 pages from experienceegypt.eg

### Coverage:
- **Tourism**: 7 cities, 8 categories
- **Accommodations**: 7 cities, 2 types (Hotel, Hostel)
- **Price Range**: $15 - $350 per night

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message here"
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad request (missing/invalid parameters)
- `404` - Resource not found
- `500` - Internal server error
