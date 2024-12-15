import axios from "axios";

export default new class Ake {
    constructor(token) {
        this.token = token;
    }


    async createPort(location) {
        return await axios.post(`https://api.ake.net/v2/proxy/create-port?apiKey=${this.token}`, {
            "country_code": location,
            // "state": "New York",
            // "city": "New York",
            "asn": 1,
            "type_id": 1,
            "proxy_type_id": 2,
            "name": `${location} #${Date.now()}`,
            "server_port_type_id": 0,
            "count": 1
        })
            .then(r => r.data.data[0]);
    }


    async deletePort(id) {
        return await axios.delete(`https://api.ake.net/v2/proxy/delete-port?apiKey=${this.token}&id=${id}`)
            .catch(r => r.response)
            .then(r => r.data)
    }

}(`CpWOHrPyVuBtkUmQsIAWPDbQNSWVaYWJ`)