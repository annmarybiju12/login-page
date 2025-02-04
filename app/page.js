'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DOMPurify from 'dompurify';

const sanitizeInput = (input) => DOMPurify.sanitize(input);

const passwordStrength = (password) => {
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < 8 || !hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChars) {
    return false;
  }
  return true;
};

export default function Home() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [userData, setUserData] = useState(null);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
  
    try {
      const endpoint = isRegistering ? '/api/register' : '/api/auth';
      let body = isRegistering ? { username, password, email, phone } : { username, password };
  
      // Basic input validation and sanitization
      if (isRegistering) {
        if (!username || !password || !email || !phone) {
          throw new Error("All fields are required");
        }
        if (!/^[a-zA-Z0-9_]{3,15}$/.test(username)) {
          throw new Error("Invalid username format");
        }
        if (!passwordStrength(password)) {
          throw new Error("Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters");
        }
        if (!/^(?!0)[0-9]{10}$/.test(phone)) {
          throw new Error("Invalid phone number format");
        }
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email) || !email.endsWith('.com')) {
          throw new Error("Invalid email format");
        }
  
        // Sanitize inputs
        body = {
          username: sanitizeInput(username),
          password: sanitizeInput(password),
          email: sanitizeInput(email),
          phone: sanitizeInput(phone),
        };
      } else {
        if (!username || !password) {
          throw new Error("Username and password are required");
        }
  
        // Sanitize inputs
        body = {
          username: sanitizeInput(username),
          password: sanitizeInput(password),
        };
      }
  
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        throw new Error(data.error || `${isRegistering ? 'Registration' : 'Login'} failed`);
      }
  
      if (isRegistering) {
        setError('Registration successful! Please log in.');
        setIsRegistering(false);
        setUsername('');
        setPassword('');
        setEmail('');
        setPhone('');
      } else {
        // Store the JWT token in localStorage
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
  
        // Update the user data state
        setUserData({ username: data.username, email: data.email, phone: data.phone });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError('');
    setUsername('');
    setPassword('');
    setEmail('');
    setPhone('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-pastelGreen to-softMint">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        {userData ? (
          <div>
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
              Welcome, {userData.username}!
            </h2>
            <p className="text-center text-gray-700 mb-4">Email: {userData.email}</p>
            <p className="text-center text-gray-700">Phone: {userData.phone}</p>
          </div>
        ) : (
          <>
            <div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                {isRegistering ? 'Create an account' : 'Sign in to your account'}
              </h2>
            </div>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className={`border px-4 py-3 rounded ${
                  error.includes('successful') 
                    ? 'bg-green-100 border-green-400 text-green-700'
                    : 'bg-red-100 border-red-400 text-red-700'
                }`}>
                  {error}
                </div>
              )}
              <div className="rounded-md shadow-sm -space-y-px">
                {isRegistering && (
                  <>
                    <div>
                      <label htmlFor="email" className="sr-only">Email</label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="sr-only">Phone Number</label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        required
                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                        placeholder="Phone Number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  </>
                )}
                <div>
                  <label htmlFor="username" className="sr-only">Username</label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label htmlFor="password" className="sr-only">Password</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <button
                  type="submit"
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : (isRegistering ? 'Register' : 'Sign in')}
                </button>
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                  disabled={isLoading}
                >
                  {isRegistering 
                    ? 'Already have an account? Sign in' 
                    : 'Need an account? Register'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
