const config = require('../config.json');
const nav = require('./parent');
const jsdom = require("jsdom");
const jquery = require("jquery");
const site = "view";
const chainread = require('../logic/chainread');

module.exports = {
//view database with colored buttons and lables. With the encryption of the threat intelligence data.
    async loadPage(res, err, done) {
        let view = nav.load(site);

        let orders = [];
        await chainread.orders().then(order => {
            for (let i = 0; i < order.rows.length; i++) {
                let row = order.rows[i];

                if (orders[row.itemKey] == undefined) {
                    orders[row.itemKey] = [];
                }

                orders[row.itemKey].push(row);
            }
        });


        chainread.items().then(result => {
                let table = "";


                for (let i = 0; i < result.rows.length; i++) {
                    let row = result.rows[i];

                    if (row.reporter != config.user)
                        continue;

                    table += `<div class = "card-header border-0" > 
                                <h3  class = "mb-0" style="display: inline;" > Incident: ${row.title} </h3> 
                                <span class="label-ok">(Votes:   ${row.votes},  Accepts:   ${row.accepts},   Quality:   ${row.rating}  )</span>
                                <br/>
                                <small>${row.description}</small>
                   
                               </div>`;

                    if (orders[row.key] == undefined) {
                        table += '<div class="card-header border-0 text-orange">No sells yet</div>';
                        continue;
                    } else {

                        table += `<div class="table-responsive">
                               <table class="table align-items-center table-flush">
                                <tr>
                                    <th>Buyer</th>
                                    <th>Item Received</th>
                                    <th>Buy Date</th>
                                    <th>Reward</th>
                                </tr>`;

                        let rewardcount = 0;
                        for (let i = 0; i < orders[row.key].length; i++) {
                            let order = orders[row.key][i];
                            table += '<tr>';


                            table += `<td><div class="label-ok">${order.buyer}</div></td>`;
                            table += `<td><div class="label-ok">${order.finished}</div></td>`;
                            table += `<td><div class="label-ok">${order.timestamp}</div></td>`;
                            table += `<td><div class="label-ok">${row.price}</div></td>`;

                            rewardcount += row.price;

                            table += '</tr>';
                        }
                        table += `   <tfoot><tr> <td class="bold">Sum</td><td></td><td></td> <td class="bold">${rewardcount}</td> </tr> </tfoot>`;


                        table += '</table>';
                        table += '</div>';
                    }


                }


                //place table;
                let view_dom = new jsdom.JSDOM(view);
                let $ = jquery(view_dom.window);
                $('.tablearea').html(table);
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