let mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    findOrCreate = require('mongoose-find-or-create');

const Thread = new Schema({
    comment: String,
    lasthit: Number,
    num: String,
    posts_count: Number,
    score: Number,
    subject: String,
    timestamp: Number,
    views: Number,
    // own properties
    board: String,
    notified: Boolean,
    approved: Boolean,
    isAlive: Boolean,
    lastSended: Number,
    configId: String,
});

Thread.plugin(findOrCreate, { saveIfFound: false });

module.exports = mongoose.model('Thread', Thread);