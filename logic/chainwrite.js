const config = require('../config');
const fetch = require('node-fetch');
const {TextEncoder, TextDecoder} = require('util');
const {Api, JsonRpc, RpcError} = require('eosjs');
const {JsSignatureProvider} = require('eosjs/dist/eosjs-jssig');
const signatureProvider = new JsSignatureProvider([config.privateKey_eos]);
const rpc = new JsonRpc('http://' + config.Nodeos.ip + ':' + config.Nodeos.port, {fetch});
const api = new Api({rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder()});

module.exports = {
    apply(itemKey) {
        return api.transact({
            actions: [{
                account: 'eosdealeradm',
                name: 'apply',
                authorization: [{
                    actor: config.user,
                    permission: 'active',
                }],
                data: {
                    itemKey: itemKey,
                    applicant: config.user,
                },
            }]
        }, {
            blocksBehind: 3,
            expireSeconds: 30,
        });
    }, approve(key) {
        return api.transact({
            actions: [{
                account: 'eosdealeradm',
                name: 'approve',
                authorization: [{
                    actor: config.user,
                    permission: 'active',
                }],
                data: {
                    key: key,
                },
            }]
        }, {
            blocksBehind: 3,
            expireSeconds: 30,
        });
    }, blame(blamed, reason, freeze) {
        return api.transact({
            actions: [{
                account: 'eosdealeradm',
                name: 'blame',
                authorization: [{
                    actor: config.user,
                    permission: 'active',
                }],
                data: {
                    blamer: config.user,
                    blamed: blamed,
                    reason: reason,
                    freeze: freeze,
                },
            }]
        }, {
            blocksBehind: 3,
            expireSeconds: 30,
        });
    }, buy(itemKey) {
        return api.transact({
            actions: [{
                account: 'eosdealeradm',
                name: 'placeorder',
                authorization: [{
                    actor: config.user,
                    permission: 'active',
                }],
                data: {
                    itemKey: itemKey,
                    buyer: config.user,
                },
            }]
        }, {
            blocksBehind: 3,
            expireSeconds: 30,
        });
    }, received(orderKey, done) {
        return api.transact({
            actions: [{
                account: 'eosdealeradm',
                name: 'received',
                authorization: [{
                    actor: config.user,
                    permission: 'active',
                }],
                data: {
                    buyer: config.user,
                    orderKey: orderKey,
                    done: done,
                },
            }]
        }, {
            blocksBehind: 3,
            expireSeconds: 30,
        });
    }, report(hash, price, title, description, report, sale) {
        return api.transact({
            actions: [{
                account: 'eosdealeradm',
                name: 'report',
                authorization: [{
                    actor: config.user,
                    permission: 'active',
                }],
                data: {
                    reporter: config.user,
                    hash: hash,
                    price: price,
                    description: description,
                    title: title,
                    report: report,
                    sale: sale
                },
            }]
        }, {
            blocksBehind: 3,
            expireSeconds: 30,
        });
    }, warning(content) {
        return api.transact({
            actions: [{
                account: 'eosdealeradm',
                name: 'warning',
                authorization: [{
                    actor: config.user,
                    permission: 'active',
                }],
                data: {
                    sender: config.user,
                    content: content
                },
            }]
        }, {
            blocksBehind: 3,
            expireSeconds: 30,
        });
    },

    selectvoter(itemKey) {
        let nonce = parseInt("0x" + crypto.getCryptoRandom(5));
        return api.transact({
            actions: [{
                account: 'eosdealeradm',
                name: 'selectvoter',
                authorization: [{
                    actor: config.user,
                    permission: 'active',
                }],
                data: {
                    reporter: config.user,
                    itemKey: itemKey,
                    nonce: nonce,
                },
            }]
        }, {
            blocksBehind: 3,
            expireSeconds: 30,
        });
    }, sent(orderKey) {
        return api.transact({
            actions: [{
                account: 'eosdealeradm',
                name: 'sent',
                authorization: [{
                    actor: config.user,
                    permission: 'active',
                }],
                data: {
                    seller: config.user,
                    orderKey: orderKey,
                },
            }]
        }, {
            blocksBehind: 3,
            expireSeconds: 30,
        });
    }, transfer(to, amount) {
        return api.transact({
            actions: [{
                account: 'eosdealeradm',
                name: 'transfer',
                authorization: [{
                    actor: config.user,
                    permission: 'active',
                }],
                data: {
                    from: config.user,
                    to: to,
                    amount: amount,
                },
            }]
        }, {
            blocksBehind: 3,
            expireSeconds: 30,
        });
    }, updatepk(publicKey) {
        return api.transact({
            actions: [{
                account: 'eosdealeradm',
                name: 'updatepk',
                authorization: [{
                    actor: config.user,
                    permission: 'active',
                }],
                data: {
                    user: config.user,
                    publicKey: publicKey,
                },
            }]
        }, {
            blocksBehind: 3,
            expireSeconds: 30,
        });
    }, updateprice(itemKey, price) {
        return api.transact({
            actions: [{
                account: 'eosdealeradm',
                name: 'updateprice',
                authorization: [{
                    actor: config.user,
                    permission: 'active',
                }],
                data: {
                    reporter: config.user,
                    itemKey: itemKey,
                    price: price,
                },
            }]
        }, {
            blocksBehind: 3,
            expireSeconds: 30,
        });
    }, verify(itemKey, accept, rating) {
        return api.transact({
            actions: [{
                account: 'eosdealeradm',
                name: 'verify',
                authorization: [{
                    actor: config.user,
                    permission: 'active',
                }],
                data: {
                    itemKey: itemKey,
                    voter: config.user,
                    accept: accept,
                    rating: rating
                },
            }]
        }, {    // ACTION verify(uint64_t itemKey, name voter, bool accept, uint64_t rating);
            blocksBehind: 3,
            expireSeconds: 30,
        });
    }, voteb(blameKey, value) {
        return api.transact({
            actions: [{
                account: 'eosdealeradm',
                name: 'voteb',
                authorization: [{
                    actor: config.user,
                    permission: 'active',
                }],
                data: {
                    blameKey: blameKey,
                    voter: config.user,
                    value: value,
                },
            }]
        }, {
            blocksBehind: 3,
            expireSeconds: 30,
        });
    },
    keyupload(orderno) {
        return api.transact({
            actions: [{
                account: 'eosdealeradm',
                name: 'keyupload',
                authorization: [{
                    actor: config.user,
                    permission: 'active',
                }],
                data: {
                    sender: config.user,
                    orderno: orderno
                },
            }]
        }, {
            blocksBehind: 3,
            expireSeconds: 30,
        });
    },
    opendispute(orderno) {
        return api.transact({
            actions: [{
                account: 'eosdealeradm',
                name: 'opendispute',
                authorization: [{
                    actor: config.user,
                    permission: 'active',
                }],
                data: {
                    user: config.user,
                    orderno: orderno
                },
            }]
        }, {
            blocksBehind: 3,
            expireSeconds: 30,
        });
    },
    closedispute(orderno) {
        return api.transact({
            actions: [{
                account: 'eosdealeradm',
                name: 'closedispute',
                authorization: [{
                    actor: config.user,
                    permission: 'active',
                }],
                data: {
                    user: config.user,
                    orderno: orderno
                },
            }]
        }, {
            blocksBehind: 3,
            expireSeconds: 30,
        });
    },
    finishorder(orderno) {
        return api.transact({
            actions: [{
                account: 'eosdealeradm',
                name: 'finishorder',
                authorization: [{
                    actor: config.user,
                    permission: 'active',
                }],
                data: {
                    user: config.user,
                    orderno: orderno
                },
            }]
        }, {
            blocksBehind: 3,
            expireSeconds: 30,
        });
    },
    redeemorder(orderno) {
        return api.transact({
            actions: [{
                account: 'eosdealeradm',
                name: 'redeemorder',
                authorization: [{
                    actor: config.user,
                    permission: 'active',
                }],
                data: {
                    user: config.user,
                    orderno: orderno
                },
            }]
        }, {
            blocksBehind: 3,
            expireSeconds: 30,
        });
    },
    redeemforseller(orderno) {
        return api.transact({
            actions: [{
                account: 'eosdealeradm',
                name: 'sellredeem',
                authorization: [{
                    actor: config.user,
                    permission: 'active',
                }],
                data: {
                    user: config.user,
                    orderno: orderno
                },
            }]
        }, {
            blocksBehind: 3,
            expireSeconds: 30,
        });
    },
    updateuser() {
        return api.transact({
            actions: [{
                account: 'eosdealeradm',
                name: 'updateuser',
                authorization: [{
                    actor: config.user,
                    permission: 'active',
                }],
                data: {
                    user: config.user
                },
            }]
        }, {
            blocksBehind: 3,
            expireSeconds: 30,
        });
    }

};