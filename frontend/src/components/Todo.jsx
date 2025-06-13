import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const Todo = () => {
  const [todos, setTodos] = useState([]);
  const [users, setUsers] = useState([]);
  const [newTodo, setNewTodo] = useState({ title: '', description: '' });
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const navigate = useNavigate();

  // Socket connection
  useEffect(() => {
    const socket = io(import.meta.env.VITE_BACKEND_URL);
    const username = localStorage.getItem('username');
    const token = localStorage.getItem('token');

    if (!username || !token) {
      navigate('/');
      return;
    }

    // Set current user
    setCurrentUser(username);

    // Join the room with username
    socket.emit('join', { username });

    // Listen for user list updates
    socket.on('userList', (userList) => {
      setUsers(userList);
    });

    // Listen for todo updates
    socket.on('todoCreated', (todo) => {
      setTodos(prev => [todo, ...prev]);
      setCanUndo(true);
    });

    socket.on('todoUpdated', (updatedTodo) => {
      setTodos(prev => prev.map(todo => 
        todo._id === updatedTodo._id ? updatedTodo : todo
      ));
      setCanUndo(true);
    });

    socket.on('todoDeleted', (deletedId) => {
      setTodos(prev => prev.filter(todo => todo._id !== deletedId));
      setCanUndo(true);
    });

    // Listen for undo/redo events
    socket.on('actionUndone', ({ action, result }) => {
      if (action.actionType === 'CREATE') {
        setTodos(prev => prev.filter(todo => todo._id !== action.todoId));
      } else if (action.actionType === 'UPDATE') {
        setTodos(prev => prev.map(todo => 
          todo._id === action.todoId ? result : todo
        ));
      } else if (action.actionType === 'DELETE') {
        setTodos(prev => [result, ...prev]);
      }
      setCanUndo(false);
      setCanRedo(true);
    });

    socket.on('actionRedone', ({ action, result }) => {
      if (action.actionType === 'CREATE') {
        setTodos(prev => [result, ...prev]);
      } else if (action.actionType === 'UPDATE') {
        setTodos(prev => prev.map(todo => 
          todo._id === action.todoId ? result : todo
        ));
      } else if (action.actionType === 'DELETE') {
        setTodos(prev => prev.filter(todo => todo._id !== action.todoId));
      }
      setCanUndo(true);
      setCanRedo(false);
    });

    // Cleanup on unmount
    return () => {
      socket.emit('leave', { username });
      socket.disconnect();
    };
  }, [navigate]);

  // Fetch todos
  useEffect(() => {
    const fetchData = async () => {
      try {
        const todosRes = await axios.get(import.meta.env.VITE_TODOS_URL);
        setTodos(todosRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  const handleCreateTodo = async (e) => {
    e.preventDefault();
    try {
      if (!currentUser) {
        navigate('/');
        return;
      }

      const response = await axios.post(import.meta.env.VITE_TODOS_URL, {
        ...newTodo,
        username: currentUser
      });

      if (response.status === 201) {
        setNewTodo({ title: '', description: '' });
      }
    } catch (error) {
      console.error('Error creating todo:', error);
      alert(error.response?.data?.message || 'Failed to create todo. Please try again.');
    }
  };

  const handleUpdateTodo = async (id, updates) => {
    try {
      if (!currentUser) {
        navigate('/');
        return;
      }

      const response = await axios.put(`${import.meta.env.VITE_TODOS_URL}/${id}`, {
        ...updates,
        username: currentUser
      });

      if (response.status === 200) {
        setTodos(prev => prev.map(todo => 
          todo._id === id ? response.data : todo
        ));
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error('Error updating todo:', error);
      alert(error.response?.data?.message || 'Failed to update todo. Please try again.');
    }
  };

  const handleDeleteTodo = async (id) => {
    try {
      if (!currentUser) {
        navigate('/');
        return;
      }

      await axios.delete(`${import.meta.env.VITE_TODOS_URL}/${id}`, {
        data: { username: currentUser }
      });
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error deleting todo:', error);
      alert(error.response?.data?.message || 'Failed to delete todo. Please try again.');
    }
  };

  const handleUndo = async () => {
    try {
      if (!currentUser) {
        navigate('/');
        return;
      }

      await axios.post(`${import.meta.env.VITE_TODOS_URL}/undo`, {
        username: currentUser
      });
    } catch (error) {
      console.error('Error undoing action:', error);
      alert(error.response?.data?.message || 'Failed to undo action. Please try again.');
    }
  };

  const handleRedo = async () => {
    try {
      if (!currentUser) {
        navigate('/');
        return;
      }

      await axios.post(`${import.meta.env.VITE_TODOS_URL}/redo`, {
        username: currentUser
      });
    } catch (error) {
      console.error('Error redoing action:', error);
      alert(error.response?.data?.message || 'Failed to redo action. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Sidebar - Users List */}
      <div className="w-64 bg-white shadow-lg p-4">
        <h2 className="text-center text-xl font-bold mb-4">Online Users</h2>
        <div className="space-y-2">
          {users.map(user => (
            <div 
              key={user.id} 
              className={`flex items-center space-x-2 p-2 hover:bg-gray-100 rounded ${
                user.username === currentUser ? 'bg-blue-50' : ''
              }`}
            >
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-medium">
                {user.username}
                {user.username === currentUser && ' (You)'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6">
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Welcome, {currentUser}!</h2>
          <div className="space-x-2">
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className={`px-4 py-2 rounded ${
                canUndo 
                  ? 'bg-blue-500 text-white hover:bg-blue-600' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Undo
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className={`px-4 py-2 rounded ${
                canRedo 
                  ? 'bg-blue-500 text-white hover:bg-blue-600' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Redo
            </button>
          </div>
        </div>
        
        {/* New Todo Form */}
        <form onSubmit={handleCreateTodo} className="mb-6 bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Create New Todo</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Title"
              value={newTodo.title}
              onChange={(e) => setNewTodo(prev => ({ ...prev, title: e.target.value }))}
              className="w-full p-2 border rounded"
              required
            />
            <textarea
              placeholder="Description"
              value={newTodo.description}
              onChange={(e) => setNewTodo(prev => ({ ...prev, description: e.target.value }))}
              className="w-full p-2 border rounded"
              required
            />
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Add Todo
            </button>
          </div>
        </form>

        {/* Todos List */}
        <div className="space-y-4">
          {todos.map(todo => (
            <div
              key={todo._id}
              className={`bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-md transition-shadow ${
                todo.completed ? 'border-l-4 border-green-500 bg-green-50' : ''
              }`}
              onClick={() => {
                setSelectedTodo(todo);
                setIsModalOpen(true);
              }}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {todo.completed && (
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    <h3 className={`text-lg font-semibold ${todo.completed ? 'line-through text-gray-500' : ''}`}>
                      {todo.title}
                    </h3>
                  </div>
                  <p className={`text-gray-600 ${todo.completed ? 'line-through text-gray-400' : ''}`}>
                    {todo.description}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  <div>Created: {formatDate(todo.createdAt)} by {todo.createdBy}</div>
                  {todo.updatedAt && (
                    <div>Updated: {formatDate(todo.updatedAt)} by {todo.lastUpdatedBy}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Todo Modal */}
      {isModalOpen && selectedTodo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">Edit Todo</h2>
            <div className="space-y-4">
              <input
                type="text"
                value={selectedTodo.title}
                onChange={(e) => setSelectedTodo(prev => ({ ...prev, title: e.target.value }))}
                className="w-full p-2 border rounded"
              />
              <textarea
                value={selectedTodo.description}
                onChange={(e) => setSelectedTodo(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-2 border rounded"
              />
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedTodo.completed}
                  onChange={(e) => setSelectedTodo(prev => ({ ...prev, completed: e.target.checked }))}
                  className="h-4 w-4"
                />
                <span>Mark as completed</span>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => handleUpdateTodo(selectedTodo._id, selectedTodo)}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => handleDeleteTodo(selectedTodo._id)}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Delete
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Todo;
