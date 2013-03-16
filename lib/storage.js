function Storage() {
    this.saveCsv = function(db, file) {
        var self = this;
        var Deferred = require("promised-io/promise").Deferred;
        var deferred = new Deferred();
        db.createCollection(file.collectionName, function(err, col) {
            db.collection(file.collectionName, function(err, col) {
                self.readRecords(file.path, function(document) {
                    col.save(document);
                }).then(function(count) {
                        deferred.resolve({file: file, count: count});
                    });
            });
        });

        return deferred.promise;
    };

    this.convertValue = function(value) {
        var Validator = require('validator').Validator;
        var v = new Validator();
        v.error = function(msg) {

        }
        var check = v.check(value),
            sanitize = require('validator').sanitize(value);

        if(check.isInt()) {
            return sanitize.toInt();
        }
        else if(check.isFloat()){
            return sanitize.toFloat();
        }
        else if(check.isDate()){
            return sanitize.toDate();
        }
        else if(value) {
            var lvalue = value.toLowerCase();
            if(lvalue == "true") {
                return true;
            }
            else if(lvalue == "false") {
                return false;
            }
        }

        return value;
    },

    this.readRecords = function(path, callback) {
        var self = this;
        var Deferred = require("promised-io/promise").Deferred;
        var deferred = new Deferred();
        var csv = require('csv');
        var fs = require('fs');
        var descriptor = null;
        var count = 0;

        csv()
            .from
            .stream(fs.createReadStream(path))
            .on('record', function(row, index){
                console.log('#'+index+' '+JSON.stringify(row));

                if(index == 0 || !descriptor) {
                    descriptor = row;
                }
                else {
                    var l = row.length;
                    var document = {};
                    for(var i = 0; i < l; i++) {
                        if(i < descriptor.length) {
                            document[descriptor[i]] = self.convertValue(row[i]);
                        }
                    }

                    count++;
                    if(callback)
                        callback.call(self, document);
                }
            })
            .on('end', function(){
                deferred.resolve(count);
            });

        return deferred.promise;
    }
}

module.exports = Storage;
