import React from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const SignUp = () => {
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(null)
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const res = await axios.post(import.meta.env.VITE_SIGNUP_URL, {email,username,password});
        
        if (res.status === 201) {
            navigate('/');
        } else {
            setError('Something went wrong, please try again');
        }
    } catch (error) {
        if (error.response && error.response.status === 400) {
            setError('User with this email already exists');
        } else {
            setError('Server error, please try again later');
        }
    }
  }

  return (
    <div>
      <div className="flex justify-center items-center h-screen">
            <div className="text-center border-2 py-10 px-52 rounded-md shadow-xl">
              <h4 className="mb-4 text-2xl font-bold">SIGN-UP</h4>

              <form onSubmit={handleSubmit}>
                <div>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mb-2 border-2 rounded-md p-2" placeholder="Email" required/>
                </div>
                <div>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="mb-2 border-2 rounded-md p-2" placeholder="Username" required/>
                </div>

                <div>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mb-2 border-2 rounded-md p-2" placeholder="Password" required/>
                </div>

                {error && <p className='text-red-500 text-xs mt-2'> {error} </p>}

                <button type='submit' className="border-2 rounded-md p-2 bg-slate-300 hover:bg-slate-400">CREATE</button>

                <p className="mt-3">
                  Already have an account?
                  <Link to="/" className="text-blue-500">Login</Link>
                </p>

              </form>
            </div>
          </div>
    </div>
  )
}

export default SignUp
