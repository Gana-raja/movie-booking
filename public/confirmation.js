// confirmation.js - Handles ticket confirmation and display

// ===== LOADER CONTROL =====
function showLoader() {
  document.getElementById('global-loader').style.display = 'flex';
}

function hideLoader() {
  document.getElementById('global-loader').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function() {
    // Retrieve confirmation details from localStorage
    const confirmationDetails = JSON.parse(localStorage.getItem('confirmationDetails'));
    
    if (!confirmationDetails) {
        // Redirect back to booking page if no details found
        alert('No booking details found. Please complete the booking process first.');
        window.location.href = 'movie_booking.html';
        return;
    }
    
    // Display the ticket information
    displayTicketInformation(confirmationDetails);
    
    // Generate QR code with full ticket info
    generateQRCode(confirmationDetails);
    
    // Set up button actions
    setupButtonActions(confirmationDetails);
});

// Display the ticket information on the page
function displayTicketInformation(details) {
    document.getElementById('movie-name').textContent = details.movie;
    document.getElementById('movie-time').textContent = details.showtime;
    
    document.getElementById('movie-date').textContent = details.bookingDate;
    
    document.getElementById('seat-numbers').textContent = details.seats.join(', ');
    document.getElementById('booking-id').textContent = details.bookingId;
}

// Generate a QR code with full booking information
function generateQRCode(details) {
    const qrCodeDiv = document.getElementById('qr-code');
    qrCodeDiv.innerHTML = "";

    const movieDate = document.getElementById('movie-date').textContent;

    // Clean and flatten the text to ensure it's properly encoded
    const qrText = `Booking Confirmation:
Movie: ${details.movie}
Date: ${movieDate}
Time: ${details.showtime}
Seats: ${details.seats.join(', ')}
Booking ID: ${details.bookingId}`;

const qrSize=window.innerWidth<=480?80:100;

    new QRCode(qrCodeDiv, {
        text: qrText,
        width: qrSize, // Increased size for clarity
        height: qrSize,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M,
        margin:0,
    });
}

// Set up actions for the buttons
function setupButtonActions(details) {
    document.getElementById('print-ticket').addEventListener('click', function() {
        window.print();
    });

    document.getElementById('download-ticket').addEventListener('click', function() {
        const ticketText = `
MOVIE TICKET

Movie: ${details.movie}
Date: ${document.getElementById('movie-date').textContent}
Time: ${details.showtime}
Seats: ${details.seats.join(', ')}

Booking ID: ${details.bookingId}

Thank you for your purchase!
        `;
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(ticketText));
        element.setAttribute('download', `ticket_${details.bookingId}.txt`);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    });

    document.getElementById('return-home').addEventListener('click', function() {
        localStorage.removeItem('bookingDetails');
        localStorage.removeItem('confirmationDetails');
        window.location.href = 'movie_booking.html';
    });
}