// Parse the 'row' query parameter from the URL
const urlParams = new URLSearchParams(window.location.search);
let row = urlParams.get('row');
console.log('Row parameter:', row); // Log row parameter to see if it's being read correctly

// Google Apps Script web app URL
    const webAppUrl = 'https://script.google.com/macros/s/AKfycbwU-VX2Da5YC-CPp-jCml3p7wZlHFxnMTZfwTJ4h2XAXPsVItoDe_DplpBsPeYPWdrLVg/exec';

// Get cached data if 'row' is provided
let cachedData = null;

if (row) {
  cachedData = localStorage.getItem('guestData_' + row);
} else {
  // If row is missing, find the first 'guestData_' entry in localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('guestData_')) {
      cachedData = localStorage.getItem(key);
      row = key.split('_')[1]; // Extract the row number from the key
      break;
    }
  }
}

// Function to display the greeting and form data
function displayData(guestData) {
  document.getElementById('greeting').textContent = `Hello, ${guestData.name}!`;
  document.getElementById('response').value = guestData.rsvp;
  document.getElementById('loadingMessage').style.display = 'none'; // Hide loading message
}

// If cached data exists, use it
if (cachedData) {
  const guestData = JSON.parse(cachedData);
  displayData(guestData);
} else {
  // Show loading message while fetching data from Google Sheets
  fetch(`${webAppUrl}?row=${row}`)
    .then(response => response.json())
    .then(data => {
      // Assuming the data contains the guest's name and previous RSVP (e.g., columns A and B)
      const guestData = { name: data[0][0], rsvp: data[0][1] };
      displayData(guestData);

      // Cache the guest data in localStorage for future visits
      localStorage.setItem('guestData_' + row, JSON.stringify(guestData));
    })
    .catch(error => {
      console.error('Error fetching data:', error);
      document.getElementById('greeting').textContent = 'Failed to load data.';
      document.getElementById('loadingMessage').style.display = 'none'; // Hide loading message
    });
}

// Handle form submission to update the RSVP in Google Sheets
document.getElementById('rsvpForm').addEventListener('submit', function(event) {
  event.preventDefault();
  const response = document.getElementById('response').value;

  // Check if the row and response are available
  if (row && response) {
    fetch(`${webAppUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        row: row,
        newValue: response
      })
    })
      .then(response => response.text())
      .then(responseText => {
        console.log(responseText);
        alert('RSVP updated successfully!');

        // Update the cached guest data in localStorage
        const updatedGuestData = JSON.parse(localStorage.getItem('guestData_' + row)) || {};
        updatedGuestData.rsvp = response;
        localStorage.setItem('guestData_' + row, JSON.stringify(updatedGuestData));
      })
      .catch(error => {
        console.error('Error posting data:', error);
        alert('Failed to submit RSVP.');
      });
  } else {
    alert('Please provide your response before submitting.');
  }
});
