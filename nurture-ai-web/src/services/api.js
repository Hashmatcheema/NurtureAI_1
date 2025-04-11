import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const postAudio = async (audioBlob) => {
  const formData = new FormData();
  formData.append('file', audioBlob, 'cry.wav');
  const response = await axios.post(`${API_URL}/audio`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};