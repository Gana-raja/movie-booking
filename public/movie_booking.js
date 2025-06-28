// ===== LOADER CONTROL =====
let isLoading = false;

function showLoader() {
  if (isLoading) return;
  isLoading = true;
  document.getElementById('global-loader').style.display = 'flex';
}

function hideLoader() {
  isLoading = false;
  document.getElementById('global-loader').style.display = 'none';
}

// DOM Elements
const container = document.querySelector('.container');
const seats = document.querySelectorAll('.row .seat:not(.occupied)');
const count = document.getElementById('count');
const total = document.getElementById('total');
const proceedBtn = document.getElementById('proceed-to-payment');
let selectedMovie = null;
let selectedShowtime = null;
let selectedDate = null;

// Mobile Menu Toggle
const menuIcon = document.getElementById('menu-icon');
const navLinks = document.querySelector('.nav-links');

menuIcon.addEventListener('click', (e) => {
  e.stopPropagation();
  navLinks.classList.toggle('active');
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.navbar') && !e.target.closest('.nav-links')) {
    navLinks.classList.remove('active');
  }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  hideLoader(); // Ensure loader is hidden on initial load
  checkLoginStatus();
  loadMovies();
  setupEventListeners();
  
  // Handle page restoration from cache
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      hideLoader();
    }
  });
});

function checkLoginStatus() {
  fetch('https://cinetix-backend.onrender.com/check-login',{
    method: 'GET',
    credentials: 'include'
  })
    .then(response => response.json())
    .then(data => {
      if (data.loggedIn) {
        document.getElementById('usernameDisplay').innerHTML = 
          `<div class="user-info">
              <span class="welcome-msg">Welcome, <strong>${data.username}</strong></span> 
              <a href="https://cinetix-backend.onrender.com/logout" class="logout-link" style="color:#f50629;">Logout</a>
            </div>`;
        document.querySelector('.my-bookings-link').style.display = 'inline-block';
      }
    });
}

function loadMovies() {
  showLoader();
  const container = document.getElementById('movie-cards-container');
  //show skeleton placeholders
  container.innerHTML=Array(6).fill().map(()=>
  `<div class="movie-card skeleton"></div>`
  ).join('');
  fetch('https://cinetix-backend.onrender.com/api/movies',{method:'GET',credentials:'include'})
    .then(response => response.json())
    .then(movies => {
      container.innerHTML = movies.map(movie => `
        <div class="movie-card" data-id="${movie._id}">
          <img src="${movie.posterUrl}" alt="${movie.title}">
          <div class="movie-card-info">
            <h4>${movie.title}</h4>
            <span class="price">Rs.${movie.price}</span>
          </div>
        </div>
      `).join('');

      if (movies.length > 0) {
        selectMovie(movies[0]._id, true); // true = initial load
      }
    })
    .finally(() => hideLoader());
}

function selectMovie(movieId, isInitialLoad = false) {
  showLoader();
  selectedShowtime=null;
  document.querySelector('.seat-selection-section').style.display='none';
  fetch(`https://cinetix-backend.onrender.com/api/movies/${movieId}`,{method:'PUT',credentials:'include'})
    .then(response => response.json())
    .then(movie => {
      selectedMovie = movie;
      
      // Update movie details
      document.getElementById('movie-title').textContent = movie.title;
      document.getElementById('movie-duration').textContent = movie.duration;
      document.getElementById('movie-genre').textContent = movie.genre;
      document.getElementById('movie-rating').textContent = movie.rating || 'NR';
      document.getElementById('movie-description').textContent = movie.description;
      document.getElementById('movie-poster-img').src = movie.posterUrl;
      
      // Update active movie card
      document.querySelectorAll('.movie-card').forEach(card => {
        card.classList.toggle('active', card.dataset.id === movieId);
      });
      
      // Update date options
      updateDateOptions(movie.dates);
      
      // Update showtime options
      updateShowtimeOptions(movie.showtimes);
      
      // Reset selections
      resetSeatSelection();

      // Auto-scroll for ALL screens when user clicks (not initial load)
      if (!isInitialLoad) {
        setTimeout(() => {
          const movieDetails = document.getElementById('movie-details-container');
          if (movieDetails) {
            const headerHeight = document.querySelector('.navbar').offsetHeight;
            const elementPosition = movieDetails.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerHeight;
            
            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });

            // Visual feedback
            movieDetails.classList.add('highlight-details');
            setTimeout(() => {
              movieDetails.classList.remove('highlight-details');
            }, 1000);
          }
        }, 100);
      }
    })
    .catch(error => {
      console.error('Error loading movie:', error);
      alert('Failed to load movie details. Please try again.');
    })
    .finally(() => {
      hideLoader();
    });
}

function updateDateOptions(dates) {
  const container = document.getElementById('date-options');
  container.innerHTML = dates.map(date => `
    <button type="button" class="date-option" data-date="${date}">${date}</button>
  `).join('');
  
  if (dates.length > 0) {
    const firstDateBtn = container.querySelector('.date-option');
    firstDateBtn.classList.add('active');
    selectedDate = firstDateBtn.dataset.date;
    document.getElementById('selectedDate').value = selectedDate;
  }
  
  container.querySelectorAll('.date-option').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.date-option').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      selectedDate = this.dataset.date;
      document.getElementById('selectedDate').value = selectedDate;
      fetchBookedSeats();
    });
  });
}

function updateShowtimeOptions(showtimes) {
  const container = document.getElementById('showtime-options');
  container.innerHTML = showtimes.map(time => `
    <button class="showtime-btn">${time}</button>
  `).join('');
  
  container.querySelectorAll('.showtime-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.showtime-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      selectedShowtime = this.textContent;

      const seatSection = document.querySelector('.seat-selection-section');
      seatSection.style.display = 'block';
      seatSection.style.opacity = '1';

      fetchBookedSeats();
      setTimeout(() => {
        seatSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    });
  });
}

function fetchBookedSeats() {
  if (!selectedMovie || !selectedShowtime || !selectedDate) return;

  //add skeleton state to seats
  document.querySelectorAll('.seat').forEach(seat=>{
    if(!seat.classList.contains('occupied')){
      seat.classList.add('skeleton');
    }
  });
  
  showLoader();
  fetch(`https://cinetix-backend.onrender.com/booked-seats?movie=${encodeURIComponent(selectedMovie.title)}&showtime=${encodeURIComponent(selectedShowtime)}&bookingDate=${encodeURIComponent(selectedDate)}`,{credentials:'include'})
    .then(res => res.json())
    .then(data => {
      document.querySelectorAll('.seat').forEach(seat => {
        seat.classList.remove('skeleton');
        const seatId = seat.textContent.trim();
        seat.classList.remove('occupied');
        if (data.bookedSeats.includes(seatId)) {
          seat.classList.add('occupied');
          seat.classList.remove('selected');
        }
      });
      updateSelectedCount();
    })
    .finally(() => hideLoader());
}

function resetSeatSelection() {
  document.querySelectorAll('.seat').forEach(seat => {
    seat.classList.remove('selected');
  });
  updateSelectedCount();
}

function updateSelectedCount() {
  const selectedSeats = document.querySelectorAll('.row .seat.selected');
  const selectedSeatsCount = selectedSeats.length;
  count.textContent = selectedSeatsCount;
  
  if (selectedMovie) {
    total.textContent = (selectedSeatsCount * selectedMovie.price).toFixed(2);
  }
  
  proceedBtn.disabled = !(selectedSeatsCount > 0 && selectedShowtime && selectedDate);
}

function setupEventListeners() {
  // Seat selection
  container.addEventListener('click', e => {
    if (e.target.classList.contains('seat') && !e.target.classList.contains('occupied')) {
      e.target.classList.toggle('selected');
      updateSelectedCount();
    }
  });
  
  // Movie card selection
  document.getElementById('movie-cards-container').addEventListener('click', e => {
    const movieCard = e.target.closest('.movie-card');
    if (movieCard) {
      selectMovie(movieCard.dataset.id);
    }
  });
  
  // Proceed to payment
  proceedBtn.addEventListener('click', async () => {
    showLoader();
    
    try {
      if (!selectedMovie || !selectedShowtime || !selectedDate) {
        throw new Error('Please complete all selections');
      }
      
      const selectedSeats = Array.from(document.querySelectorAll('.row .seat.selected'));
      if (selectedSeats.length === 0) {
        throw new Error('Please select at least one seat');
      }

      const bookingDetails = {
        movie: selectedMovie.title,
        price: selectedMovie.price,
        seats: selectedSeats.map(seat => seat.textContent.trim()),
        showtime: selectedShowtime,
        total: selectedSeats.length * selectedMovie.price,
        bookingDate: selectedDate
      };
      
      localStorage.setItem('bookingDetails', JSON.stringify(bookingDetails));
      
      const [loginData] = await Promise.all([
        fetch('https://cinetix-backend.onrender.com/check-login',{method:'GET',credentials: 'include'}).then(res => res.json()),
        new Promise(resolve => setTimeout(resolve, 1000)) // Minimum loader time
      ]);
      
      hideLoader();
      window.location.href = loginData.loggedIn ? 'payment.html' : 'login.html';
    } catch (error) {
      hideLoader();
      alert(error.message);
      console.error('Payment error:', error);
    }
  });
}
