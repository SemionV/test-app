function Uploader() {
    var path = require("path");
    var Deferred = require("promised-io/promise").Deferred;
    var Storage = require("./storage");

    this.upload = function(db, state) {
        var deferred = new Deferred();

        var files = state.files ? state.files : [];
        var l = files.length;
        var promises = [];

        var startDate = +new Date();
        for(var  i = 0; i < l; i++){
            var file = files[i];
            var storage = new Storage();

            file.status = "uploading...";
            promises.push(storage.saveCsv(db, file)
                .then(function(data) {
                    var file = data.file;
                    file.status = "done";
                    file.recordsCount = data.count;
                    file.time = +new Date() - startDate;

                    db.collection("states", function(err, col) {
                        col.save(state);
                    });
                }));
        }

        require("promised-io/promise").all(promises)
            .then(function() {
                deferred.resolve();
            });

        return deferred.promise;
    }
}

module.exports = Uploader;

/*var state =
{
    transactionId: "t1",
    files:
    [
        {
            path: "dir/name.csv",
            collectionName: "dir.name",
            recordsCount: 4,
            time: 30,
            status: "Uploading"
        }
    ]
}*/