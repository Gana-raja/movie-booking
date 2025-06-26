// ===== LOADER CONTROL =====
function showLoader() {
  document.getElementById('global-loader').style.display = 'flex';
}

function hideLoader() {
  document.getElementById('global-loader').style.display = 'none';
}

// Tab Switching
document.addEventListener('DOMContentLoaded', () => {
  // Check admin status
  fetch('https://cinetix-backend.onrender.com/check-login',{credentials:'include'})
    .then(res => res.json())
    .then(data => {
      if (!data.loggedIn || data.role !== 'admin') {
        alert("Access denied.");
        window.location.href = '/';
      } else {
        document.getElementById('adminDisplay').innerHTML = 
          `Welcome, ${data.username} | <a href="/logout" style="color:#f50629;">Logout</a>`;
        setupTabSwitching();
        loadMovies();
      }
    });

  // Setup event listeners
  document.getElementById('refreshBtn').addEventListener('click', loadBookings);
  document.getElementById('clearAllBtn').addEventListener('click', clearAllBookings);
  setupMovieManagement();
});

function setupTabSwitching() {
  // Set initial active tab and section
  const initialTab = document.querySelector('.admin-tab.active');
  const initialSection = document.getElementById(`${initialTab.dataset.tab}-section`);
  initialSection.style.display = 'block';

  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      
      document.querySelectorAll('.admin-section').forEach(section => {
        section.style.display = 'none';
      });
      
      const activeSection = document.getElementById(`${this.dataset.tab}-section`);
      activeSection.style.display = 'block';
      
      if (this.dataset.tab === 'movies') {
        loadMovies();
      } else if (this.dataset.tab === 'bookings') {
        loadBookings();
      }
    });
  });
}

// ===== BOOKING MANAGEMENT =====
function loadBookings() {
  showLoader();
  fetch('https://cinetix-backend.onrender.com/admin/bookings',{credentials:'include'})
    .then(res => res.json())
    .then(data => {
      const movieSet = new Set();
      const showtimeSet = new Set();
      const tbody = document.getElementById('bookingData');
      tbody.innerHTML = '';

      data.forEach(booking => {
        movieSet.add(booking.movie);
        showtimeSet.add(booking.showtime);

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td data-label="User">${booking.username}</td>
          <td data-label="Movie">${booking.movie}</td>
          <td data-label="Date">${booking.bookingDate || 'N/A'}</td>
          <td data-label="Showtime">${booking.showtime}</td>
          <td data-label="Seats">${booking.seats.join(', ')}</td>
          <td data-label="Total">Rs.${booking.total}</td>
          <td data-label="Ordered">${booking.orderDate ? new Date(booking.orderDate).toLocaleString() : 'N/A'}</td>
          <td data-label="Action"><button class="deleteBtn" data-id="${booking._id}">Delete</button></td>
        `;
        tbody.appendChild(tr);
      });

      populateFilter('movieFilter', movieSet);
      populateFilter('showtimeFilter', showtimeSet);
      applyFilters();
    })
    .finally(() => hideLoader());
}

function clearAllBookings() {
  if (confirm("Are you sure you want to delete all bookings? This action cannot be undone.")) {
    showLoader();
    fetch('https://cinetix-backend.onrender.com/admin/bookings', { 
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    })
    .then(res => {
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      return res.json();
    })
    .then(data => {
      if (data.success) {
        alert(data.message);
        loadBookings();
      } else {
        throw new Error(data.message || 'Failed to delete bookings');
      }
    })
    .catch(err => {
      console.error('Error:', err);
      alert(err.message || 'Failed to delete bookings');
    })
    .finally(() => hideLoader());
  }
}

// ===== MOVIE MANAGEMENT =====
function setupMovieManagement() {
  document.getElementById('add-movie-btn').addEventListener('click', () => {
    showMovieForm();
  });

  document.getElementById('cancel-movie-btn').addEventListener('click', () => {
    hideMovieForm();
  });

  document.getElementById('movie-form').addEventListener('submit', (e) => {
    e.preventDefault();
    saveMovie();
  });

  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-movie')) {
      const movieId = e.target.dataset.id;
      editMovie(movieId);
    }
    if (e.target.classList.contains('delete-movie')) {
      const movieId = e.target.dataset.id;
      deleteMovie(movieId);
    }
    if (e.target.classList.contains('deleteBtn')) {
      const bookingId = e.target.dataset.id;
      deleteBooking(bookingId);
    }
  });
}

function loadMovies() {
  showLoader();
  fetch('https://cinetix-backend.onrender.com/admin/movies',{credentials:'include'})
    .then(res => res.json())
    .then(movies => {
      const moviesList = document.getElementById('movies-list');
      moviesList.innerHTML = movies.map(movie => `
        <div class="movie-card" data-id="${movie._id}">
          <img src="${movie.posterUrl}" alt="${movie.title}">
          <h3>${movie.title}</h3>
          <p>Rs.${movie.price} | ${movie.duration}</p>
          <div class="movie-actions">
            <button class="edit-movie" data-id="${movie._id}">Edit</button>
            <button class="delete-movie danger-btn" data-id="${movie._id}">Delete</button>
          </div>
        </div>
      `).join('');
    })
    .finally(() => hideLoader());
}

function showMovieForm(movieId = null) {
  const formContainer = document.getElementById('movie-form-container');
  const form = document.getElementById('movie-form');
  
  if (movieId) {
    // Editing existing movie
    fetch(`https://cinetix-backend.onrender.com/admin/movies/${movieId}`,{credentials:'include'})
      .then(res => res.json())
      .then(movie => {
        document.getElementById('movie-id').value = movie._id;
        document.getElementById('movie-title').value = movie.title;
        document.getElementById('movie-description').value = movie.description;
        document.getElementById('movie-duration').value = movie.duration;
        document.getElementById('movie-genre').value = movie.genre;
        document.getElementById('movie-rating').value = movie.rating || '';
        document.getElementById('movie-poster').value = movie.posterUrl;
        document.getElementById('movie-price').value = movie.price;
        document.getElementById('movie-showtimes').value = movie.showtimes.join(', ');
        document.getElementById('movie-dates').value = movie.dates.join(', ');
        document.getElementById('movie-active').checked = movie.active !== false;
        
        formContainer.style.display = 'block';
        document.getElementById('save-movie-btn').textContent = 'Update Movie';
      });
  } else {
    // Adding new movie
    form.reset();
    document.getElementById('movie-id').value = '';
    document.getElementById('movie-active').checked = true;
    formContainer.style.display = 'block';
    document.getElementById('save-movie-btn').textContent = 'Add Movie';
  }
}

function hideMovieForm() {
  document.getElementById('movie-form-container').style.display = 'none';
}

function saveMovie() {
  showLoader();
  
  const movieData = {
    title: document.getElementById('movie-title').value,
    description: document.getElementById('movie-description').value,
    duration: document.getElementById('movie-duration').value,
    genre: document.getElementById('movie-genre').value,
    rating: document.getElementById('movie-rating').value,
    posterUrl: document.getElementById('movie-poster').value,
    price: parseFloat(document.getElementById('movie-price').value),
    showtimes: document.getElementById('movie-showtimes').value
      .split(',')
      .map(time => time.trim())
      .filter(time => time),
    dates: document.getElementById('movie-dates').value
      .split(',')
      .map(date => date.trim())
      .filter(date => date),
    active: document.getElementById('movie-active').checked
  };

  const movieId = document.getElementById('movie-id').value;
  const url = movieId ? `https://cinetix-backend.onrender.com/admin/movies/${movieId}` : 'https://cinetix-backend.onrender.com/admin/movies';
  const method = movieId ? 'PUT' : 'POST';

  fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(movieData),
    credentials:'include'
  })
    .then(res => res.json())
    .then(data => {
      if (data.errors) {
        alert(data.errors.map(e => e.msg).join('\n'));
      } else {
        hideMovieForm();
        loadMovies();
      }
    })
    .catch(err => {
      alert('Error saving movie');
      console.error(err);
    })
    .finally(() => hideLoader());
}

async function editMovie(movieId) {
  try {
    showLoader();

    const response = await fetch(`/admin/movies/${movieId}`,{credentials:'include'});
    const movie = await response.json();
    
    if (response.ok) {
      // Populate form with movie data
      document.getElementById('movie-id').value = movie._id;
      document.getElementById('movie-title').value = movie.title;
      document.getElementById('movie-description').value = movie.description;
      document.getElementById('movie-duration').value = movie.duration;
      document.getElementById('movie-genre').value = movie.genre;
      document.getElementById('movie-rating').value = movie.rating || '';
      document.getElementById('movie-poster').value = movie.posterUrl;
      document.getElementById('movie-price').value = movie.price;
      document.getElementById('movie-showtimes').value = movie.showtimes.join(', ');
      document.getElementById('movie-dates').value = movie.dates.join(', ');
      document.getElementById('movie-active').checked = movie.active !== false;
      
      // Show the form
      document.getElementById('movie-form-container').style.display = 'block';
      document.getElementById('save-movie-btn').textContent = 'Update Movie';
      
      // Scroll to form
      document.getElementById('movie-form-container').scrollIntoView({ 
        behavior: 'smooth' 
      });
    } else {
      throw new Error('Failed to fetch movie data');
    }
  } catch (error) {
    console.error('Error editing movie:', error);
    alert('Failed to load movie for editing');
  } finally {
    hideLoader();
  }
}

function deleteMovie(movieId) {
  if (confirm('Are you sure you want to delete this movie?')) {
    showLoader();
    fetch(`/admin/movies/${movieId}`, {credentials:'include', method: 'DELETE' })
      .then(res => res.json())
      .then(() => loadMovies())
      .catch(err => {
        alert('Error deleting movie');
        console.error(err);
      })
      .finally(() => hideLoader());
  }
}

function deleteBooking(bookingId) {
  if (confirm("Are you sure you want to delete this booking?")) {
    showLoader();
    fetch(`/admin/bookings/${bookingId}`, {credentials:'include', method: 'DELETE' })
      .then(res => res.json())
      .then(data => {
        alert(data.message);
        loadBookings(); // Refresh the bookings list
      })
      .catch(err => {
        alert('Error deleting booking');
        console.error(err);
      })
      .finally(() => hideLoader());
  }
}

// Helper functions
function populateFilter(id, values) {
  const select = document.getElementById(id);
  const current = select.value;
  select.innerHTML = `<option value="">All ${id.includes('movie') ? 'Movies' : 'Showtimes'}</option>`;
  [...values].sort().forEach(v => {
    const option = document.createElement('option');
    option.value = v;
    option.textContent = v;
    if (v === current) option.selected = true;
    select.appendChild(option);
  });
}

function applyFilters() {
  const movie = document.getElementById('movieFilter').value;
  const showtime = document.getElementById('showtimeFilter').value;

  const rows = document.querySelectorAll('#bookingData tr');
  rows.forEach(row => {
    const movieCell = row.children[1].textContent;
    const showtimeCell = row.children[3].textContent;
    row.style.display =
      (movie === '' || movie === movieCell) &&
      (showtime === '' || showtime === showtimeCell)
        ? ''
        : 'none';
  });

  document.getElementById('movieFilter').addEventListener('change', applyFilters);
  document.getElementById('showtimeFilter').addEventListener('change', applyFilters);
}
