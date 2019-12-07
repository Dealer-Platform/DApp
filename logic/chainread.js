const config = require('../config');
const {Api, JsonRpc, RpcError} = require('eosjs');
const fetch = require('node-fetch');
const rpc = new JsonRpc('http://' + config.Nodeos.ip + ':' + config.Nodeos.port, {fetch});

module.exports = {

    async blamings() {
        return await rpc.get_table_rows({
            "json": true,
            "code": "reporting",
            "scope": "reporting",
            "table": "blaming",
            "reverse": true
        });
    },
    async items() {
        return await rpc.get_table_rows({
            "json": true,
            "code": "reporting",
            "scope": "reporting",
            "table": "item",
            "reverse": true,
            "limit": 200
        });
    },
    async warnings() {
        return await rpc.get_table_rows({
            "json": true,
            "code": "reporting",
            "scope": "reporting",
            "table": "notice",
            "reverse": true
        });
    },
    async items_byKey(key) {
        return await rpc.get_table_rows({
            "json": true,
            "code": "reporting",
            "scope": "reporting",
            "table": "item",
            "lower_bound": key,
            "upper_bound": key,
            "limit": 1,
            "reverse": true
        });
    },
    async orders() {
        return await rpc.get_table_rows({
            "json": true,
            "code": "reporting",
            "scope": "reporting",
            "table": "order",
            "limit": 200
        });
    },
    async users() {
        return await rpc.get_table_rows({
            "json": true,
            "code": "reporting",
            "scope": "reporting",
            "table": "users",
            "limit": 200
        });
    },
    async userspks(fnc) {
        let pkarr = [];

        let userlist = this.users();
        await userlist.then((users) => {

            for (let i = 0; i < users.rows.length; i++) {
                let row = users.rows[i];
                pkarr[row.user] = row.publicKey;
            }

            fnc(pkarr);
        });
    },
    async users_byUser(user) {
        return await rpc.get_table_rows({
            "json": true,
            "code": "reporting",
            "scope": "reporting",
            "table": "users",
            "lower_bound": user,
            "limit": 1
        });
    },
    async votings() {
        return await rpc.get_table_rows({
            "json": true,
            "code": "reporting",
            "scope": "reporting",
            "table": "voteassign",
            "limit": 500
        });
    }

};