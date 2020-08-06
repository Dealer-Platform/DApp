const fs = require('fs');
const jsdom = require("jsdom");
const jquery = require("jquery");
const config = require('../config.json');

module.exports = {

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
        let footer = this.template_footer();
        let header = this.template_head();
        if(err || done)
            sitecontent = this.handleMessage(sitecontent, err, done);

        header += `    <script>
            $(document).ready(function () {

            $('#currentuser').html("<p>${config.user}</p>");`

        let path = "assets/img/theme/" + config.user + ".jpg"
        let img = fs.existsSync('views/' + path);
        if(img)
            header+= `$('#currentuserimage').replaceWith("<img src='${path}'/>");`

        header += `}); </script>`;

        res.send(header + sitecontent + footer);

    },
    handleMessage(tmpl, err, done) {
        let dom = new jsdom.JSDOM(tmpl);
        let $ = jquery(dom.window);
        let notifier = $('#notifier')
        if (err) {
            notifier.parent().addClass('bg-warning')
            notifier.html(err);
        }
        else if (done) {
            notifier.parent().addClass('bg-success')
            notifier.html("Success");
        }
        notifier.parent().removeClass('d-none')
        return dom.serialize();
    }

};



