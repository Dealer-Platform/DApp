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

            let isreport = req.body.isreport;
            let forsale = req.body.forsale;

            if (isreport != undefined)
                isreport = true;
            else
                isreport = false;

            if (forsale != undefined)
                forsale = true;
            else
                forsale = false;



            //encrypt data
            let fileKey = crypto.randomBytes(32);
            let encryptedFileKey = crypto.encryptRSA(fileKey, config.publicKey_RSA);
            let {iv, encryptedData} = crypto.encryptAES(data, fileKey);
            let hashEncryptedData = crypto.hashSHA256(encryptedData);


            let report_db_promise = db.write_report(encryptedData, hashEncryptedData, encryptedFileKey, iv, itemType, title, description, industry);

            report_db_promise.then(() => {

                let report_chain_promise = chainwrite.report(hashEncryptedData, price, reward, title, description, isreport, forsale);
                report_chain_promise.then(() => {
                    this.loadPage(res, false, true);

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
    }
};