let fs = require("fs");
let md5 = require('md5');
let request = require("request");

module.exports = {
    hashObject: (object) => {
        md5(JSON.stringify(object))
    },
    download: function (uri, filename, callback) {
        request.head(uri, function (err, res, body) {
            if (err) callback(err, filename);
            else {
                let stream = request(uri);
                stream.pipe(
                    fs.createWriteStream(filename)
                        .on('error', function (err) {
                            callback(error, filename);
                            stream.read();
                        })
                )
                    .on('close', function () {
                        callback(null, filename);
                    });
            }
        });
    }
};