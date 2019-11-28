const config = require('../config.json');
const nav = require('./parent');
const chainwrite = require('../logic/chainwrite');
const fs = require('fs');
const jsdom = require("jsdom");
const jquery = require("jquery");
const site = "mypage";
const chainread = require('../logic/chainread');

module.exports = {
    handleRequest(req, res) {

    },
    async loadPage(res, err, done) {
        // let head 		= fs.readFileSync(path + 'head.html', 'utf8');
        // let navigation 	= fs.readFileSync(path + 'navigation.html', 'utf8');
        let mypage = nav.load(site);

        let ordercount = 0;
        await chainread.orders().then(order => {
            for (let i = 0; i < order.rows.length; i++) {
                let row = order.rows[i];
                if (row.buyer == config.user) {
                    ordercount++;
                }
            }
        });

        let reportcount = 0;
        await chainread.items().then(item => {
            for (let i = 0; i < item.rows.length; i++) {
                let row = item.rows[i];
                if (row.buyer == config.user) {
                    reportcount++;
                }
            }
        });


        let analysiscount = 0;
        await chainread.votings().then(voting => {
            for (let i = 0; i < voting.rows.length; i++) {
                let row = voting.rows[i];
                if (row.buyer == config.user) {
                    analysiscount++;
                }
            }
        });




        let mypage_dom = new jsdom.JSDOM(mypage);
        let $ = jquery(mypage_dom.window);
        $('.reportcount').html(reportcount);
        $('.analysiscount').html(analysiscount);
        $('.ordercount').html(ordercount);
        mypage = mypage_dom.serialize();

        nav.deliver(res, mypage);
    }
};