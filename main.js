let age = 0;
let dateOfBirth = null;
let refreshInterval = 10;
let previousWholeAge = 0;

function setCookie(name,value,days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}
function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}
function eraseCookie(name) {   
    document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function calculateExactAgeWithCorrectedLinearCorrection(dateOfBirth, currentDate) {
	    const dob = new Date(dateOfBirth);
	    const current = new Date(currentDate);

	    // Calculate whole years of age
	    let ageYears = current.getFullYear() - dob.getFullYear();
	    if (current.getMonth() < dob.getMonth() || (current.getMonth() === dob.getMonth() && current.getDate() < dob.getDate())) {
	        ageYears--; // If birthday hasn't occurred yet this year, subtract one year
	    }

	    // Find the date of the last birthday
	    const lastBirthday = new Date(current.getFullYear(), dob.getMonth(), dob.getDate());
	    if (current < lastBirthday) {
	        lastBirthday.setFullYear(lastBirthday.getFullYear() - 1);
	    }

	    // Calculate the number of days since the last birthday to the current date
	    const daysSinceLastBirthday = (current - lastBirthday) / (1000 * 60 * 60 * 24);
	    
	    // Determine the number of days in the current year
	    const daysInCurrentYear = isLeapYear(current.getFullYear()) ? 366 : 365;

	    // Correct the correction to make sure it is between 0 and 1
	    let correction = daysSinceLastBirthday / daysInCurrentYear;
	    if (correction >= 1) {
	        correction = 0; // This means we should already have counted this correction in the whole part of the age
	    }

	    // Return the sum of the whole and fractional part with correction
	    const totalAge = ageYears + correction;
	    return totalAge;
}

function updateAge() {
    if (!dateOfBirth) {
        return;
    }
    
    age = calculateExactAgeWithCorrectedLinearCorrection(dateOfBirth, Date.now());
    document.getElementById("age").textContent = age.toFixed(11) + " y.o."; // Displaying age

    const currentWholeAge = Math.floor(age);
    if (currentWholeAge > previousWholeAge) {
        celebrate(); // Call celebrate function when age moves to the next whole number
    }
    previousWholeAge = currentWholeAge;
}

function initDate() {
    dateOfBirth = getCookie("dateOfBirth");
    if (!dateOfBirth) {
        document.querySelector(".settings-div").style.display = 'flex'; // Show settings-div
        document.querySelector(".settings-bar").style.display = 'none';
        return;
    }

    const currentDate = Date.now();
    age = calculateExactAgeWithCorrectedLinearCorrection(dateOfBirth, currentDate);
    previousWholeAge = Math.floor(age);
    updateAge();

    setInterval(updateAge, refreshInterval);
}

window.onload = function() {
    initDate();
};

window.addEventListener('focus', function() {
    initDate();
});

// Function to save date of birth and hide settings-div
function applyDateOfBirth() {
    let dateOfBirthInput = document.querySelector("input[type='date']").value;
    if (dateOfBirthInput) {
        let isNewCookie = !getCookie("dateOfBirth"); // Check if this is a new cookie
        setCookie("dateOfBirth", dateOfBirthInput, 365);
        dateOfBirth = dateOfBirthInput;
        initDate();
        document.querySelector(".settings-div").style.display = 'none';

        if (isNewCookie) {
            document.querySelector(".settings-bar").style.display = 'flex';
            const settingsBar = document.querySelector(".settings-bar");
            settingsBar.style.backgroundColor = "white"; // Change color for 2 seconds
            setTimeout(() => {
                settingsBar.style.backgroundColor = ""; // Revert to original color
            }, 2000);
        }
    }
}

// Assign event handler to "Apply" button
document.querySelector(".apply-button").addEventListener('click', applyDateOfBirth);

function toggleSettings() {
  const settingsDiv = document.querySelector(".settings-div");
  const isDisplayed = settingsDiv.style.display === 'flex';
  settingsDiv.style.display = isDisplayed ? 'none' : 'flex';
}

// Assign event handler to gear button
document.querySelector(".settings-icon").addEventListener('click', toggleSettings);