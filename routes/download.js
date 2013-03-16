var mongodb = require("mongodb");
var ObjectID = require("mongodb").ObjectID;
var Deferred = require("promised-io/promise").Deferred;

exports.start = function(options){
    /*var options =
    {
        path: path.join(__dirname, "data"),
        threadCount: 1,
        db: {name: "test", host: "localhost", port: 27017}
    };*/
    var deferred = new Deferred();

    var db = new mongodb.Db(options.db.name, new mongodb.Server(options.db.host, options.db.port), {w: -1, journal: false, fsync: false});
    db.open(function(err, db) {
        if(!err) {
            db.createCollection("transactions", function() {
                db.createCollection("states", function() {
                    db.collection("transactions", function(err, col) {
                        var transaction = {};
                        var startDate = +new Date();
                        col.save(transaction);

                        deferred.resolve(transaction);

                        var task = require("../lib/uploadingTask");
                        task(db, transaction, options)
                            .then(function() {
                                transaction.time = +new Date() - startDate;
                                transaction.status = "done";
                                col.save(transaction);
                                console.log("The End");
                            });
                    });
                });
            });
        }
    });

    return deferred.promise;
};

exports.getStatistics = function(transactionId, options) {
    var deferred = new Deferred();

    var db = new mongodb.Db(options.db.name, new mongodb.Server(options.db.host, options.db.port), {w: -1, journal: false, fsync: false});
    db.open(function(err, db) {
        if(!err) {
            db.collection("transactions", function(err, tcol) {
                tcol.findOne({"_id": ObjectID(transactionId)}, {status: 1, time: 1}, function(err, transaction){
                    if(!transaction) {
                        return deferred.resolve();
                    }
                    db.collection("states", function(err, col) {
                        var cursor = col.find({"transactionId": ObjectID(transactionId)});
                        var dto = {files: [], time: transaction.time, status: transaction.status};
                        cursor.toArray(function(err, states) {
                            var l = states.length;
                            for(var i = 0; i < l; i++){
                                var state = states[i];
                                var c = state.files.length;
                                for(var j = 0; j < c; j++) {
                                    dto.files.push(state.files[j]);
                                }
                            }

                            deferred.resolve(dto);
                        });
                    });
                });
            });
        }
    });

    return deferred.promise;
}