const config = require('../config.json');
const nav = require('./parent');
const jsdom = require("jsdom");
const jquery = require("jquery");
const site = "view";
const chainread = require('../logic/chainread');

module.exports = {
//view database with colored buttons and lables. With the encryption of the threat intelligence data.

    handleRequest(req, res) {
        try {

            chainread.orders().then(order => {
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




            });


        } catch
            (e) {
            this.loadPage(res, "FEHLER: Meldung war nicht erfolgreich. Verschlüsselung oder Blockchain/Datenbank Transaktion schlug fehl.", true);
        }
        this.loadPage(res);
    },


    async loadPage(res, err, done) {
        let view = nav.load(site);

        let orders = [];
        await chainread.orders().then(order => {
            for (let i = 0; i < order.rows.length; i++) {
                let row = order.rows[i];

                if (row.buyer == config.user)
                    continue;

                if (orders[row.itemKey] == undefined) {
                    orders[row.itemKey] = [];
                }

                orders[row.itemKey].push(row);
            }
        });


        chainread.items().then(result => {

                let unfinishedItems = [];

                let element = "";

                for (let i = 0; i < result.rows.length; i++) {
                    let row = result.rows[i];

                    if (row.reporter != config.user)
                        continue;


                    let ordercount = 0;
                    if (orders[row.key] != undefined) {
                        ordercount = orders[row.key].length;
                    }


                    element += '<div class="aspect-tab">';
                    if (ordercount != 0) {
                        element += '<input id="item-' + i + '" type="checkbox" class="aspect-input" name="aspect">';
                        element += '<label for="item-' + i + '" class="aspect-label"></label>';
                    }

                    element += `<div class="aspect-content ${ordercount > 0 ? 'toggleable' : 'defcursor'}">
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
                                        <span>sells</span>
                                    </div>
                                    <div>
                                        <span class="positive-count">${row.accepts}</span>
                                        <span class="negative-count">${row.votes - row.accepts}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="aspect-tab-content">
                                <div class="sentiment-wrapper">`;


                    if (orders[row.key] != undefined) {
                        element += '<div class="card-header border-0 text-orange">No sells yet</div>';


                        element += `<div class="table-responsive">
                               <table class="table align-items-center table-flush">
                                <tr>
                                    <th>Buyer</th>
                                    <th>Key Received</th>
                                    <th>Buy Date</th>
                                    <th>Reward</th>
                                </tr>`;

                        let rewardcount = 0;
                        for (let i = 0; i < orders[row.key].length; i++) {
                            let order = orders[row.key][i];
                            element += '<tr>';


                            element += `<td><div class="label-ok">${order.buyer}</div></td>`;
                            element += `<td><div class="label-ok">${order.finished}</div></td>`;
                            element += `<td><div class="label-ok">${order.timestamp}</div></td>`;
                            element += `<td><div class="label-ok">${row.price}</div></td>`;

                            if (order.finished == 0) {
                                unfinishedItems.push(order.key);
                            }


                            rewardcount += row.price;

                            element += '</tr>';
                        }
                        element += `   <tfoot><tr> <td class="bold">Sum</td><td></td><td></td> <td class="bold">${rewardcount}</td> </tr> </tfoot>`;


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
            ,

            function (err) {
                console.log(err);
            }
        );

    }
}