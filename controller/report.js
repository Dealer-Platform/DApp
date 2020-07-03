const config = require('../config.json');
const template = require('./parent');
const db = require('../logic/ipfs');
const chainwrite = require('../logic/chainwrite');
const fs = require('fs');
const crypto = require('../logic/cryptofunctions');
const chainread = require('../logic/chainread');
const filter = require('../logic/filter')
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

            let isreport = req.body.isreport != undefined;
            let forsale = req.body.forsale != undefined;


            //encrypt data
            let fileKey = crypto.randomBytes(32);
            let encryptedFileKey = crypto.encryptRSA(fileKey, config.publicKey_RSA);
            let {iv, encryptedData} = crypto.encryptAES(data, fileKey);
            let hashPayload = crypto.hashSHA256(data);

            //write report to IPFS and chain
            await Promise.all([
              db.write_report(encryptedData, hashPayload, encryptedFileKey, iv, itemType, title, description, industry),
              chainwrite.report(hashPayload, price, title, description, isreport, forsale)
            ]);

            //find inserted itemkey on chain
            let [item, votings, users] = await Promise.all([
                chainread.items_byKey(10),
                chainread.votings(30),
                chainread.users()
            ]);
            let itemkey = -1;

            for (let i = 0; i < item.rows.length; i++) {
                if (item.rows[i].hash === hashPayload) {
                    itemkey = item.rows[i].key;
                    break;
                }
            }

            localdb.writeItemKeyPairToDisk(itemkey, fileKey);

            //find voting assignments for current item
            let assignedUsers = filter.voters_byItem(votings,itemkey)
            if (isreport){
                assignedUsers.push("bsi");
            }

            //get public keys for users
            let voters = users.rows.filter(user => assignedUsers.includes(user.user))

            let fileKeys = [];
            voters.forEach((user) => {
                let encryptedFileKey = crypto.encryptRSA(fileKey, user.publicKey);
                fileKeys.push({user: user.user, encryptedFileKey: encryptedFileKey})
                //RSA encrypt fileKey with publicKey
            });
            //upload fileKeys
            await db.write_addEncryptedFileKeys(hashPayload, fileKeys);

            this.loadPage(res, false, true);

        } catch (e) {
            console.log(e);
            this.loadPage(res, e, false);
        }
    },
    loadPage(res, err, done) {
        let report = fs.readFileSync(global.viewsdir + 'report.html', 'utf8');
        // report = template.handleMessage(report, err, done);

        template.deliver(res, report, err, done);
    }
};