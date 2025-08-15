import axios from 'axios';

const API_BASE = 'http://localhost:3000'; // your backend server

export const createApplication = async (appData) => {
  const res = await axios.post(`${API_BASE}/applications`, appData);
  return res.data;
};

export const updateApplicationStatus = async (id, status) => {
  const res = await axios.post(`${API_BASE}/applications/${id}/status`, { status });
  return res.data;
};
