This is a MERN Stack-based collaborative to-do list web application that allows multiple users to manage a shared task list in real-time. It features live updates using Socket.IO and multi-level undo/redo functionality managed from the backend.

## Setup Instruction
  - Clone the repository : git clone https://github.com/henna-maryam/TODO
  - Split the terminal for frontend and backend seperately
  - ## Backend
      - Navigate to server : cd backend
      - Install dependencies : npm i
      - Create .env file on the backend folder with following details:
        
            - PORT = 3000
   
            - MONGODB_URI = your mongo url
        
            - FRONTEND_URL = 'http://localhost:5173'
        
            - JWT_SECRET = you_secret_key   
      - Start the server : npm start
  - ## Frontend
      - Navigate to frontend : cd frontend
      - Install dependencies : npm i
      - Create .env file on the frontend folder with following details:
        
            - VITE_SIGNUP_URL = 'http://localhost:3000/signup'
        
            - VITE_LOGIN_URL = 'http://localhost:3000/login'
        
            - VITE_BACKEND_URL = 'http://localhost:3000/'
        
            - VITE_TODOS_URL='http://localhost:3000/api/todos'
        
            - VITE_UNDO_REDO_URL='http://localhost:3000/api/history'
        
            - VITE_USERS_URL='http://localhost:3000/'
      - Run the page : npm run dev
  - You can SignUp and then Login 
  - Use 2 pages with different users to see the live updates on
    
