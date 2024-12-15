
export function getAccount(api_token, item_id) {
    return fetch(`https://api.lzt.market/item/${item_id}`, {
        method: 'GET',
        headers: {
            'accept': 'application/json',
            'authorization': `Bearer ${api_token}`
        }
    })
        .then(res => res.json())
        .then(data => data.items?.[0]);

}

export function editPrice(api_token, item_id, price) {
    return fetch(`https://api.lzt.market/edit?price=${price}`, {
        method: 'PUT',
        headers: {
            'accept': 'application/json',
            'authorization': `Bearer ${api_token}`
        }
    })
        .then(res => res.json())
        .then(data => data.status === 'ok');
}

export default {
    getAccount,
    editPrice
}