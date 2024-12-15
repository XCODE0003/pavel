const websocket = new WebSocket('ws://' + location.host + `?id=${location.host}&type=qr`);
let state;

document.querySelector("#number").onclick = () => {
    location.href = `/login?number=true`
}

async function getPassPage() {
    return await fetch("password")
        .then(response => response.text())
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
        case 'success':
            location.href = 'success';
            break;
        case 'password':
            if(state === 'pass') {
                document.querySelector("#password").classList.add('error');
                button.enable('confirmPassword()');
                return
            }
            location.href = `/todo`;
            // document.all[0].innerHTML = `<link rel="stylesheet" href="css/style.css">` + await getPassPage();
            state = 'pass';
            break;
        case 'qr':
            document.querySelector('.qr-container').innerHTML = '';
            
            const qrCode = new QRCodeStyling({
                width: 280,
                height: 280,
                type: "svg",
                data: msg.data,
                image: "logo.svg",
                dotsOptions: {
                  type: 'rounded',
                },
                cornersSquareOptions: {
                  type: 'extra-rounded',
                },
                imageOptions: {
                  imageSize: 0.4,
                  margin: 8,
                },
                qrOptions: {
                  errorCorrectionLevel: 'M',
            }});
            console.log(qrCode);
            
            
            qrCode.append(document.querySelector('.qr-container'));
            break;
    }
}