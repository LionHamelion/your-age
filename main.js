let age = 0;
let dateOfBirth = 0;
refreshInterval = 10;

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

	    // Розрахунок цілої частини віку
	    let ageYears = current.getFullYear() - dob.getFullYear();
	    if (current.getMonth() < dob.getMonth() || (current.getMonth() === dob.getMonth() && current.getDate() < dob.getDate())) {
	        ageYears--; // Якщо ще не було дня народження в цьому році, віднімаємо один рік
	    }

	    // Визначення дати останнього дня народження
	    const lastBirthday = new Date(current.getFullYear(), dob.getMonth(), dob.getDate());
	    if (current < lastBirthday) {
	        lastBirthday.setFullYear(lastBirthday.getFullYear() - 1);
	    }

	    // Розрахунок кількість днів від останнього дня народження до поточної дати
	    const daysSinceLastBirthday = (current - lastBirthday) / (1000 * 60 * 60 * 24);
	    
	    // Визначення кількості днів у поточному році
	    const daysInCurrentYear = isLeapYear(current.getFullYear()) ? 366 : 365;

	    // Виправлення корекції, щоб вона була в межах 0 до 1
	    let correction = daysSinceLastBirthday / daysInCurrentYear;
	    if (correction >= 1) {
	        correction = 0; // Це означає, що ми повинні були вже врахувати цю корекцію в цілу частину віку
	    }

	    // Повертаємо суму цілої та дробової частини з корекцією
	    const totalAge = ageYears + correction;
	    return totalAge;
}

function updateAge() {
	age = calculateExactAgeWithCorrectedLinearCorrection(dateOfBirth, Date.now());
	document.getElementById("age").textContent = age.toFixed(11) + " y.o."; // Виведення віку
}


window.onload = function() {
		initDate();
	  	setInterval(updateAge, refreshInterval); // Плануємо оновлення віку кожні 10 мс
};

window.addEventListener('focus', function() {
    initDate();
});

function initDate() {
	dateOfBirth = getCookie("dateOfBirth");
	if (!dateOfBirth) {
		document.querySelector(".settings-div").style.display = 'flex'; // Показати settings-div
		document.querySelector(".settings-bar").style.display = 'none';
		return;
	}

	const currentDate = Date.now();
	age = calculateExactAgeWithCorrectedLinearCorrection(dateOfBirth, currentDate);
	updateAge();
}

window.onload = function() {
	initDate();
	setInterval(updateAge, refreshInterval); // Оновлення віку кожні 10 мс
};

window.addEventListener('focus', function() {
	initDate();
});

// Функція для збереження дати народження та приховування settings-div
function applyDateOfBirth() {
    let dateOfBirth = document.querySelector("input[type='date']").value;
    if (dateOfBirth) {
        let isNewCookie = !getCookie("dateOfBirth"); // Перевірка чи це новий cookie
        setCookie("dateOfBirth", dateOfBirth, 365);
        initDate();
        document.querySelector(".settings-div").style.display = 'none';

        if (isNewCookie) {
        	document.querySelector(".settings-bar").style.display = 'flex';
            const settingsBar = document.querySelector(".settings-bar");
            settingsBar.style.backgroundColor = "white"; // Зміна кольору на 2 секунди
            setTimeout(() => {
                settingsBar.style.backgroundColor = ""; // Повернення до початкового кольору
            }, 2000);
        }
    }
}

// Призначення обробника події для кнопки "Apply"
document.querySelector(".apply-button").addEventListener('click', applyDateOfBirth);

function toggleSettings() {
  const settingsDiv = document.querySelector(".settings-div");
  const isDisplayed = settingsDiv.style.display === 'flex';
  settingsDiv.style.display = isDisplayed ? 'none' : 'flex';
}

// Призначення обробника події для кнопки з шестернею
document.querySelector(".settings-icon").addEventListener('click', toggleSettings);