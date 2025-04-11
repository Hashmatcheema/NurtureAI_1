import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase.js';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      if (!auth) throw new Error('Authentication service not initialized');
      if (!email || !password) throw new Error('Email and password are required');
      console.log('Signup Attempt:', { email, password }); // Debug payload
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Signup Success:', userCredential.user);
      navigate('/welcome');
    } catch (e) {
      console.error('Signup Error:', { message: e.message, code: e.code, details: e });
      setError(e.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-3xl mb-6">Signup for Nurture AI</h1>
      <form onSubmit={handleSignup} className="flex flex-col items-center">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="mb-4 p-2 border rounded w-64"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="mb-4 p-2 border rounded w-64"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded w-64">
          Signup
        </button>
      </form>
      <button onClick={() => navigate('/')} className="mt-2 text-blue-500">
        Already have an account? Login
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
};

export default Signup;