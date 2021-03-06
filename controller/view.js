const config = require('../config.json');
const nav = require('./parent');
const jsdom = require("jsdom");
const jquery = require("jquery");
const site = "view";
const chainread = require('../logic/chainread');
const chainwrite = require('../logic/chainwrite');
const db = require('../logic/ipfs')
const localdb = require('../logic/localdb');
const crypto = require('../logic/cryptofunctions');
const filter = require('../logic/filter')


module.exports = {

    //unlock incidents
    async handleRequest(req, res) {

        //redeem order
        let type = req.body.type;
        let orderKey = req.body.orderKey;

        if (type == "redeem") {
            await chainwrite.redeemforseller(orderKey);
            this.loadPage(res);
            return;
        }

        try {
            if (req.body.orderKey) {
                let orderKey = req.body.orderKey;
                let itemKey = req.body.itemKey;
                let buyer = req.body.buyer;
                let keysFromDisk = await localdb.readAllKeyPairsFromDisk();
                let items = await chainread.items_byKey(itemKey);
                let user = await chainread.users_byUser(buyer)
                let encryptedFileKey = crypto.encryptRSA(keysFromDisk[itemKey], user.publicKey);
                let json = {user: buyer, encryptedFileKey: encryptedFileKey}


                await Promise.all([
                    db.write_addEncryptedFileKeys(items.rows[0].hash, [json]),
                    chainwrite.keyupload(orderKey)
                ]);
            } else {
                let itemKey = req.body.itemKey;
                let orders = [];
                let order = await chainread.orders();
                for (let i = 0; i < order.rows.length; i++) {
                    let row = order.rows[i];
                    if ((row.buyer === config.user) || (itemKey && (itemKey !== row.itemKey.toString())))
                        continue;

                    //add uncomplete items
                    if (row.bkeyupload === 0) {
                        if (orders[row.itemKey] === undefined) {
                            orders[row.itemKey] = [];
                        }
                        orders[row.itemKey].push(row);
                    }
                }
                let fileKeys = {};
                let keysFromDisk = await localdb.readAllKeyPairsFromDisk();
                let pks = await chainread.userspks();

                let requests = [];
                for (let i = 0; i < orders.length; i++) {
                    if (orders[i] === undefined)
                        continue;

                    let order = orders[i][0];

                    let key = keysFromDisk[order.itemKey]
                    let items = await chainread.items_byKey(order.itemKey);
                    if (!key) {
                        key = db.read_own_key(items.rows[0].hash);
                        localdb.writeItemKeyPairToDisk(order.itemkey, key);
                    }

                    let encryptedFileKey = crypto.encryptRSA(key, pks[order.buyer]);
                    let json = {user: order.buyer, encryptedFileKey: encryptedFileKey}
                    if (!fileKeys[items.rows[0].hash])
                        fileKeys[items.rows[0].hash] = [json]
                    else
                        fileKeys[items.rows[0].hash].push(json)

                    requests.push(chainwrite.keyupload(order.key));
                }

                for (const hash in fileKeys) {
                    let upload = db.write_addEncryptedFileKeys(hash, fileKeys[hash])
                    requests.push(upload)
                }
                await Promise.all(requests);
            }

            this.loadPage(res);

        } catch (e) {
            console.log(e)
            this.loadPage(res, e, true);
        }

    }, getLastActive(username, userlist) {

        for (let i = 0; i < userlist.rows.length; i++) {
            if (userlist.rows[i].user == username) {
                let lastactive = userlist.rows[i].last_active;

                if (lastactive == "1970-01-01T00:00:00.000") {
                    return "no data";
                } else {
                    return lastactive;
                }
            }
        }
        return "no data";
    },


    //view own incidents and orders with colored buttons and labels
    async loadPage(res, err, done) {
        let view = nav.load(site);

        let order = chainread.orders();
        let items = chainread.items();
        let userlist = chainread.users();
        let votings = chainread.votings();
        [order, items, userlist, votings] = await Promise.all([order, items, userlist, votings]);
        let allAssignments = items.rows.map(row => filter.votings_byItem(votings, row.key))
        //let allAssignments = await Promise.all(items.rows.map(row => chainread.fullvotings(row.key)));

        let orders = [];
        for (let i = 0; i < order.rows.length; i++) {
            let row = order.rows[i];

            if (row.buyer == config.user)
                continue;

            if (orders[row.itemKey] == undefined) {
                orders[row.itemKey] = [];
            }

            orders[row.itemKey].push(row);
        }

        let unfinishedItems = [];
        let element = "";
        for (let i = 0; i < items.rows.length; i++) {

            let row = items.rows[i];
            let assignments = allAssignments[i];

            if (row.reporter !== config.user)
                continue;

            element += '<div class="aspect-tab">';

            let ordercount = 0;
            let unlockedOrderCount = 0;
            if (orders[row.key] !== undefined) {
                ordercount = orders[row.key].length;
                unlockedOrderCount = orders[row.key][0].bkeyupload
                if (orders[row.key].length > 1)
                    unlockedOrderCount += orders[row.key].reduce((a, b) => a.bkeyupload + b.bkeyupload)
            }
            //   if (ordercount != 0) {
            element += '<input id="item-' + i + '" type="checkbox" class="aspect-input" name="aspect">';
            element += '<label for="item-' + i + '" class="aspect-label"></label>';
            //     }


            element += `<div class="aspect-content toggleable">
                        <div class="aspect-info">
                            <div class="chart-pie negative over50">
                                <div>
                                    <div class="first-fill"></div>
                                    <div class="second-fill" style="transform: rotate(249deg)"></div>
                                </div>
                            </div>
                            <span class="aspect-name">${row.title}</span>
                        </div>
                        <div class="aspect-stat">
                            <div class="all-opinions">
                                <span class="all-opinions-count">${ordercount}</span>
                                <span>orders</span>
                            </div>
                            <div>
                                <span class="positive-count">${row.accepts}</span>
                                <span class="negative-count">${row.votes - row.accepts}</span>
                            </div>
                        </div>
                        <div class="aspect-stat">
                            <div class="all-opinions">`;
            if (ordercount - unlockedOrderCount > 0) {
                element += `<form action="/view" method="post" class="inline">
                      <input type="hidden" name="itemKey" value="${row.key}">
                      <input type="submit" value="Unlock ${ordercount - unlockedOrderCount} reports" class="btn btn-primary btn-sm"/>
                    </form>`;
            }
            element += `<a href="/download?user=${row.reporter}&hash=${row.hash}" class="btn btn-sm btn-primary float-right ml-2">Download</a>`;

            element += '</div></div></div><div class="aspect-tab-content"><div class="sentiment-wrapper">';


            element += `<div class="table-responsive">
                       <table class="table align-items-center table-flush">
                        <tr>
                            <th>Verifier</th>
                            <th>Vote</th>
                            <th>Last Active</th>
                        </tr>
                        <tr>`;

            for (let iassign = 0; iassign < assignments.length; iassign++) {
                element += `<tr><td>${assignments[iassign].voter}</td><td>${assignments[iassign].rating > 0 ? Math.round(assignments[iassign].rating * 100) / 100 : '-'}</td><td>${this.getLastActive(assignments[iassign].voter, userlist)}</td></tr>`;
            }


            element += `</table>`;

            element += '</div></div><div class="aspect-tab-content"><div class="sentiment-wrapper">';

            if (orders[row.key] != undefined) {

                element += `<div class="table-responsive">
                       <table class="table align-items-center table-flush">
                        <tr>
                            <th>Buyer</th>
                            <th>Key Received</th>
                            <th>Key Sent</th>
                            <th>Buy Date</th>
                            <th>Reward</th>
                            <th>Status</th>
                        </tr>`;

                let rewardcount = 0;
                for (let i = 0; i < orders[row.key].length; i++) {
                    let order = orders[row.key][i];
                    element += '<tr>';

                    element += `<td><div class="label-ok">${order.buyer}</div></td>`;
                    element += `<td><div class="label-ok">${order.finished}</div></td>`;
                    element += `<td><div class="label-ok">${order.bkeyupload}</div></td>`;
                    element += `<td><div class="label-ok">${order.timestamp}</div></td>`;
                    element += `<td><div class="label-ok">${row.price}</div></td>`;


                    if (!order.bkeyupload) {
                        element += `<td><form action="/view" method="post" class="inline">
              <input type="hidden" name="orderKey" value="${order.key}">
              <input type="hidden" name="itemKey" value="${order.itemKey}">
              <input type="hidden" name="buyer" value="${order.buyer}">
              <input type="submit" value="Unlock" class="btn btn-primary btn-sm"/>
              </form></td>`;
                    } else {

                        //suggest redeem after period of 7 days
                        var date1 = new Date(order.timestamp);
                        var difference = (new Date().getTime() - date1.getTime()) / (1000 * 3600 * 24);
                        if (!order.finished && order.bkeyupload && difference > 7) {
                            element += `<td><form action="/view" method="post" class="inline">
                                <input type="hidden" name="orderKey" value="${order.key}">
                                <input type="hidden" name="type" value="redeem">
                                <input type="submit" value="Redeem" class="btn btn-danger btn-sm"/>
                            </form></td>`;
                        } else {
                            element += '<td>Unlocked</td>'
                        }
                    }

                    if (order.bkeyupload == 0) {
                        unfinishedItems.push(order.key);
                    }


                    rewardcount += row.price;

                    element += '</tr>';
                }
                element += `   <tfoot><tr> <td class="bold">Sum</td><td></td><td></td><td></td><td class="bold">${rewardcount}</td> </tr> </tfoot>`;

                element += '</table>';
                element += '</div>';
            }

            element += "</div></div></div>";

        }

        //place table;
        let view_dom = new jsdom.JSDOM(view);
        let $ = jquery(view_dom.window);
        $('.tablearea').html(element);

        if (unfinishedItems.length > 0) {
            $('#sendkeys').html(`
             <form action="/view" method="post">
                <input type="submit" value="Unlock ${unfinishedItems.length} reports for buyers" class="btn btn-primary btn-sm"/>
             </form>
            `);
        }

        view = view_dom.serialize();

        //send page to user
        nav.deliver(res, view, err, done);
    }
}