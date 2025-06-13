const mongoose = require('mongoose');

const actionHistorySchema = new mongoose.Schema({
    actionType: {
        type: String,
        required: true,
        enum: ['CREATE', 'UPDATE', 'DELETE']
    },
    todoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Todo'
    },
    previousState: {
        type: mongoose.Schema.Types.Mixed,
        required: false
    },
    newState: {
        type: mongoose.Schema.Types.Mixed,
        required: false
    },
    performedBy: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    isUndone: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('ActionHistory', actionHistorySchema); 