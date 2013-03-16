function StatisticsModel() {
    this.time = ko.observable();
    this.status = ko.observable();
    this.id = ko.observable();
    this.files = ko.observable();

    this.bind = function(id, options) {
        this.id(id);
        this.time(options.time);
        this.status(options.status ? options.status : "uploading...");

        var files = [];
        $.each(options.files, function() {
            files.push(new File(this));
        })
        this.files(files);
    }
}

function File(options){
    this.status = options.status ? options.status : "";
    this.time = options.time ? options.time : "";
    this.path = options.path;
    this.collectionName = options.collectionName;
    this.recordsCount = options.recordsCount ? options.recordsCount : "";
}