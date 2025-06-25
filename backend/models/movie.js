const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, 'Movie title is required'],
    unique: true
  },
  description: { 
    type: String, 
    required: [true, 'Description is required'] 
  },
  duration: { 
    type: String,
    required: true
  },
  genre: { 
    type: String,
    required: true
  },
  rating: String,
  posterUrl: { 
    type: String, 
    required: [true, 'Poster URL is required']
  },
  price: { 
    type: Number, 
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  showtimes: {
    type: [String],
    required: [true, 'At least one showtime is required'],
    validate: {
      validator: function(v) {
        return v.length > 0;
      },
      message: 'At least one showtime is required'
    }
  },
  dates: {
    type: [String],
    required: [true, 'At least one date is required'],
    validate: {
      validator: function(v) {
        return v.every(date => /^\d{2}-\d{2}-\d{4}$/.test(date));
      },
      message: 'Dates must be in DD-MM-YYYY format'
    }
  },
  active: { 
    type: Boolean, 
    default: true 
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Movie', movieSchema);