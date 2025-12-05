# Quick Start - Tourism & Booking APIs

## Prerequisites
- Node.js 18+ installed
- Firebase project set up with Firestore
- Firebase service account JSON
- Environment variables configured

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create `.env` file:
```env
# Firebase
FIREBASE_SERVICE_ACCOUNT_PATH=./form-app-8c22f-firebase-adminsdk-fbsvc-821f5e11c5.json
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Server
PORT=3000
NODE_ENV=development

# Shouf API (optional)
SHOUF_API_BASE=https://shouf-eg.com
```

### 3. Run Data Scrapers (First Time)
```bash
# Scrape tourism activities (13 activities)
npm run scrape:tourism

# Scrape accommodations (17 properties)
npm run scrape:booking

# Scrape experienceegypt.eg (500 pages - optional)
npm run scrape:egypt
```

### 4. Build the Project
```bash
npm run build
```

### 5. Start Development Server
```bash
npm run dev
```

## Testing the APIs

### Tourism Activities
```bash
# Get all activities
curl http://localhost:3000/api/tourism

# Filter by location
curl "http://localhost:3000/api/tourism?location=Giza"

# Filter by category
curl "http://localhost:3000/api/tourism?category=Historical%20Site"

# Sort by price descending
curl "http://localhost:3000/api/tourism?sortBy=-price"

# Search activities
curl "http://localhost:3000/api/tourism/search?q=pyramid"

# Get locations
curl http://localhost:3000/api/tourism/locations/list

# Get categories
curl http://localhost:3000/api/tourism/categories/list

# Get statistics
curl http://localhost:3000/api/tourism/stats/overview
```

### Accommodations
```bash
# Get all accommodations
curl http://localhost:3000/api/accommodations

# Filter by location
curl "http://localhost:3000/api/accommodations?location=Cairo"

# Filter by type
curl "http://localhost:3000/api/accommodations?type=Hotel"

# Filter by price range
curl "http://localhost:3000/api/accommodations?minPrice=100&maxPrice=200"

# Sort by rating descending
curl "http://localhost:3000/api/accommodations?sortBy=-rating"

# Search accommodations
curl "http://localhost:3000/api/accommodations/search?q=hilton"

# Get locations with counts
curl http://localhost:3000/api/accommodations/locations/list

# Get types with counts
curl http://localhost:3000/api/accommodations/types/list

# Get statistics
curl http://localhost:3000/api/accommodations/stats/overview
```

## Production Deployment with PM2

### 1. Install PM2 Globally
```bash
npm install -g pm2
```

### 2. Build for Production
```bash
npm run build
```

### 3. Start All Services
```bash
npm run pm2:start
```

This starts:
- API server (cluster mode on all CPU cores)
- Tourism scraper (scheduled: every 3 days at 3 AM)
- Booking scraper (scheduled: every 7 days at 4 AM)
- ExperienceEgypt scraper (scheduled: daily at 2 AM)

### 4. Monitor Services
```bash
# View process status
npm run pm2:status

# View live logs
npm run pm2:logs

# Real-time monitoring
npm run pm2:monit
```

### 5. Manage Services
```bash
# Restart all
npm run pm2:restart

# Reload (zero-downtime)
npm run pm2:reload

# Stop all
npm run pm2:stop

# Delete all processes
npm run pm2:delete
```

### 6. View Specific Logs
```bash
# API server logs
pm2 logs kemet-api

# Tourism scraper logs
pm2 logs scraper-tourism

# Booking scraper logs
pm2 logs scraper-booking

# All logs with 100 lines
pm2 logs --lines 100
```

### 7. PM2 Startup Script (Auto-restart on server reboot)
```bash
# Generate startup script
pm2 startup

# Save current process list
pm2 save
```

## Available Data

### Tourism Activities (13 items)
**Locations:**
- Giza (Pyramids)
- Cairo (Egyptian Museum, Islamic Cairo)
- Luxor (Temples, Valley of the Kings, Hot Air Balloon)
- Hurghada (Red Sea Diving)
- Aswan (Temples, Nile Cruise)
- New Cairo (Desert Safari)
- Matrouh (Siwa Oasis)

**Categories:**
- Historical Site
- Museum
- Cruise
- Adventure
- Water Sports
- Archaeological Site
- Cultural Experience
- Nature

### Accommodations (17 items)
**Locations:**
- Cairo (5 properties: Marriott, Hilton, Ritz-Carlton, Sonesta, Safari Hostel)
- Giza (2 properties: Mena House, Le Meridien)
- Luxor (2 properties: Sofitel Winter Palace, Karnak Hotel)
- Aswan (2 properties: Sofitel Legend Old Cataract, Movenpick Resort)
- Hurghada (2 properties: Hilton Resort, Stella Makadi)
- Alexandria (2 properties: Steigenberger Cecil, Radisson Blu)
- Sharm El-Sheikh (2 properties: Ras Nssrani Resort, Hilton Watania)

**Price Range:** $15/night (budget) to $350/night (luxury)

## Troubleshooting

### Firestore Connection Issues
```bash
# Verify Firebase credentials
echo $FIREBASE_PROJECT_ID

# Test connection
npm run scrape:tourism
```

### Port Already in Use
```bash
# Change PORT in .env
PORT=3001
```

### PM2 Process Not Starting
```bash
# Check logs
pm2 logs kemet-api --err

# Rebuild and restart
npm run build
pm2 restart kemet-api
```

### Scraper Not Running on Schedule
```bash
# Check PM2 cron configuration
pm2 describe scraper-tourism

# Manually trigger scraper
pm2 restart scraper-tourism
```

## Next Steps

1. **Add More Data**: Run scrapers to populate more tourism activities and accommodations
2. **Integrate Frontend**: Use the API endpoints in your React/Vue/Angular app
3. **Add Authentication**: Protect endpoints with JWT authentication
4. **Rate Limiting**: Configure rate limits for public APIs
5. **Monitoring**: Set up PM2 Plus or other monitoring solutions
6. **CI/CD**: Automate deployment with GitHub Actions

## Support

For detailed API documentation, see: `docs/API_ENDPOINTS_TOURISM_BOOKING.md`

For PM2 configuration details, see: `ecosystem.config.js`
