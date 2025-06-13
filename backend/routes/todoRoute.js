const express = require('express');
const router = express.Router();
// const auth = require('../middleware/auth')
const Todo = require('../models/todoSchema');
const User = require('../models/userSchema');
const ActionHistory = require('../models/actionHistorySchema');


// Get all todos
router.get('/', async (req, res) => {
    try {
        const todos = await Todo.find().sort({ createdAt: -1 });
        res.status(200).json(todos);
    } catch (error) {
        console.error('Error fetching todos:', error);
        res.status(500).json({ message: 'Error fetching todos', error: error.message });
    }
});

// Create a new todo
router.post('/', async (req, res) => {
    try {
        const { title, description, username } = req.body;
        
        if (!title || !description || !username) {
            return res.status(400).json({ message: 'Title, description, and username are required' });
        }

        const newTodo = new Todo({
            title,
            description,
            completed: false,
            createdBy: username,
            lastUpdatedBy: username
        });

        const savedTodo = await newTodo.save();
        
        try {
            // Record the action in history
            await new ActionHistory({
                actionType: 'CREATE',
                todoId: savedTodo._id,
                previousState: {},  // Empty object for CREATE
                newState: savedTodo.toObject(),
                performedBy: username
            }).save();
        } catch (historyError) {
            console.error('Error saving action history:', historyError);
            // Continue even if history saving fails
        }
        
        req.app.get('io').emit('todoCreated', savedTodo);
        res.status(201).json(savedTodo);
    } catch (error) {
        console.error('Error creating todo:', error);
        res.status(500).json({ message: 'Error creating todo', error: error.message });
    }
});

// Update a todo
router.put('/:id', async (req, res) => {
    try {
        const { title, description, completed, username } = req.body;
        
        if (!username) {
            return res.status(400).json({ message: 'Username is required for updates' });
        }

        const previousTodo = await Todo.findById(req.params.id);
        if (!previousTodo) {
            return res.status(404).json({ message: 'Todo not found' });
        }

        const updatedTodo = await Todo.findByIdAndUpdate(
            req.params.id,
            { 
                title, 
                description, 
                completed,
                lastUpdatedBy: username,
                updatedAt: new Date()
            },
            { new: true }
        );
        
        try {
            // Record the action in history
            await new ActionHistory({
                actionType: 'UPDATE',
                todoId: updatedTodo._id,
                previousState: previousTodo.toObject(),
                newState: updatedTodo.toObject(),
                performedBy: username
            }).save();
        } catch (historyError) {
            console.error('Error saving action history:', historyError);
            // Continue even if history saving fails
        }
        
        req.app.get('io').emit('todoUpdated', updatedTodo);
        res.status(200).json(updatedTodo);
    } catch (error) {
        console.error('Error updating todo:', error);
        res.status(500).json({ message: 'Error updating todo', error: error.message });
    }
});

// Delete a todo
router.delete('/:id', async (req, res) => {
    try {
        const { username } = req.body;
        
        if (!username) {
            return res.status(400).json({ message: 'Username is required for deletion' });
        }

        const todo = await Todo.findById(req.params.id);
        if (!todo) {
            return res.status(404).json({ message: 'Todo not found' });
        }

        await Todo.findByIdAndDelete(req.params.id);
        
        try {
            // Record the action in history
            await new ActionHistory({
                actionType: 'DELETE',
                todoId: todo._id,
                previousState: todo.toObject(),
                newState: {},  // Empty object for DELETE
                performedBy: username
            }).save();
        } catch (historyError) {
            console.error('Error saving action history:', historyError);
            // Continue even if history saving fails
        }
        
        req.app.get('io').emit('todoDeleted', req.params.id);
        res.status(200).json({ message: 'Todo deleted successfully' });
    } catch (error) {
        console.error('Error deleting todo:', error);
        res.status(500).json({ message: 'Error deleting todo', error: error.message });
    }
});

// Undo last action
router.post('/undo', async (req, res) => {
    try {
        const { username } = req.body;
        if (!username) {
            return res.status(400).json({ message: 'Username is required' });
        }

        const lastAction = await ActionHistory.findOne({ 
            performedBy: username,
            isUndone: { $ne: true }
        }).sort({ timestamp: -1 });

        if (!lastAction) {
            return res.status(404).json({ message: 'No actions to undo' });
        }

        let result;
        switch (lastAction.actionType) {
            case 'CREATE':
                await Todo.findByIdAndDelete(lastAction.todoId);
                result = { message: 'Create action undone', todoId: lastAction.todoId };
                break;
            case 'UPDATE':
                const restoredTodo = await Todo.findByIdAndUpdate(
                    lastAction.todoId,
                    lastAction.previousState,
                    { new: true }
                );
                result = restoredTodo;
                break;
            case 'DELETE':
                const recreatedTodo = await Todo.create(lastAction.previousState);
                result = recreatedTodo;
                break;
        }

        // Move the action to a separate collection for redo
        await ActionHistory.findByIdAndDelete(lastAction._id);
        await new ActionHistory({
            ...lastAction.toObject(),
            _id: undefined,
            isUndone: true
        }).save();

        req.app.get('io').emit('actionUndone', { action: lastAction, result });
        res.status(200).json(result);
    } catch (error) {
        console.error('Error undoing action:', error);
        res.status(500).json({ message: 'Error undoing action', error: error.message });
    }
});

// Redo last undone action
router.post('/redo', async (req, res) => {
    try {
        const { username } = req.body;
        if (!username) {
            return res.status(400).json({ message: 'Username is required' });
        }

        const lastUndoneAction = await ActionHistory.findOne({ 
            performedBy: username,
            isUndone: true 
        }).sort({ timestamp: -1 });

        if (!lastUndoneAction) {
            return res.status(404).json({ message: 'No actions to redo' });
        }

        let result;
        switch (lastUndoneAction.actionType) {
            case 'CREATE':
                const recreatedTodo = await Todo.create(lastUndoneAction.newState);
                result = recreatedTodo;
                break;
            case 'UPDATE':
                const updatedTodo = await Todo.findByIdAndUpdate(
                    lastUndoneAction.todoId,
                    lastUndoneAction.newState,
                    { new: true }
                );
                result = updatedTodo;
                break;
            case 'DELETE':
                await Todo.findByIdAndDelete(lastUndoneAction.todoId);
                result = { message: 'Delete action redone', todoId: lastUndoneAction.todoId };
                break;
        }

        // Remove the undone action
        await ActionHistory.findByIdAndDelete(lastUndoneAction._id);

        req.app.get('io').emit('actionRedone', { action: lastUndoneAction, result });
        res.status(200).json(result);
    } catch (error) {
        console.error('Error redoing action:', error);
        res.status(500).json({ message: 'Error redoing action', error: error.message });
    }
});

module.exports = router; 