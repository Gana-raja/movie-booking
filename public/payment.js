// ===== LOADER CONTROL =====
function showLoader() {
  document.getElementById('global-loader').style.display = 'flex';
}

function hideLoader() {
  document.getElementById('global-loader').style.display = 'none';
}


document.addEventListener('DOMContentLoaded', function () {
  const bookingDetails = JSON.parse(localStorage.getItem('bookingDetails'));
  if (!bookingDetails) {
    alert('No booking details found. Please select a movie and seats first.');
    window.location.href = 'movie_booking.html';
    return;
  }

  displayBookingSummary(bookingDetails);
  setupPaymentFormHandlers();

  document.getElementById('pay-button').addEventListener('click', processPayment);
});

function displayBookingSummary(booking) {
  document.getElementById('movie-details').innerHTML = `
    <p><strong>Movie:</strong> ${booking.movie}</p>
    <p><strong>Date:</strong> ${booking.bookingDate}</p>
    <p><strong>Showtime:</strong> ${booking.showtime}</p>
    <p><strong>Price per ticket:</strong> Rs.${booking.price}</p>`;

  document.getElementById('seat-details').innerHTML = `
    <p><strong>Selected Seats:</strong> ${booking.seats.join(', ')}</p>
    <p><strong>Number of Seats:</strong> ${booking.seats.length}</p>`;

  document.getElementById('total-amount').textContent = booking.total;
}

function setupPaymentFormHandlers() {
  const paymentOptions = document.querySelectorAll('input[name="payment"]');
  paymentOptions.forEach(option => {
    option.addEventListener('change', function () {
      if (this.value === 'paypal') {
        document.getElementById('credit-card-form').style.display = 'none';
        generatePaypalQR();
      } else {
        document.getElementById('credit-card-form').style.display = 'block';
        document.getElementById('paypal-qr-section').style.display = 'none';
      }
    });
  });

  document.getElementById('card-number').addEventListener('input', function (e) {
    let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const formatted = value.replace(/\d{4}(?=.)/g, '$& ');
    e.target.value = formatted.substring(0, 19);
  });

  document.getElementById('expiry').addEventListener('input', function (e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    e.target.value = value;
  });

  document.getElementById('cvv').addEventListener('input', function (e) {
    e.target.value = e.target.value.replace(/\D/g, '').substring(0, 3);
  });
}

function processPayment() {
  const paymentMethod = document.querySelector('input[name="payment"]:checked').value;

  if (paymentMethod === 'credit') {
    const cardNumber = document.getElementById('card-number').value;
    const expiry = document.getElementById('expiry').value;
    const cvv = document.getElementById('cvv').value;
    const name = document.getElementById('name').value;

    if (!validatePaymentForm(cardNumber, expiry, cvv, name)) return;
  }

  const payButton = document.getElementById('pay-button');
  payButton.textContent = 'Processing...';
  payButton.disabled = true;

  setTimeout(() => {
    const bookingDetails = JSON.parse(localStorage.getItem('bookingDetails'));
    const bookingId = generateBookingId();
    const confirmationDetails = {
      ...bookingDetails,
      bookingId,
      paymentMethod
    };

    localStorage.setItem('confirmationDetails', JSON.stringify(confirmationDetails));
    //send booking to server
    fetch('https://cinetix-backend.onrender.com/confirm-booking',{
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        credentials:'include',
        body: JSON.stringify(confirmationDetails)
    })
    .then(res=>res.json())
    .then(data=>{
        console.log("Server response:",data);//debug
        if(data.success){
            window.location.href='confirmation.html';
        } else{
            alert('Booking failed. Please try again.');
            payButton.textContent='Pay Now';
            payButton.disabled=false;
        }
    })
    .catch(err=>{
        console.error('Booking error:',err);
        alert('Server error during booking.');
        payButton.textContent='Pay Now';
        payButton.disabled=false;
    });
  }, 2000);
}

function validatePaymentForm(cardNumber, expiry, cvv, name) {
  if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16) {
    alert('Please enter a valid card number');
    return false;
  }
  if (!expiry || !expiry.includes('/')) {
    alert('Please enter a valid expiry date (MM/YY)');
    return false;
  }
  if (!cvv || cvv.length < 3) {
    alert('Please enter a valid CVV code');
    return false;
  }
  if (!name || name.trim().length < 3) {
    alert('Please enter the name as shown on your card');
    return false;
  }
  return true;
}

function generateBookingId() {
  const timestamp = new Date().getTime().toString().slice(-6);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `BK${timestamp}${random}`;
}

function generatePaypalQR() {
  const bookingDetails = JSON.parse(localStorage.getItem('bookingDetails'));
  const amount = bookingDetails?.total || '0';
  const paypalLink = `https://www.paypal.me/ganarajaabhiram/${amount}`;

  document.getElementById('paypal-amount').textContent = amount;

  const qrContainer = document.getElementById('paypal-qr-code');
  qrContainer.innerHTML = "";

  const canvas = document.createElement('canvas');
  qrContainer.appendChild(canvas);

  const size=window.innerWidth<480?150:200;

  QRCode.toCanvas(canvas, paypalLink, {
    width: size,
    color: {
      dark: '#000',
      light: '#fff'
    }
  }, function (error) {
    if (error) console.error("QR generation failed:", error);
  });

  document.getElementById('paypal-qr-section').style.display = 'block';
}