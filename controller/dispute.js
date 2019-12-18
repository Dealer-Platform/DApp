const config = require('../config.json');
const nav = require('./parent');
const jsdom = require("jsdom");
const jquery = require("jquery");
const db = require('../logic/ipfs');

const chainread = require('../logic/chainread');
const site = "dispute";

module.exports = {

    handleRequest(req, res) {
    },


//get order page and its buttons
    async loadPage(res, err, done) {
        let orders = nav.load(site);
        let order_items = await chainread.orders();
        let items = await chainread.items();

        let voteassignments = [];

        await chainread.votings().then(voting => {
            for (let i = 0; i < voting.rows.length; i++) {
                let row = voting.rows[i];

                if (row.voter !== config.user)
                    continue;

                voteassignments[row.itemKey] = row;
            }
        });


        let table_dispute = '<table class="table align-items-center table-flush">';
        table_dispute += '<tr><th>Item</th><th>Reporter</th><th>Name</th><th>Description</th></th><th>Orderdate</th></tr>';
        for (let i = 0; i < order_items.rows.length; i++) {
            let row = order_items.rows[i];

            //only show disputed incidents
            // if (row.dispute == 0)
            //     continue;

            //only show incidents where user is involved (buyer, seller or verifier)
            if (row.buyer !== config.user && row.seller !== config.user && voteassignments[row.itemKey] != undefined)
                continue;


            let item = items.rows.filter(i => i.key === row.itemKey)[0];

            table_dispute += '<tr>';
            table_dispute += '<td>' + row.itemKey + '</td>';
            table_dispute += '<td>' + row.seller + '</td>';
            table_dispute += '<td>' + item.title + '</td>';
            table_dispute += '<td>' + item.description + '</td>';
            table_dispute += '<td>' + row.timestamp + '</td>';

            table_dispute += '</tr>';
        }
        table_dispute += '</table>';

        //place tables
        let orders_dom = new jsdom.JSDOM(orders);
        let $ = jquery(orders_dom.window);
        $('.table-responsive').html(table_dispute);
        orders = orders_dom.serialize();

        nav.deliver(res, orders, err, done);
    }
};