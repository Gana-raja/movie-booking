// routes/booking.js
const express = require('express');
const router = express.Router();
const Booking = require('../models/booking');
const {check} = require('express-validator');

const validateBooking=[
  check('bookingDate')
    .matches(/^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/)
    .withMessage('Date must be in DD-MM-YYYY format'),
  check('seats').isArray({min:1}),
  check('total').isNumeric()
];

// Get booked seats for a specific movie and showtime
router.get('/booked-seats', async (req, res) => {
  const { movie, showtime, bookingDate } = req.query;

  try {
    const bookings = await Booking.find({ movie, showtime, bookingDate });
    const bookedSeats = bookings.flatMap(b => b.seats);
    res.status(200).json({ bookedSeats });
  } catch (err) {
    console.error('❌ Error fetching booked seats:', err);
    res.status(500).json({ error: 'Failed to fetch booked seats' });
  }
});


router.post('/confirm-booking', async (req, res) => {
  if (!req.session.user || !req.session.user.username) {
    return res.status(401).json({success:false, error: 'Not logged in' });
  }

  try {
    const qrText = `MOVIE: ${req.body.movie}\nDATE: ${req.body.bookingDate}\nTIME: ${req.body.showtime}\nSEATS: ${req.body.seats.join(', ')}\nID: ${req.body.bookingId}`;

    const bookingData = {
      ...req.body,
      username: req.session.user.username,
      qrText
    };

    const booking = new Booking(bookingData);
    await booking.save();

    res.status(200).json({success:true, message: 'Booking confirmed successfully', qrText });
  } catch (err) {
    console.error('❌ Booking error:', err);
    res.status(500).json({success:false, error: 'Failed to save booking' });
  }
});

// New endpoint: Get bookings by date
router.get('/by-date/:bookingDate', async (req, res) => {
  try {
    const bookings = await Booking.find({ bookingDate: req.params.bookingDate });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// My Bookings Endpoint
router.get('/my-bookings', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not logged in' });
    }
    
    try {
        const bookings = await Booking.find({ username: req.session.user.username })
            .sort({ orderDate: -1 }); // Newest first
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

module.exports = router;
