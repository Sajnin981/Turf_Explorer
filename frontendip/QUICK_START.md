# 🚀 Quick Start Guide

## Get Started in 3 Steps

### Step 1: Install Dependencies
```bash
npm install
```

Wait for installation to complete (may take 2-3 minutes).

### Step 2: Start the Development Server
```bash
npm start
```

The app will automatically open in your browser at `http://localhost:3000`

### Step 3: Explore the Application

## 🎯 Available Pages and Features

### 1. **Home Page** (`/`)
   - Hero section with call-to-action
   - "How It Works" explanation (3 simple steps)
   - Featured turfs preview
   - Navigation to all sections

### 2. **Browse Turfs** (`/turfs`)
   - View all available turfs
   - Filter by availability
   - Sort by price, rating, or popularity
   - Click any turf to view details

### 3. **Turf Details** (`/turf/:id`)
   - Detailed turf information
   - Facilities list
   - Location and pricing
   - Photo gallery
   - Book Now option

### 4. **Login/Register** (`/login`, `/register`)
   - User authentication pages
   - Form validation
   - Session management

### 5. **Admin Dashboard** (`/admin`)
   - View all turfs
   - Add new turfs
   - Manage system settings
   - View statistics

### 6. **Add Turf** (`/add-turf`)
   - Form to add new turf
   - Upload details and pricing
   - Set availability

### 7. **My Turfs** (`/my-turfs`)
   - View your owned turfs
   - Edit turf details
   - View bookings for your turfs
   - Approve or reject refund requests

### 8. **My Bookings** (`/my-bookings`)
   - View all your bookings
   - Pay for pending bookings
   - Cancel bookings
   - Request refunds for cancelled bookings

### 9. **Profile** (`/profile`)
   - View and edit profile information
   - Update name, phone, and address
  name: "New Turf",
  // ... other properties
  ownerEmail: "owner4@turf.com"
}
```

2. **Add owner data to OwnerDashboard.js:**
```javascript
const turfsDatabase = {
  'owner4@turf.com': {
    id: 9,
    name: 'New Turf',
    // ... turf details
  }
};

const bookingsDatabase = {
  9: [
    // bookings array
  ]
};
```

3. **Update demo accounts in OwnerLogin.js:**
```jsx
<p>📧 owner4@turf.com (New Turf)</p>
```

### Authentication Flow
```
User enters email → 
Stored in localStorage → 
OwnerDashboard reads email → 
Filters turfs by ownerEmail → 
Shows only owner's data
```



## 🏗️ Tech Stack

- **React 18** - Modern UI library
- **React Router v6** - Client-side routing
- **CSS3** - Custom styling
- **Dummy Data** - Local data for demonstration

## 📝 Development Tips

### Running the App
```bash
# Development mode with hot reload
npm start

# Build for production
npm run build

# Run tests
npm test
```

### Project Structure
```
src/
├── components/       # Reusable UI components
├── pages/           # Page-level components
├── utils/           # Helper functions and data
├── App.js           # Main app component with routes
├── App.css          # Global styles
└── index.js         # Entry point
```

### Adding New Features

1. **Add a new page:**
   - Create component in `src/pages/YourPage/`
   - Import in `App.js`
   - Add route: `<Route path="/your-page" element={<YourPage />} />`

2. **Add a new component:**
   - Create in `src/components/YourComponent/`
   - Export and import where needed

3. **Modify dummy data:**
   - Edit `src/utils/dummyData.js`

## 🎨 Customization

### Colors
The app uses CSS variables defined in `App.css`:
- Primary colors: Green (`#10b981`) and Blue (`#3b82f6`)
- Edit these in the `:root` section

### Styling
- Each component has its own CSS file
- Global styles in `App.css` and `index.css`

## ⚡ Performance

- App uses React Router for fast client-side navigation
- Images are lazy-loaded where applicable
- Production build includes minification and optimization

## 🔧 Troubleshooting

**Port 3000 already in use:**
```bash
# The app will suggest another port, or kill the process:
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:3000 | xargs kill
```

**Dependencies not installing:**
```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## 📚 Next Steps

Ready for production? Consider:
- [ ] Backend API integration
- [ ] User authentication system
- [ ] Database connection (MongoDB, PostgreSQL, etc.)
- [ ] Payment gateway integration
- [ ] Real-time booking updates
- [ ] Email/SMS notifications
- [ ] Image upload functionality
- [ ] Advanced search and filters
- [ ] User reviews and ratings
- [ ] Mobile app (React Native)

---

**Happy Coding!** 🚀 If you encounter any issues, check the README.md or raise an issue.

