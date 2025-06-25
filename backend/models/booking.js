const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  username: String,
  movie: String,
  price: Number,
  seats: [String],
  showtime: String,
  total: Number,
  bookingId: String,
  paymentMethod: String,
  bookingDate:{
    type: String,
    required: [true, 'Booking date is required'],
    validate: {
      validator: function(v){
        return /^\d{2}-\d{2}-\d{4}$/.test(v);
      },
      message:props=> `${props.value} is not a valid DD-MM-YYYY date!`
    }
  },
  orderDate:{
    type: Date,
    default: Date.now
  },
  qrText: String
});

module.exports = mongoose.model('Booking', bookingSchema);
