var express = require('express')
  , routes = require('./routes')
  , download = require('./routes/download')
  , http = require('http')
  , path = require('path');

var app = express();

app.configure(function(){
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.engine('html', require('ejs').renderFile);
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/*.html', function(req,res){
    res.render(path.basename(req._parsedUrl.pathname));
});
app.post('/download', function(req, res) {
    //TODO:I know, input must be validated
    download.start(req.body)
        .then(function(transaction) {
            res.send(transaction);
        });
});
app.post('/statistics', function(req, res) {
    //TODO:I know, input must be validated
    var p = req.body;
    download.getStatistics(p.transactionId, p.options)
        .then(function(dto) {
            res.send(dto);
        });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});