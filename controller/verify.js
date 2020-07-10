const nav = require('./parent');
const chainwrite = require('../logic/chainwrite');
const db = require('../logic/ipfs')
const chainread = require('../logic/chainread');
const jsdom = require("jsdom");
const jquery = require("jquery");
const config = require('../config');
const site = "verify";
const utils = require('../logic/utils.js')

module.exports = {

    async handleRequest(req, res) {
        let item = req.body.item;
        let rating = req.body.rating;
        try {
            await chainwrite.verify(item, true, rating);
        } catch (e) {
            console.log(e);
            this.loadPage(res, e, false);
        }

        this.loadPage(res, false, true);

    },
    async loadPage(res, err, done) {
        let view = nav.load(site);
        let votings = [];

        let votingsPromise = chainread.votings().then(voting => {
            for (let i = 0; i < voting.rows.length; i++) {
                let row = voting.rows[i];
                if (row.voter == config.user) {
                    votings[row.itemKey] = row;
                    votings[row.itemKey].encryptionKey = true;
                }
            }
        });

        let items = chainread.items();
        //let users = chainread.users();
        [,items] = await Promise.all([votingsPromise, items]);

        let table = '<table class="table align-items-center table-flush">';
        table += `<tr>
        <th>Id</th>
        <th>Reporter</th>
        <th>Information</th>
        <th>Description</th>
        <th>Price</th>
        <th>Status</th>
        <th>Download</th>
        <th>Status</th>
        </tr>`;

        //check if key available
        // let votingReporters = utils.innerJoin(votings, items.rows, ({key, itemKey }, {key: uid, reporter, hash}) =>
        //     itemKey === uid && {key, itemKey, reporter, hash})
        // votingReporters = utils.innerJoin(votingReporters, users.rows, ({key, itemKey, reporter, hash}, {user, ipns}) =>
        //     reporter === user && {key, itemKey, hash, ipns})
        //
        // let keys = await Promise.all(
        //     votingReporters.map(v => {
        //         return new Promise((resolve, reject) => {
        //             let id = v.itemKey
        //             db.read_key({"ipns": v.ipns}, v.hash).then((key) => {
        //                 resolve({id: id, key: key})
        //             })
        //         })
        //     })
        // )
        // for (let key of keys) votings[key.id].encryptionKey = key.key;

        for (let i = 0; i < items.rows.length; i++) {
            let row = items.rows[i];
            if (votings[row.key] === undefined)
                continue;

            table += '<tr>';

            //id
            table += '<td>' + row.key + '</td>';
            //reporter
            table += '<td>' + row.reporter + '</td>';

            //information
            table += '<td><div class="label-ok">' + 'Votes: ' + row.votes + '<br> Quality: ' + row.rating + '</div></td>';

            //description
            table += '<td><div class="label-primary" title="' + row.description + '">' + utils.truncate(row.description, 70) + '</div></td>';

            //price
            table += '<td><div class="label-primary">' + row.price + '</div></td>';

            //Status
            let accepted = row.accepts >= 3;
            table += '<td><div class="label-secondary ' + (accepted ? "text-green" : "text-orange") + '">' + (accepted ? "Verified" : "Pending") + '</div></td>';

            table += votings[row.key].encryptionKey ?
                '<td><a href="/download?user=' + row.reporter + '&hash=' + row.hash + '" class="btn btn-sm btn-primary">Download</a></td>' :
                '<td>No key available</td>';

            if (votings[row.key].done === 0) {
                //Download
                // table += '<td>';
                // table += '<input type="hidden" name="item" value="' + row.key + '"/>';
                // table += '<input type="hidden" name="key" value="vote"/>';
                // table += '<label>Rating: </label>';
                // table += '<input type="number" name="rating" value="1" id="intLimitTextBox" style="margin-right: 10px;"/>';
                table += '<td><button onclick="initModal('+row.key+')" class="btn btn-success">Verify</button></td>';
                // table += '</td>';
            } else {
                    table += '<td><div class="label-primary text-green">Rating: ' + Number(votings[row.key].rating).toFixed(2) + '</div></td>';


            }

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