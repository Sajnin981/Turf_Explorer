# Turf Explorer

A modern, responsive React-based turf booking system for finding and booking football and cricket turfs near you.

## Features

- **Easy Browsing**: Browse and filter turfs by price and availability
- **User-Friendly Interface**: Clean, modern design with green/blue theme
- **Complete Booking System**: Browse turfs, view details, select time slots, and book instantly
- **Admin Dashboard**: Manage turfs, bookings, and view analytics
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **React 18** - Modern UI framework
- **React Router** - Client-side routing
- **CSS3** - Modern styling with CSS variables, Grid, Flexbox
- **Axios** - API client for backend integration

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```
   
   The app will open automatically at `http://localhost:3000`

3. **Build for Production**
   ```bash
   npm run build
   ```

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm test` - Runs the test suite
- `npm run eject` - Ejects from Create React App (one-way operation)

## Project Structure

```
frontendip/
├── public/
│   └── index.html          # HTML template
├── src/
│   ├── components/
│   │   ├── Header/         # Navigation header
│   │   ├── Footer/         # Page footer
│   │   └── TurfCard/       # Turf display card
│   ├── pages/
│   │   ├── Home/           # Landing page
│   │   ├── TurfListing/    # Browse turfs
│   │   ├── TurfDetails/    # Individual turf details
│   │   ├── Login/          # User login
│   │   ├── Register/       # User registration
│   │   ├── AdminDashboard/ # Admin panel
│   │   ├── AddTurf/        # Add new turf
│   │   ├── MyTurfs/        # User's turfs
│   │   ├── MyBookings/     # User's bookings
│   │   └── Profile/        # User profile
│   ├── App.js              # Main app component
│   ├── App.css             # Global styles
│   └── index.js            # Entry point
├── package.json
└── README.md
```


## Features Implemented

### User Features
- ✅ Browse all available turfs
- ✅ Filter and sort turfs by type, price, and availability
- ✅ View detailed turf information
- ✅ Select date and time slots for booking
- ✅ User authentication (login/register)
- ✅ Submit your own turf for approval
- ✅ Manage your bookings (view, pay, cancel, request refunds)
- ✅ Edit user profile information
- ✅ Responsive design for mobile and desktop

### Admin Features
- ✅ Admin dashboard with statistics
- ✅ Approve or decline pending turfs
- ✅ Manage and delete turfs
- ✅ View all bookings across the platform
- ✅ Monitor system activity

### Turf Owner Features
- ✅ Add new turfs for admin approval
- ✅ Edit turf details (name, location, price, description)
- ✅ View bookings for your turfs
- ✅ Approve or reject refund requests
- ✅ Track turf performance (bookings, revenue)

## Color Scheme

- Primary Green: `#10b981`
- Primary Blue: `#3b82f6`
- Dark shades for depth and contrast
- Light backgrounds for readability
- Clean, modern, minimalist design

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Notes

- This frontend is integrated with the backend API under backendip
- Configure backend URL from frontend service configuration if needed
- Authentication state is stored in localStorage for session persistence

## Future Enhancements

- Real database for persistent storage
- Real-time availability updates
- User profile and booking history
- Map integration for turf locations
- User reviews system
- Email/SMS notifications for bookings

## License

MIT License - Feel free to use and modify!

---

**Turf Explorer** - Find and book your perfect turf in seconds! ⚽🏏

