const config = require('../config.json');
const template = require('./parent');
//const db = require('../logic/mongodb');
const db = require('../logic/ipfs')
const chainwrite = require('../logic/chainwrite');
const fs = require('fs');
const crypto = require('../logic/cryptofunctions');
const jsdom = require("jsdom");
const jquery = require("jquery");
const chainread = require('../logic/chainread');

module.exports = {

    handleRequest(req, res) {

        try {
            let title = req.body.incidentTitle;
            let description = req.body.incidentDesc;
            let data = req.body.incidentData;
            let price = req.body.incidentPrice;
            let reward = req.body.incidentReward;
            let industry = req.body.incidentIndustry;
            let itemType = req.body.itemType;

            let isreport = req.body.isreport == undefined ? false : true;
            let forsale = req.body.forsale == undefined ? false : true;


            //encrypt data
            let fileKey = crypto.randomBytes(32);
            let encryptedFileKey = crypto.encryptRSA(fileKey, config.publicKey_RSA);
            let {iv, encryptedData} = crypto.encryptAES(data, fileKey);
            let hashPayload = crypto.hashSHA256(data);

            //write report to IPFS
            let report_db_promise = db.write_report(encryptedData, hashPayload, encryptedFileKey, iv, itemType, title, description, industry);
            report_db_promise.then(() => {

                //write report to chain
                let report_chain_promise = chainwrite.report(hashPayload, price, title, description, isreport, forsale);
                report_chain_promise.then(() => {

                    //find inserted itemkey on chain
                    chainread.items().then(item => {
                        let itemkey = -1;

                        for (let i = 0; i < item.rows.length; i++) {
                            if (item.rows[i].hash == hashPayload) {
                                itemkey = item.rows[i].key;
                                break;
                            }
                        }
                        //find voting assignments for current item
                        chainread.votings().then(voting => {
                            let voters = [];
                            for (let i = 0; i < voting.rows.length; i++) {
                                if (voting.rows[i].itemKey == itemkey) {
                                    voters.push(voting.rows[i].voter);
                                }
                            }

                            //find public keys for user
                            voters.forEach(currentvoter => {
                                let userentry = chainread.users_byUser(currentvoter);
                                userentry.then(function (user) {
                                    //TODO -- einmal für jeden Publickey ins ipfs laden
                                    console.log(user.rows[0].publicKey);

                                });
                            });



                            this.loadPage(res, false, true);
                        });


                    });


                }, (err) => {
                    this.loadPage(res, err);
                });
            }, function (err) {
                this.loadPage(res, err);
            });

        } catch (e) {
            this.loadPage(res, "FEHLER: Meldung war nicht erfolgreich. Verschlüsselung oder Blockchain/Datenbank Transaktion schlug fehl.", true);
        }
    },
    loadPage(res, err, done) {
        let report = fs.readFileSync(global.viewsdir + 'report.html', 'utf8');
        // report = template.handleMessage(report, err, done);

        template.deliver(res, report, err, done);
    },
    async findItem(hash) {
        await chainread.items().then(item => {
            for (let i = 0; i < item.rows.length; i++) {
                let row = item.rows[i];
                if (row.hash == hash)
                    return row.key;
            }
        });
        return -1;
    }

};