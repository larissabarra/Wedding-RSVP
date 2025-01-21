const urlParams = new URLSearchParams(window.location.search);
let row = urlParams.get('row');
const plusOne = urlParams.has('plusOne');
const webAppUrl = 'https://script.google.com/macros/s/AKfycbwdR6UMKH7S2eQ0VTXA21_b72W2EnuD8sr5cMqBaD56dlDey4TW5yf079gOJ8ujJLE2lw/exec';

let cachedData = null;

if (row) {
    cachedData = localStorage.getItem('guestData_' + row);
} else {
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('guestData_')) {
            cachedData = localStorage.getItem(key);
            row = key.split('_')[1];
            break;
        }
    }
}

function displayData(guestData, plusOneData) {
    const greetingElement = document.getElementById('greeting');
    greetingElement.textContent = plusOneData
        ? `Hello, ${guestData.name} & ${plusOneData.name}!`
        : `Hello, ${guestData.name}!`;

    document.getElementById('mainGuestName').textContent = guestData.name;
    if (document.querySelector(`input[name="mainResponse"][value="${guestData.rsvp}"]`) != null) {
        document.querySelector(`input[name="mainResponse"][value="${guestData.rsvp}"]`).checked = true;
    }
    document.getElementById('mainFood').value = guestData.food;
    document.getElementById('mainFoodDetails').value = guestData.foodDetails;

    if (plusOneData) {
        document.getElementById('plusOneName').textContent = plusOneData.name;
        document.getElementById('plusOneSection').classList.remove('hidden');
        if (document.querySelector(`input[name="plusOneResponse"][value="${plusOneData.rsvp}"]`) != null) {
            document.querySelector(`input[name="plusOneResponse"][value="${plusOneData.rsvp}"]`).checked = true;
        }
        document.getElementById('plusOneFood').value = plusOneData.food;
        document.getElementById('plusOneFoodDetails').value = plusOneData.foodDetails;
    }

    document.getElementById('loadingMessage').classList.add('hidden');
    document.getElementById('mainContent').classList.remove('hidden');
}

function setupFoodDetailsToggle() {
    const mainFoodSelect = document.getElementById("mainFood");
    const mainFoodDetails = document.getElementById("foodDetailsContainer");
    mainFoodSelect.addEventListener("change", () => {
        mainFoodDetails.classList.toggle("hidden", !["Allergy", "Other"].includes(mainFoodSelect.value));
    });

    if (plusOne) {
        const plusOneFoodSelect = document.getElementById("plusOneFood");
        const plusOneFoodDetails = document.getElementById("plusOneFoodDetailsContainer");
        plusOneFoodSelect.addEventListener("change", () => {
            plusOneFoodDetails.classList.toggle("hidden", !["Allergy", "Other"].includes(plusOneFoodSelect.value));
        });
    }
}

function fetchData(fromUrl) {
    fetch(fromUrl)
        .then(response => response.json())
        .then(data => {
            const guestData = { name: data[0][0], rsvp: data[0][1], food: data[0][2], foodDetails: data[0][3] };
            const plusOneData = plusOne && data[1] ? { name: data[1][0], rsvp: data[1][1], food: data[1][2], foodDetails: data[1][3] } : null;

            displayData(guestData, plusOneData);

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

document.addEventListener("DOMContentLoaded", async () => {
    document.getElementById("loadingMessage").classList.remove("hidden");
    document.getElementById("mainContent").classList.add("hidden");

    if (cachedData) {
        const guestData = JSON.parse(cachedData);
        const plusOneData = plusOne ? JSON.parse(localStorage.getItem('guestData_' + (parseInt(row) + 1))) : null;
        displayData(guestData, plusOneData);
    } else {
        if (row) {
            fetcData(`${webAppUrl}?row=${row}&plusOne=${plusOne}`);
        } else {
            document.getElementById('fallbackForm').classList.remove('hidden');
        }
    }

    setupFoodDetailsToggle();

    document.getElementById("rsvpForm").addEventListener("submit", async (event) => {
        event.preventDefault();

        const postData = new URLSearchParams({
            row: row,
            response: document.querySelector('input[name="mainResponse"]:checked').value,
            food: document.getElementById("mainFood").value,
            foodDetails: document.getElementById("mainFoodDetails").value
        });

        if (plusOne) {
            postData.append('plusOneRow', parseInt(row) + 1);
            postData.append('plusOneResponse', document.querySelector('input[name="plusOneResponse"]:checked').value);
            postData.append('plusOneFood', document.getElementById("plusOneFood").value);
            postData.append('plusOneFoodDetails', document.getElementById("plusOneFoodDetails").value);
        }

        fetch(webAppUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: postData
        })
            .then(response => response.text())
            .then(() => {
                document.getElementById("rsvpForm").classList.add("hidden");
                document.getElementById("menu").classList.remove("hidden");
            })
            .catch(error => {
                console.error('Error posting data:', error);
                alert('Failed to submit RSVP.');
            });
    });

    document.getElementById("guestFindForm").addEventListener("submit", async (event) => {
        event.preventDefault();

        fetchData(`${webAppUrl}?name=${document.getElementById("guestName").value}`);
    });

    // document.getElementById("changeRsvpButton").addEventListener("click", () => {
    //     document.getElementById("menu").classList.add("hidden");
    //     document.getElementById("rsvpForm").classList.remove("hidden");
    // });
});
