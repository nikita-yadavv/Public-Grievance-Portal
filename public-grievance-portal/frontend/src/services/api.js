import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5001/api'
});

// Attach the JWT token to every outgoing request if the user is signed in
API.interceptors.request.use((config) => {
  const user = localStorage.getItem('grievance_user');
  if (user) {
    const { token } = JSON.parse(user);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default API;
