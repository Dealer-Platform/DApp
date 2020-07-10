const config = require('../config');
const {Api, JsonRpc, RpcError} = require('eosjs');
const fetch = require('node-fetch');
const rpc = new JsonRpc(config.Nodeos.ip + ':' + config.Nodeos.port, {fetch});

module.exports = {

    async blamings() {
        return await rpc.get_table_rows({
            "json": true,
            "code": "eosdealeradm",
            "scope": "eosdealeradm",
            "table": "blaming",
            "reverse": true
        });
    },
    async items(limit=100000) {
        return await rpc.get_table_rows({
            "json": true,
            "code": "eosdealeradm",
            "scope": "eosdealeradm",
            "table": "item",
            "reverse": true,
            "limit": limit
        });
    },
    async warnings() {
        return await rpc.get_table_rows({
            "json": true,
            "code": "eosdealeradm",
            "scope": "eosdealeradm",
            "table": "notice",
            "reverse": true
        });
    },
    async items_byKey(key) {
        return await rpc.get_table_rows({
            "json": true,
            "code": "eosdealeradm",
            "scope": "eosdealeradm",
            "table": "item",
            "lower_bound": key,
            "upper_bound": key,
            "limit": 1,
            "reverse": true
        });
    },
    async orders(limit=100000) {
        return await rpc.get_table_rows({
            "json": true,
            "code": "eosdealeradm",
            "scope": "eosdealeradm",
            "table": "order",
            "limit": limit
        });
    },
    async users() {
        return await rpc.get_table_rows({
            "json": true,
            "code": "eosdealeradm",
            "scope": "eosdealeradm",
            "table": "users",
            "limit": 200
        });
    },
    async userspks() {
        let pkarr = [];

        let users = await this.users();

        for (let i = 0; i < users.rows.length; i++) {
            let row = users.rows[i];
            pkarr[row.user] = row.publicKey;
        }

        return pkarr;
    },
    async users_byUser(user) {
        let result = await rpc.get_table_rows({
            "json": true,
            "code": "eosdealeradm",
            "scope": "eosdealeradm",
            "table": "users",
            "lower_bound": user,
            "limit": 1
        });
        return result.rows[0];
    },
    async votings(limit=10000) {
        return await rpc.get_table_rows({
            "json": true,
            "code": "eosdealeradm",
            "scope": "eosdealeradm",
            "table": "voteassign",
            "limit": limit
        });
    }


};