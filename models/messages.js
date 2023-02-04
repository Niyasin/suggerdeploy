const mongoose = require('mongoose');
const messageSchema = new mongoose.Schema({
    users:[{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
    }],
    data:[Object],
});

const Message=mongoose.model('message',messageSchema);
module.exports = Message;