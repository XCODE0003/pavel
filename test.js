import { editPrice } from './src/lolz/index.js';

async function test() {
    const api_token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzUxMiJ9.eyJzdWIiOjU5NjU5OTYsImlzcyI6Imx6dCIsImV4cCI6MCwiaWF0IjoxNzI5ODAwMjQzLCJqdGkiOjY3MDM2NSwic2NvcGUiOiJtYXJrZXQifQ.KtWk7SsIWZ4oOmvOBGjnSsplrhSUTOitSFtxgLv7aCToFRW5JfhPPidcMkHVqR36ip5qziSptLiBJieaHtTB3jwWwpg02qqL91KZdzENztO5xWAgo5UTphnka2r1Ygr4dPWCXxJgX9mfwpXQfXPHOYuhHV1J-Joz4pTxPGeKIeQ'; // Замените на ваш токен
    const item_id = '151549398'; // Замените на ID предмета
    const price = 99; // Новая цена
    
    try {
        const result = await editPrice(api_token, item_id, price);
        console.log('Результат:', result);
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

test(); 