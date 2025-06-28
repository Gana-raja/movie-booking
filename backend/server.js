const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
const Booking = require('./models/booking');
const { query, validationResult } = require('express-validator');
const MongoStore = require('connect-mongo');

const app = express();

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cinetix', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ MongoDB connected');
}).catch((err) => {
    console.error('❌ MongoDB connection failed:', err);
});

// ✅ Middleware
app.use(cors({
   origin: [
     "https://cinetix-gamma.vercel.app",
     "http://localhost:3000",
     "https://cinetix-n42nqad6a-ganas-projects-8509debc.vercel.app"
   ],
   credentials: true,
   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
   allowedHeaders: ["Content-Type", "Authorization"],
 }));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Enhanced session configuration with MongoStore
app.use(session({
    secret: process.env.SESSION_SECRET || 'secretkey',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/cinetix',
        ttl: 14 * 24 * 60 * 60 // = 14 days
    }),
    cookie: {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        //domain: '.vercel.app',
        maxAge: 1000 * 60 * 60 * 24 * 14 // 14 days
    }
}));

app.set('trust proxy', 1); // Trust first proxy (Vercel & Render need this)

// ✅ Route handling
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/booking'));
app.use('/api/movies', require('./routes/movies'));

const adminRoutes = require('./routes/admin');
app.use('/admin', adminRoutes);

// API endpoint to get bookings (admin only)
app.get('/api/bookings', [
    query('bookingDate').optional().matches(/^\d{2}-\d{2}-\d{4}$/)
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }

    try {
        const { bookingDate } = req.query;
        const query = bookingDate ? { bookingDate } : {};
        const bookings = await Booking.find(query).sort({ bookingDate: 1 });
        res.json(bookings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

// Get booked seats for a particular movie/showtime
app.get('/booked-seats', async (req, res) => {
    const { movie, showtime, bookingDate } = req.query;

    if (!movie || !showtime) return res.json({ bookedSeats: [] });

    try {
        const bookings = await Booking.find({ movie, showtime, bookingDate });
        const allBookedSeats = bookings.flatMap(b => b.seats);
        res.json({ bookedSeats: allBookedSeats });
    } catch (error) {
        console.error('Error fetching booked seats:', error);
        res.status(500).json({ error: 'Failed to fetch booked seats' });
    }
});

// Secure route for payment page (updated path)
app.get('/payment.html', (req, res) => {
    if (req.session.user && req.session.user.username) {
        res.sendFile(path.join(__dirname, '../public/payment.html')); // ▲ Fixed path
    } else {
        res.redirect('/login.html');
    }
});

// Serve static files from root public/ directory (updated path)
app.use(express.static(path.join(__dirname, '../public'))); // ▲ Fixed path

// Redirect root path to movie booking page (updated path)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html')); // ▲ Fixed path
});

// Error handling (optional but recommended)
app.use((req, res) => {
    res.status(404).send('Page not found');
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Server error');
});

// Vercel requires module.exports for serverless functions
module.exports = app;

// Only listen when not in Vercel environment
if (process.env.VERCEL !== '1') {
    const PORT = process.env.PORT || 10000;
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
}
