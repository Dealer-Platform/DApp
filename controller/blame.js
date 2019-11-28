const nav = require('./parent');
const chainread = require('../logic/chainread');
const jsdom = require("jsdom");
const jquery = require("jquery");
const site = "blame";

module.exports = {

    handleRequest(req, res) {
        let promise;
        if (req.body.freeze == "freeze") {
            //write on-chain a freeze request
            promise = chainwrite.blame(req.body.blamed, req.body.reason, true);
        } else if (req.body.freeze == "unfreeze") {
            //write on-chain a unfreeze request
            promise = chainwrite.blame(req.body.blamed, req.body.reason, false);
        } else if (req.body.hasOwnProperty("confirmation-btn")) {
            //write on-chain a confirmation of the blame
            promise = chainwrite.voteb(req.body.key, true);
        } else if (req.body.hasOwnProperty("rejection-btn")) {
            //write on-chain a rejections of the blame
            promise = chainwrite.voteb(req.body.key, false);
        }

        //catch the result of the write transaction with EOS and generate the page
        promise.then((result) => {
            this.loadPage(res, null, true);
        }, (err) => {
            this.loadPage(res, err, false);
        });


    },

    loadPage(res, err, done) {
        // let head 		= fs.readFileSync(path + 'head.html', 'utf8');
        // let navigation 	= fs.readFileSync(path + 'navigation.html', 'utf8');
        let blame = nav.load(site);

        if (err) {
            let message = "<div class='label-danger'>Interaktion fehlgeschlagen</div>" + err;
            let blame_error_dom = new jsdom.JSDOM(blame);
            let $ = jquery(blame_error_dom.window);
            $('p.error').html(message);
            blame = blame_error_dom.serialize();
        }
        if (done) {
            let message = "<div class='label-ok'>Interaktion erfolgreich</div>";
            let blame_error_dom = new jsdom.JSDOM(blame);
            let $ = jquery(blame_error_dom.window);
            $('p.error').html(message);
            blame = blame_error_dom.serialize()
        }

        let blamings = chainread.blamings();
        blamings.then(function (result) {
            //assemble table
            let table = '<table>';
            table += '<tr><th>#</th><th>Beschuldiger</th><th>Beschuldigter</th><th>Typ</th><th>Voteable</th><th>Begründung</th><th>Votes</th><th>Aktion</th></tr>';
            for (let i = 0; i < result.rows.length; i++) {
                let row = result.rows[i];
                let text = "";
                let label = "";
                table += '<tr>';

                //key
                table += '<td>' + JSON.stringify(row.key) + '</td>';
                //blamer
                table += '<td>' + JSON.stringify(row.blamer).substring(1, JSON.stringify(row.blamer).length - 1) + '</td>';
                //blamed
                table += '<td>' + JSON.stringify(row.blamed).substring(1, JSON.stringify(row.blamed).length - 1) + '</td>';
                //typ
                text = "Sperrung";
                label = 'class="label-danger"';
                if (JSON.stringify(row.freeze) == 0) {
                    text = "Entsperrung";
                    label = 'class="label-ok"';
                }
                table += '<td><div ' + label + '>' + text + '</div></td>';
                //voteable
                text = "Offen";
                label = 'class="label-primary"';
                if (JSON.stringify(row.voteable) == 0) {
                    text = "<b>Abgeschlossen</b>";
                    label = 'class="label-secondary"';
                }
                table += '<td><div ' + label + '>' + text + '</div></td>';
                //reason
                table += '<td>' + JSON.stringify(row.reason).substring(1, JSON.stringify(row.reason).length - 1) + '</td>';
                //confirmations/votes
                table += '<td>' + JSON.stringify(row.confirmations) + "/" + JSON.stringify(row.votes) + '</td>';

                //ACTION BUTTON
                if (JSON.stringify(row.voteable) == 1) {
                    table += '<td>';
                    table += '<form action="/blame" method="post">';
                    table += '<input id="key" name="key" type="hidden" value="' + JSON.stringify(row.key) + '" />';
                    table += '<input name="confirmation-btn" class="btn btn-success btn" type="submit" value="Richtig"> ';
                    table += '<input name="rejection-btn" class="btn btn-danger btn" type="submit" value="Falsch">';
                    table += '</form>';
                    table += '</td>';
                }

                table += '</tr>';
            }
            table += '</table>';

            //place table;
            let blame_dom = new jsdom.JSDOM(blame);
            let $ = jquery(blame_dom.window);
            $('p.blamings').html(table);
            blame = blame_dom.serialize();

            //send page to user
            // res.send('<!DOCTYPE html><html lang="de">' + template.head() + '<body>' + template.navigation() + blame + '</body></html>');
            nav.deliver(res, blame);

        }, function (err) {
            console.log(err);
        });
    }
};