var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
    userId: { type: String, required: true, index: true },
    defaultText: { type: String, required: true },
    covertText: { type: String, required: true },
    doodleIndex: { type: Number, default: 0 },
    authorizedTypes: { type: [String], default: [] }
});

module.exports = mongoose.model('User', UserSchema);