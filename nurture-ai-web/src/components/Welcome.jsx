import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, database } from '../services/firebase';
import { ref, onValue } from 'firebase/database';
import CryRecorder from './CryRecorder';

const Welcome = () => {
  const navigate = useNavigate();
  const [cryHistory, setCryHistory] = useState([]);

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (!user) navigate('/');
      else {
        const cryRef = ref(database, `users/${user.uid}/cries`);
        onValue(cryRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setCryHistory(Object.values(data));
          }
        });
      }
    });
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-3xl mb-6">Welcome to Nurture AI</h1>
      <p className="mb-4">Use the tool below to record and analyze your baby's cries.</p>
      <CryRecorder />
      <div className="mt-6 w-64">
        <h2 className="text-xl mb-2">Cry History</h2>
        {cryHistory.length ? (
          <ul>
            {cryHistory.map((cry, index) => (
              <li key={index} className="mb-1">
                {cry.timestamp}: {cry.category}
              </li>
            ))}
          </ul>
        ) : (
          <p>No cries recorded yet.</p>
        )}
      </div>
      <button onClick={() => auth.signOut()} className="mt-6 bg-red-500 text-white p-2 rounded w-64">
        Logout
      </button>
    </div>
  );
};

export default Welcome;