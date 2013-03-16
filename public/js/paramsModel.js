var ParametersModel = {
    dataPath: ko.observable().extend(
        {
            required: true
        }),
    threadCount: ko.observable(1).extend(
        {
            required: true,
            max: 16,
            min: 1,
            number:  true,
            pattern: {
                message: 'Must be an integer',
                params: '^[0-9]+$'
            }
        }),
    dbName: ko.observable().extend({ required: true }),
    dbHost: ko.observable("localhost").extend({ required: true }),
    dbPort: ko.observable(27017).extend(
        {
            required: true,
            number:  true,
            pattern: {
                message: 'Must be an integer',
                params: '^[0-9]+$'
            }
        }
    ),

    download: function() {
        if(this.isValid()) {
            var options = {
                path: this.dataPath(),
                threadCount: this.threadCount(),
                db:
                {
                    name: this.dbName(),
                    host: this.dbHost(),
                    port: this.dbPort()
                }

            };

            $.ajax({
                url: "/download",
                dataType: 'json',
                type: "POST",
                data: options
            })
            .success(function(transaction){
                if(transaction) {
                    document.location = "transaction.html?id=" + transaction._id + "&options=" + encodeURI(JSON.stringify(options));
                }
            });
        }
        else {
            this.errors.showAllMessages();
        }
    }
}