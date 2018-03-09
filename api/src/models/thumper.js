var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');

autoIncrement.initialize(mongoose.connection);

var Schema = mongoose.Schema;

var ThumperSchema = new Schema({
    userId: String,
    id: Number,
    handle: String,
    type: String,
    name: String,
    valueType: String,
    customUrl: String,
    aliases: [String],
    data: String,
    sticky: Boolean,
    authorizedThumpers: [Number],
    ogTitle: String
});

ThumperSchema.plugin(autoIncrement.plugin, { model: 'Thumper', field: 'id' });

module.exports = mongoose.model('Thumper', ThumperSchema);