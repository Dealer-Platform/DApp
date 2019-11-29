const fs = require('fs');
const jsdom = require("jsdom");
const jquery = require("jquery");
const config = require('../config.json');
const chainread = require('../logic/chainread');


module.exports = {

    head() {
        return fs.readFileSync(global.viewsdir + 'head.html', 'utf8');
    },
    navigation() {
        return fs.readFileSync(global.viewsdir + 'navigation.html', 'utf8');
    },
    load(site) {
        return fs.readFileSync(global.viewsdir + site + '.html', 'utf8');
    },
    template_head() {
        return fs.readFileSync(global.viewsdir + 'template_head.html', 'utf8');
    },
    template_footer() {
        return fs.readFileSync(global.viewsdir + 'template_footer.html', 'utf8');
    },
    async deliver(res, sitecontent, err, done) {
        //res.send('<!DOCTYPE html><html lang="de">' + this.head() + '<body>' + this.navigation() + sitecontent + '</body></html>');
        let footer = this.handleMessage(this.template_footer(), err, done);
        let header = this.template_head();

        let user = await chainread.users_byUser(config.user);

        header += `    <script>
        $(document).ready(function () {
            $('#currentuser').html("<p>${config.user} (${user.rows[0].balance} Tokens)</p>");
            $('#currentuserimage').attr("src", "assets/img/theme/${config.user}.jpg");
        });
        </script>`;

        res.send(header + sitecontent + footer);

    },
    handleMessage(tmpl, err, done) {
        if (err) {
            tmpl = this.errormsg(tmpl, err);
        }
        if (done) {
            tmpl = this.successmsg(tmpl, err);
        }
        return tmpl;
    },
    errormsg(report, error) {
        let message = "<div class='bg-warning'>" + error + "</div>";
        let report_error_dom = new jsdom.JSDOM(report);
        let $ = jquery(report_error_dom.window);
        $('p.error').html(message);
        return report_error_dom.serialize();
    },
    successmsg(report, info) {
        let message = "<div class='bg-success'>Success</div>";
        let report_error_dom = new jsdom.JSDOM(report);
        let $ = jquery(report_error_dom.window);
        $('p.success').html(message);
        return report_error_dom.serialize()
    }

};



