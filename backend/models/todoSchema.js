const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
    title: {type: String, required: true},
    description: {type: String, required: true},
    completed: {type: Boolean, default: false},
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    createdBy: {type: String, required: true},
    lastUpdatedBy: {type: String, required: true},
    createdAt: {type: Date, default: Date.now},
    updatedAt: {type: Date}
});

module.exports = mongoose.model('Todo', todoSchema);