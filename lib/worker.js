var cluster = require("cluster");
var mongodb = require("mongodb");
var ObjectID = require("mongodb").ObjectID;
var worker = cluster.worker
var params = JSON.parse(process.env.__upload);
var options = params.options;
var stateId = ObjectID(params.state);


var stop = false;
var db = new mongodb.Db(options.db.name, new mongodb.Server(options.db.host, options.db.port), {w: -1, journal: false, fsync: false});
db.open(function(err, db) {
    if(!err) {
        db.collection("states", function(err, col) {
            col.findOne({"_id": stateId}, function(err, state){
                (new (require("./uploader")))
                    .upload(db, state)
                    .then(function() {
                        stop = true;
                    });
            });
        });
    }
});

(function listen() {
    setTimeout(function () {
        if(!stop){
            listen();
        }
        else {
            worker.kill();
        }
    }, 1);
})();