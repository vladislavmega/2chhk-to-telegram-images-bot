let mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    findOrCreate = require('mongoose-find-or-create');

const Images = new Schema({
    md5: String,
    fileFormat: String,
    width: Number,
    height: Number,
    ppi:{
        width: Number,
        height: Number,
    },
    colorType: String,
    pHash: String,
});

Images.plugin(findOrCreate, { saveIfFound: false });

module.exports = mongoose.model('Images', Images);