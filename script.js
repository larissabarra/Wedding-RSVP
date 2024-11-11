const urlParams = new URLSearchParams(window.location.search);
let row = urlParams.get('row');
const plusOne = urlParams.has('plusOne');

// Google Apps Script web app URL
const webAppUrl = 'https://script.google.com/macros/s/AKfycbwF7zQ-__h0TR5gBFPZCm8hrgunQT-x5VpXAdwSWpKRMfj9NvpB4FEmUkOUp6pqJ17OyQ/exec';

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

// Function to display greeting and form
function displayData(guestData, plusOneData) {
  const greetingElement = document.getElementById('greeting');
  const mainGuestSection = document.getElementById('mainGuestSection');
  const plusOneSection = document.getElementById('plusOneSection');

  // Display greeting based on presence of plus one
  greetingElement.textContent = plusOneData
    ? `Hello, ${guestData.name} and ${plusOneData.name}!`
    : `Hello, ${guestData.name}!`;

  // Populate main guest data
  document.getElementById('mainResponse').value = guestData.rsvp;
  document.getElementById('mainFood').value = guestData.food;
  document.getElementById('mainFoodDetails').value = guestData.foodDetails;

  // Populate plus one data if available
  if (plusOneData) {
    plusOneSection.style.display = 'block';
    document.getElementById('plusOneResponse').value = plusOneData.rsvp;
    document.getElementById('plusOneFood').value = plusOneData.food;
    document.getElementById('plusOneFoodDetails').value = plusOneData.foodDetails;
  }

  document.getElementById('loadingMessage').style.display = 'none'; // Hide loading message
}

// Fetch data based on row and cache it
if (cachedData) {
  const guestData = JSON.parse(cachedData);
  const plusOneData = plusOne ? JSON.parse(localStorage.getItem('guestData_' + (parseInt(row) + 1))) : null;
  displayData(guestData, plusOneData);
} else {
  fetch(`${webAppUrl}?row=${row}&plusOne=${plusOne}`)
    .then(response => response.json())
    .then(data => {
      const guestData = { name: data[0][0], rsvp: data[0][1], food: data[0][2], foodDetails: data[0][3] };
      const plusOneData = plusOne && data[1] ? { name: data[1][0], rsvp: data[1][1], food: data[1][2], foodDetails: data[1][3] } : null;

      displayData(guestData, plusOneData);

      // Cache guest data
      localStorage.setItem('guestData_' + row, JSON.stringify(guestData));
      if (plusOneData) {
        localStorage.setItem('guestData_' + (parseInt(row) + 1), JSON.stringify(plusOneData));
      }
    })
    .catch(error => {
      console.error('Error fetching data:', error);
      document.getElementById('greeting').textContent = 'Failed to load data.';
      document.getElementById('loadingMessage').style.display = 'none';
    });
}

// Handle form submission for both main guest and plus one
document.getElementById('rsvpForm').addEventListener('submit', function(event) {
  event.preventDefault();

  const mainResponse = document.getElementById('mainResponse').value;
  const mainFood = document.getElementById('mainFood').value;
  const mainFoodDetails = document.getElementById('mainFoodDetails').value;

  const postData = new URLSearchParams({
    row: row,
    response: mainResponse,
    food: mainFood,
    foodDetails: mainFoodDetails
  });

  // If plus one, add additional data
  if (plusOne) {
    const plusOneResponse = document.getElementById('plusOneResponse').value;
    const plusOneFood = document.getElementById('plusOneFood').value;
    const plusOneFoodDetails = document.getElementById('plusOneFoodDetails').value;

    postData.append('plusOneRow', parseInt(row) + 1);
    postData.append('plusOneResponse', plusOneResponse);
    postData.append('plusOneFood', plusOneFood);
    postData.append('plusOneFoodDetails', plusOneFoodDetails);
  }

  fetch(webAppUrl, {
    method: 'POST',
    headers: { 'Content-Type': '
