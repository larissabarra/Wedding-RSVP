const urlParams = new URLSearchParams(window.location.search);
let row = urlParams.get('row');
let plusOne = urlParams.has('plusOne');
const webAppUrl = 'https://script.google.com/macros/s/AKfycbwDjiFeIRnOak-XqdBLwgY5jyJQpyycC0rKoTFJAcMLZ6QPNEPHy9EuJ6M8q8YDuieklw/exec';

let cachedData = null;
let cachedPlusOneData = null;

if (row) {
    cachedData = localStorage.getItem('guestData_' + row);
    const plusOneRow = Number(row) + 1;
    cachedPlusOneData = localStorage.getItem('guestData_' + plusOneRow);
    plusOne = cachedPlusOneData != null;
} else {
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('guestData_')) {
            cachedData = localStorage.getItem(key);
            row = key.split('_')[1];
            const plusOneRow = Number(row) + 1;
            cachedPlusOneData = localStorage.getItem('guestData_' + plusOneRow);
            plusOne = cachedPlusOneData != null;
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
        plusOne = true;
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
    document.getElementById('fallbackForm').classList.add('hidden');
}

function showRSVPSummary() {
    let summaryText = `${cachedData.name} is ${cachedData.rsvp == "Yes" ? "" : "not "}coming. Dietary restrictions: ${cachedData.food} (${cachedData.foodDetails}).`;
    if (plusOne) {
        summaryText += '<br/>';
        summaryText += `${cachedPlusOneData.name} is ${cachedPlusOneData.rsvp == "Yes" ? "" : "not "}coming. Dietary restrictions: ${cachedPlusOneData.food} (${cachedPlusOneData.foodDetails}).`;
    }
    document.getElementById("rsvpSummary").innerHTML = summaryText;
    document.getElementById("rsvpSuccess").classList.remove("hidden");
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
            if (row == null) {
                row = data[0][0];
                plusOne = data[0][2] == 'yes';
            }
            const guestData = { name: data[0][1], rsvp: data[0][3], food: data[0][4], foodDetails: data[0][5] };
            const plusOneData = plusOne && data[1] ? { name: data[1][1], rsvp: data[1][3], food: data[1][4], foodDetails: data[1][5] } : null;

            cachedData = guestData;
            cachedPlusOneData = plusOneData;

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

function checkIfHasDataAndShowDataOrForm() {
    if (cachedData) {
        const guestData = JSON.parse(cachedData);
        const plusOneData = JSON.parse(cachedPlusOneData);

        if (guestData.rsvp == "") {
            displayData(guestData, plusOneData);
        } else {
            showRSVPSummary();
        }
    } else {
        if (row) {
            fetchData(`${webAppUrl}?row=${row}&plusOne=${plusOne}`);
        } else {
            document.getElementById('fallbackForm').classList.remove('hidden');
            document.getElementById("loadingMessage").classList.add("hidden");
        }
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    document.getElementById("loadingMessage").classList.remove("hidden");
    document.getElementById("mainContent").classList.add("hidden");

    checkIfHasDataAndShowDataOrForm();

    setupFoodDetailsToggle();

    document.getElementById("rsvpForm").addEventListener("submit", async (event) => {
        event.preventDefault();
        document.body.style.cursor = "wait";

        const mainGuestRSVP = document.querySelector('input[name="mainResponse"]:checked').value;
        const mainGuestFood = document.getElementById("mainFood").value;
        const mainGuestFoodDetails = document.getElementById("mainFoodDetails").value;

        const plusOneRSVP = document.querySelector('input[name="plusOneResponse"]:checked').value;
        const plusOneFood = document.getElementById("plusOneFood").value;
        const plusOneFoodDetails = document.getElementById("plusOneFoodDetails").value;

        const postData = new URLSearchParams({
            row: row,
            response: mainGuestRSVP,
            food: mainGuestFood,
            foodDetails: mainGuestFoodDetails
        });

        if (plusOne) {
            postData.append('plusOneRow', parseInt(row) + 1);
            postData.append('plusOneResponse', plusOneRSVP);
            postData.append('plusOneFood', plusOneFood);
            postData.append('plusOneFoodDetails', plusOneFoodDetails);
        }

        fetch(webAppUrl, {
            method: 'POST',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: postData
        })
            .then(response => response.text())
            .then(() => {
                document.getElementById("rsvpForm").classList.add("hidden");
                cachedData.rsvp = mainGuestRSVP;
                cachedData.food = mainGuestFood;
                cachedData.foodDetails = mainGuestFoodDetails;
                localStorage.setItem('guestData_' + row, JSON.stringify(cachedData));
                if (plusOne) {
                    cachedPlusOneData.rsvp = plusOneRSVP;
                    cachedPlusOneData.food = plusOneFood;
                    cachedPlusOneData.foodDetails = plusOneFoodDetails;
                    localStorage.setItem('guestData_' + (row + 1), JSON.stringify(cachedPlusOneData));
                }
                document.body.style.cursor = "default";
                showRSVPSummary();
            })
            .catch(error => {
                console.error('Error posting data:', error);
                document.body.style.cursor = "default";
                alert('Failed to submit RSVP.');
            });
    });

    document.getElementById("guestFindForm").addEventListener("submit", async (event) => {
        event.preventDefault();
        document.getElementById('fallbackForm').classList.add('hidden');
        document.getElementById("loadingMessage").classList.remove("hidden");

        fetchData(`${webAppUrl}?name=${document.getElementById("guestName").value}`);
    });

    const toggleButton = document.querySelector('.menu-toggle');
    const menuList = document.querySelector('.menu ul');

    toggleButton.addEventListener('click', () => {
        menuList.classList.toggle('open');
    });

    document.querySelectorAll('.menu a').forEach(link => {
        link.addEventListener('click', () => {
            menuList.classList.remove('open');
        });
    });

    document.getElementById("changeRsvpButton").addEventListener("click", () => {
        document.getElementById("rsvpSuccess").classList.add("hidden");
        checkAndShowForm();
        document.getElementById("rsvpForm").classList.remove("hidden");
    });
});
