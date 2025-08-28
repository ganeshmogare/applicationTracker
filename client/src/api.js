import axios from 'axios';

const API_BASE = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : ''; // Use localhost:3001 for development, relative URL for production

export const createApplication = async appData => {
  const res = await axios.post(`${API_BASE}/applications`, appData);
  return res.data;
};

export const updateApplicationStatus = async (id, status) => {
  const res = await axios.post(`${API_BASE}/applications/${id}/status`, {
    status,
  });
  return res.data;
};
