const config = require('../config');
const nav = require('./parent');
const site = "marketplace";
//const db = require('../logic/mongodb');
const db = require('../logic/ipfs');
const chainwrite = require('../logic/chainwrite');
const jsdom = require("jsdom");
const jquery = require("jquery");
const chainread = require('../logic/chainread');

module.exports = {
    handleRequest(req, res) {

        let promise = chainwrite.buy(req.body.key);

        //generate the new page
        promise.then((result) => {
            this.loadPage(res, false, true);
        }, (err) => {
            this.loadPage(res, err);
        });

    },


//view blockchain data (dashboard) with some colored lables and buttons. Don't get dazzled by it's fanciness. :))
    async loadPage(res, err, done) {
        let view = nav.load(site);
        let orders = [];

        await chainread.orders().then(order => {
            for (let i = 0; i < order.rows.length; i++) {
                let row = order.rows[i];
                orders[row.itemKey] = row;
            }
        });

        let items = await chainread.items();

        //filter out items where user is verifier
        let votings = await chainread.votings();
        let verifierItems = votings.rows.filter(v => v.voter === config.user).map(v => v.itemKey)

        items.rows = items.rows
          .filter(i => i.reporter !== config.user)
          .filter(i => verifierItems.indexOf(i.key) === -1);

        let table = '<table class="table align-items-center table-flush">';
        table += `<tr>
            <th>Reporter</th>
            <th>Name</th>
            <th>Description</th>
            <th>Information</th>
            <th>Price</th>
            <th>Date</th>
            <th>Verification</th>
            <th>Action</th>
            </tr>`;
        for (let i = 0; i < items.rows.length; i++) {
            let row = items.rows[i];
            if (orders[row.key] != undefined) {
                if (orders[row.key].buyer == config.user) {
                    continue;
                }
            }

            table += '<tr>';

            //reporter
            table += '<td>' + row.reporter + '</td>';

            //title
            table += '<td><div class="label-primary">' + row.title + '</div></td>';

            //description
            table += '<td><div class="label-primary">' + row.description + '</div></td>';

            //information
            table += '<td><div class="label-ok">' + 'Votes: ' + row.votes + '</div></td>';

            //price
            table += '<td><div class="label-primary">' + row.price + '</div></td>';

            //date
            table += '<td>' + new Date(row.timestamp).toLocaleString() + '</td>';

            //Status
            let accepted = row.accepts < 3 ? false : true;
            table += '<td><div class="label-secondary ' + (accepted ? "text-green" : "text-orange") + '">' + (accepted ? "Verified" : "Pending") + '</div></td>';

            //buy
            table += '<td><form method="post" action="/marketplace">';
            table += '<input type="hidden" name="key" value="' + row.key + '"/>';
            table += '<input type="submit" class="btn btn-sm btn-primary" value="Buy">';
            table += '</form></td>';
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
    }
};