import axios from 'axios'
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(null)
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(import.meta.env.VITE_LOGIN_URL, {email,password});
      
      if (res.status === 200) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('username', res.data.username);
        navigate('/todo');
      } else {
        setError('Invalid credentials');
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        setError('Invalid email or password');
      } else {
        setError('Server error, please try again later');
      }
    }
  }

  return (
    <div>
      <div className="flex justify-center items-center h-screen">
            <div className="text-center border-2 py-10 px-52 rounded-md shadow-xl">
              <h4 className="mb-4 text-2xl font-bold">LOGIN</h4>
              <form onSubmit={handleSubmit}>
                <div className="">
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mb-2 border-2 rounded-md p-2" placeholder="Email" required/>
                </div>

                <div className="">
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mb-2 border-2 rounded-md p-2" placeholder="Password" required/>
                </div>

                {error && <p className='text-red-500 text-xs mt-2'> {error} </p>}

                <button type='submit' className="border-2 rounded-md p-2 bg-slate-300 hover:bg-slate-400">JOIN</button>

                <p className="mt-3">
                  Don't have an account?
                  <Link to="/signup" className="text-blue-500">Signup</Link>
                </p>

              </form>
            </div>
          </div>
    </div>
  )
}

export default Login
