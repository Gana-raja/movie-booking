const express = require('express');
const router = express.Router();
const Booking = require('../models/booking');
const Movie = require('../models/movie');
const { check, validationResult } = require('express-validator');

// Admin middleware
function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden' });
  }
}

// Existing booking routes
router.get('/bookings', isAdmin, async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ orderDate: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching bookings' });
  }
});

// Movie Management Routes
const movieValidation = [
  check('title').notEmpty().withMessage('Title is required'),
  check('description').notEmpty().withMessage('Description is required'),
  check('price').isFloat({ gt: 0 }).withMessage('Price must be positive'),
  check('showtimes').custom(val=> Array.isArray(val)&& val.length>0).withMessage('At least one showtime required'),
  check('dates').custom(val=> Array.isArray(val)&& val.length>0).withMessage('At least one date required')
];

router.get('/movies', isAdmin, async (req, res) => {
  try {
    const movies = await Movie.find();
    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching movies' });
  }
});

router.post('/movies', isAdmin, movieValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const movie = new Movie(req.body);
    await movie.save();
    res.status(201).json(movie);
  } catch (err) {
    res.status(400).json({ message: 'Error creating movie' });
  }
});

// Add this route with your other movie routes
router.get('/movies/:id', isAdmin, async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    res.json(movie);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching movie' });
  }
});

router.put('/movies/:id', isAdmin, movieValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    res.json(movie);
  } catch (err) {
    res.status(400).json({ message: 'Error updating movie' });
  }
});

router.delete('/movies/:id', isAdmin, async (req, res) => {
  try {
    await Movie.findByIdAndDelete(req.params.id);
    res.json({ message: 'Movie deleted successfully' });
  } catch (err) {
    res.status(400).json({ message: 'Error deleting movie' });
  }
});

// Add this with your other booking routes
router.delete('/bookings/:id', isAdmin, async (req, res) => {
  try {
    const deletedBooking = await Booking.findByIdAndDelete(req.params.id);
    if (!deletedBooking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json({ message: 'Booking deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting booking' });
  }
});

// Add this route to delete ALL bookings
router.delete('/bookings', isAdmin, async (req, res) => {
  try {
    const result = await Booking.deleteMany({}); // Delete all documents in the Booking collection
    res.json({ 
      success: true,
      message: `Deleted ${result.deletedCount} bookings`
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete bookings',
      error: err.message 
    });
  }
});

module.exports = router;
