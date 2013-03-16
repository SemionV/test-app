function FileWalker() {
    var fs = require('fs');
    var path = require('path');
    var Deferred = require("promised-io/promise").Deferred;

    this.getFilesRecursive = function(rootDir, relativePath) {
        relativePath = relativePath ? relativePath : "";

        var deferred = new Deferred();

        var results = [];
        var self = this;
        var dir = path.join(rootDir, relativePath);
        if(fs.existsSync(dir))
        {
            var files = fs.readdirSync(dir);

            var l = files.length;
            for(var i = 0; i < l; i++) {
                var file = path.join(relativePath, files[i]);
                var stat = fs.statSync(path.join(rootDir, file));
                if(stat && stat.isDirectory()) {
                    self.getFilesRecursive(rootDir, file)
                        .then(function(items){
                            results = results.concat(items);
                        }, deferred.reject);
                }
                else {
                    results.push(file);
                }
            }
        }

        deferred.resolve(results);

        return deferred.promise;
    };
}

module.exports = new FileWalker();
