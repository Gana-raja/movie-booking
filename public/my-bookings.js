// ===== LOADER CONTROL =====
function showLoader() {
  document.getElementById('global-loader').style.display = 'flex';
}

function hideLoader() {
  document.getElementById('global-loader').style.display = 'none';
}


document.addEventListener('DOMContentLoaded', () => {
    //mobile menu toggle
    const menuIcon=document.getElementById('menu-icon');
    const navLinks=document.querySelector('.nav-links');

    menuIcon.addEventListener('click',(e)=>{
        e.stopPropagation();
        navLinks.classList.toggle('active');
    });

    document.addEventListener('click',(e)=>{
        if(!e.target.closest('.navbar')&& !e.target.closest('.nav-links')){
            navLinks.classList.remove('active');
        }
    });
    // Verify QRCode is loaded
    if (typeof QRCode === 'undefined') {
        console.error('QRCode library not loaded!');
        document.getElementById('bookingsList').innerHTML = 
            '<p class="error">System configuration error. Please refresh.</p>';
        return;
    }
    fetchMyBookings();
});

function fetchMyBookings() {
    showLoader();
    fetch('https://cinetix-backend.onrender.com/my-bookings')
        .then(response => {
            if (!response.ok) {
                throw new Error('Not logged in or server error');
            }
            return response.json();
        })
        .then(bookings => {
            renderBookings(bookings);
        })
        .catch(error => {
            console.error('Error fetching bookings:', error);
            document.getElementById('bookingsList').innerHTML = 
                '<p class="error">Failed to load bookings. Please try again later.</p>';
        }) .finally(()=>hideLoader());
}

function renderBookings(bookings) {
    const bookingsList = document.getElementById('bookingsList');
    
    if (!bookings.length) {
        bookingsList.innerHTML = '<p class="no-bookings">No bookings yet.</p>';
        return;
    }

    bookingsList.innerHTML = bookings.map(booking => `
        <div class="booking-card fade-in">
            <div class="booking-header">
                <h3 class="booking-movie">${booking.movie}</h3>
                <span class="booking-id">Booking ID: ${booking.bookingId}</span>
            </div>
            <div class="booking-details">
                <div class="detail-group">
                    <p">Date</p>
                    <p>${booking.bookingDate}</p>
                </div>
                <div class="detail-group">
                    <p>Time</p>
                    <p>${booking.showtime}</p>
                </div>
                <div class="detail-group">
                    <p>Seats</p>
                    <p>${booking.seats.join(', ')}</p>
                </div>
                <div class="detail-group">
                    <p>Total</p>
                    <p>Rs.${booking.total}</p>
                </div>
                <div class="booking-qr-container">
                    <div class="booking-qr" id="qr-${booking._id}"></div>
                </div>
            </div>
        </div>
    `).join('');

    // Generate QR codes
    bookings.forEach(booking => {
        const qrElement = document.getElementById(`qr-${booking._id}`);
        if (!qrElement) return;

        const qrText = `CineTix\n${booking.movie}\n${booking.bookingDate}\n${booking.showtime}\n${booking.seats.join(',')}\n${booking.bookingId}`;
        
        try {
            new QRCode(qrElement, {
                text: qrText,
                width: 80,  // Slightly larger for better scanning
                height: 80,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.M
            });
        } catch (err) {
            console.error('QR Error:', err);
            qrElement.innerHTML = `
                <div class="qr-fallback">
                    ${booking.qrText.replace(/\n/g, '<br>')}
                </div>
            `;
        }
    });
}