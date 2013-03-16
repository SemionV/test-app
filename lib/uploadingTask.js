module.exports = function(db, transaction, options) {
    var Deferred = require("promised-io/promise").Deferred;
    var deferred = new Deferred();

    db.collection("states", function(err, col) {
        var setup = new Setup();
        setup.setupState(options, transaction)
            .then(function(state) {
                if(!state.files.length) {
                    return deferred.resolve();
                }

                if(options.threadCount > 1) {
                    var states = setup.splitState(state, options.threadCount);
                    var l = states.length;
                    var cluster = require('cluster');
                    cluster.setupMaster({exec: "./lib/worker.js"});
                    var counter = 0;
                    for(var i = 0; i < l; i++) {
                        var subState = states[i];
                        if(subState.files.length > 0){
                            col.save(subState);
                            cluster.fork({__upload: JSON.stringify({state: subState._id, options: options})});
                            counter++;
                        }
                    }

                    cluster.on('exit', function(worker, code, signal) {
                        if(--counter == 0)
                            deferred.resolve();
                    });
                }
                else {
                    col.save(state);
                    (new (require("./uploader")))
                        .upload(db, state)
                        .then(deferred.resolve);
                }
            });
    });

    return deferred.promise;
}

function Setup() {
    var Deferred = require("promised-io/promise").Deferred;
    var path = require("path");

    this.setupState = function(options,transaction) {
        var deferred = new Deferred();

        var walker = require("./fileWalker");
        walker.getFilesRecursive(options.path)
            .then(function(files) {
                var state =
                {
                    transactionId: transaction._id,
                    files:[]
                };
                var l = files.length;
                for(var  i = 0; i < l; i++){
                    var file = files[i];
                    var extension = path.extname(file);
                    if(extension && extension.toLowerCase() == ".csv") {
                        var collectionName = path.join(path.dirname(file), path.basename(file, extension));
                        var pattern = path.sep == "\\" ? "\\\\" : "/";
                        collectionName = collectionName.replace(new RegExp(pattern, "g"), ".");

                        state.files.push({
                            path: path.join(options.path, file),
                            collectionName: collectionName,
                            status: ""
                        });
                    }
                }

                deferred.resolve(state);
            });

        return deferred.promise;
    };

    this.splitState =function(masterState, threadCount) {
        var l = masterState.files.length;
        var states = [];

        for(var i = 0; i < threadCount; i++) {
            states.push({
                transactionId: masterState.transactionId,
                files: []
            });
        }

        var j = 0;
        for(var i = 0; i < l; i++){
            states[j].files.push(masterState.files[i]);
            j = j == threadCount - 1 ? 0 : j + 1;
        }

        return states;
    };
}