const config = require('../config.json');
const template = require('./parent');
//const db = require('../logic/mongodb');
const db = require('../logic/ipfs')
const chainwrite = require('../logic/chainwrite');
const fs = require('fs');
const crypto = require('../logic/cryptofunctions');
const jsdom = require("jsdom");
const jquery = require("jquery");


module.exports = {

    handleRequest(req, res) {

        try {
            let content = req.body.content;
            let report_chain_promise = chainwrite.warning(content);
            report_chain_promise.then(() => {
                this.loadPage(res, false, true);

            }, (err) => {
                this.loadPage(res, err);
            });
        } catch (e) {
            this.loadPage(res, "FEHLER: Meldung war nicht erfolgreich. Verschlüsselung oder Blockchain/Datenbank Transaktion schlug fehl.", true);
        }
    },


    loadPage(res, err, done) {
        let report = fs.readFileSync(global.viewsdir + 'warningreport.html', 'utf8');
        // report = template.handleMessage(report, err, done);

        template.deliver(res, report, err, done);
    }
};