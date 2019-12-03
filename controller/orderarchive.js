const config = require('../config.json');
const nav = require('./parent');
const jsdom = require("jsdom");
const jquery = require("jquery");
//const db = require('../logic/mongodb');
const db = require('../logic/ipfs');
const chainwrite = require('../logic/chainwrite');

const chainread = require('../logic/chainread');
const site = "orderarchive";


module.exports = {

    handleRequest(req, res) {


        //execute order
        if (req.body.hasOwnProperty("decrypt-btn")) {

            // 1. Download Incident from EOS with itemKey -> Getting Hash
            // 2. Download Incident from DB  with hash 	  -> Getting encrypted FileKey of Seller
            // 3. Decrypt fileKey 						  -> Getting decrypted FileKey
            // 4. Download public Key from EOS with user  -> Getting public key of buyer
            // 5. Encrypt FileKey with public key of buyer-> Getting encrypted FileKey of Buyer
            // 6. Modify Incident in DB with encrypted    -> Store encrypted FileKey of Buyer at the DB
            // 7. Modify EOS state 					      -> Update Metadata

            //1.
            let item = chainread.items_byKey(req.body.itemKey);
            item.then(function (result) {
                let hash = JSON.stringify(result.rows[0].hash).substring(1, JSON.stringify(result.rows[0].hash).length - 1);
                //2.
                let db_item_entry_raw = db.read_item_byID(hash);
                db_item_entry_raw.then(function (result) {
                    let encryptedFileKeys = result[0].fileKeys;
                    let encryptedFileKey_user;
                    for (let i = 0; i < encryptedFileKeys.length; i++) {
                        if (encryptedFileKeys[i].user != config.user) {
                            continue;
                        }
                        encryptedFileKey_user = encryptedFileKeys[i].encryptedFileKey;
                        break;
                    }
                    //3.
                    let decryptedFileKey = crypto.decryptRSA(encryptedFileKey_user, config.privateKey_mongo);
                    //4.
                    let buyer_entry_eos = chainread.users_byUser(req.body.buyer);
                    buyer_entry_eos.then(function (result) {
                        let publicKey_buyer = result.rows[0].publicKey;
                        //5.
                        let encryptedFileKey_buyer = crypto.encryptRSA(decryptedFileKey, publicKey_buyer);
                        //6.
                        let db_transaction = db.write_addEncryptedFileKey(hash, req.body.buyer, encryptedFileKey_buyer);
                        db_transaction.then(function (result) {
                            //7.
                            let set_chain_state = chainwrite.sent(req.body.orderKey);
                            set_chain_state.then((result) => {
                                this.loadPage(res, null, true);

                            }, (err) => {
                                this.loadPage(res, err, false);
                            });
                        }, (err) => {
                            this.loadPage(res, err, false);
                        });
                    }, (err) => {
                        this.loadPage(res, err, false);
                    });
                }, (err) => {
                    this.loadPage(res, err, false);
                });
            }, (err) => {
                this.loadPage(res, err, false);
            });

            this.loadPage(res, null, true);
        } else {
            let promise;
            //confirm the receiving of the ordered threat intelligence data
            if (req.body.hasOwnProperty("confirmation-btn")) {
                promise = chainwrite.received(req.body.key, true);
                //confirm the sending of the ordered threat intelligence data
            } else if (req.body.hasOwnProperty("rejection-btn")) {
                promise = chainwrite.received(req.body.key, false);
            }

            promise.then((result) => {
                this.loadPage(res, null, true);
            }, (err) => {
                this.loadPage(res, err, false);
            });
        }

    },


//get order page and its buttons
    loadPage(res, err, done) {
        let orders = nav.load(site);
        let order_items = chainread.orders();
        order_items.then(function (result) {

            let debug = "";

            let table_myOrders = '<table class="table align-items-center table-flush">';
            table_myOrders += '<tr><th>#</th><th>Item</th><th>Seller</th><th>Orderdate</th></tr>'
            for (let i = 0; i < result.rows.length; i++) {
                let row = result.rows[i];

                if (row.buyer != config.user && row.finished == 1)
                    continue;


                table_myOrders += '<tr>';
                //key
                table_myOrders += '<td>' + row.key + '</td>';
                //itemkey
                table_myOrders += '<td>' + row.itemKey + '</td>';
                //buyer
                table_myOrders += '<td>' + row.seller + '</td>';

               table_myOrders += '<td>' + row.timestamp + '</td>';


                table_myOrders += '<td><a href="/download?user=' + row.seller + '&key=' + row.itemKey + '" class="btn btn-sm btn-primary">Download</a></td>';
                table_myOrders += '</tr>';
            }
            table_myOrders += '</table>';

            //place tables
            let orders_dom = new jsdom.JSDOM(orders);
            let $ = jquery(orders_dom.window);
            // $('p.allOrders').html(debug);
            $('.table-responsive').html(table_myOrders);
            $(".debug").html(debug);
            orders = orders_dom.serialize();

            nav.deliver(res, orders, err, done);
        }, function (err) {
            console.log(err);
        });
    }
};