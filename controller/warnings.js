const config = require('../config.json');
const template = require('./parent');
//const db = require('../logic/mongodb');
const db = require('../logic/ipfs')
const chainwrite = require('../logic/chainwrite');
const fs = require('fs');
const crypto = require('../logic/cryptofunctions');
const jsdom = require("jsdom");
const jquery = require("jquery");
const site = "warnings";
const nav = require('./parent');
const chainread = require('../logic/chainread');

module.exports = {

    handleRequest(req, res) {

        try {
            let content = req.body.content;


            if (forsale != undefined)
                forsale = true;
            else
                forsale = false;


            //encrypt data
            let fileKey = crypto.randomBytes(32);
            let encryptedFileKey = crypto.encryptRSA(fileKey, config.publicKey_mongo);
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
        let view = nav.load(site);

        let items = chainread.warnings();
        items.then(result => {

                let table = '<table class="table align-items-center table-flush">';
                table += `<tr>
                <th>Reporter</th>
                <th>Description</th>
                <th>Date</th>
                </tr>`;
                for (let i = 0; i < result.rows.length; i++) {
                    let row = result.rows[i];

                    table += '<tr>';
                    table += '<td>' + row.sender + '</td>';
                    table += '<td><div class="label-primary">' + row.content + '</div></td>';
                    table += '<td><div class="label-primary">' + row.timestamp + '</div></td>';
                    table += '</tr>';
                }
                table += '</table>';

                //place table;
                let view_dom = new jsdom.JSDOM(view);
                let $ = jquery(view_dom.window);
                $('.table-responsive').html(table);
                view = view_dom.serialize();

                //send page to user
                nav.deliver(res, view, err, done);
            },
            function (err) {
                console.log(err);
            }
        );

    }
};