import React, { useState } from 'react';
import { postAudio } from '../services/api';
import { auth, database } from '../services/firebase';
import { ref, push } from 'firebase/database';

const CryRecorder = () => {
  const [recording, setRecording] = useState(false);
  const [result, setResult] = useState('');
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [error, setError] = useState('');

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        try {
          const blob = new Blob(chunks, { type: 'audio/wav' });
          const response = await postAudio(blob);
          setResult(response.category);
          const user = auth.currentUser;
          if (user) {
            const cryRef = ref(database, `users/${user.uid}/cries`);
            push(cryRef, {
              category: response.category,
              timestamp: new Date().toISOString(),
            });
          }
          stream.getTracks().forEach((track) => track.stop());
        } catch (e) {
          setError('Failed to process audio: ' + e.message);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
      setError('');
    } catch (e) {
      setError('Microphone access denied or unavailable: ' + e.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setRecording(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={recording ? stopRecording : startRecording}
        className={`p-2 rounded w-64 ${recording ? 'bg-red-500' : 'bg-blue-500'} text-white`}
        disabled={recording && !mediaRecorder}
      >
        {recording ? 'Stop Recording' : 'Record Cry'}
      </button>
      {result && <p className="mt-4 text-lg">Cry Type: {result}</p>}
      {error && <p className="mt-4 text-red-500">{error}</p>}
    </div>
  );
};

export default CryRecorder;