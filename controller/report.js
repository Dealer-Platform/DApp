const config = require('../config.json');
const template = require('./parent');
const db = require('../logic/ipfs');
const chainwrite = require('../logic/chainwrite');
const fs = require('fs');
const crypto = require('../logic/cryptofunctions');
const chainread = require('../logic/chainread');
const localdb = require('../logic/localdb');

module.exports = {

    async handleRequest(req, res) {

        try {
            let title = req.body.incidentTitle;
            let description = req.body.incidentDesc;
            let data = req.body.incidentData;
            let price = req.body.incidentPrice;
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
            let report_db_promise = await db.write_report(encryptedData, hashPayload, encryptedFileKey, iv, itemType, title, description, industry);

            //write report to chain
            let report_chain_promise = await chainwrite.report(hashPayload, price, title, description, isreport, forsale);

            //find inserted itemkey on chain
            let item = await chainread.items();
                let itemkey = -1;

                for (let i = 0; i < item.rows.length; i++) {
                    if (item.rows[i].hash == hashPayload) {
                        itemkey = item.rows[i].key;
                        break;
                    }
                }

                localdb.writeItemKeyPairToDisk(itemkey, fileKey);

                //find voting assignments for current item
                chainread.votings().then(voting => {
                    let assignedUsers = [];
                    for (let i = 0; i < voting.rows.length; i++) {
                        if (voting.rows[i].itemKey == itemkey) {
                            assignedUsers.push(voting.rows[i].voter);
                        }
                    }
                    if (isreport){
                        assignedUsers.push("BSI");
                    }

                    //get public keys for users
                    Promise.all(assignedUsers.map(chainread.users_byUser)).then((res) => {
                        let fileKeys = [];
                        res.forEach((user) => {
                            let encryptedFileKey = crypto.encryptRSA(fileKey, user.rows[0].publicKey);
                            fileKeys.push({user: user.rows[0].user, encryptedFileKey: encryptedFileKey})
                            //RSA encrypt fileKey with publicKey
                        });
                        //upload fileKeys
                        db.write_addEncryptedFileKeys(hashPayload, fileKeys);
                    });

                    this.loadPage(res, false, true);
                });

        } catch (e) {
            console.log(e);
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