const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
    user_id:{
        type: String,
        required: true,
        max: 255
    },
    expires_in: {
        type: String,
        max: 10,
        required: true
    },
    refresh_token: {
        type: String,
        required: true,
        max: 255
    }
});

module.exports = mongoose.model('Token', tokenSchema);