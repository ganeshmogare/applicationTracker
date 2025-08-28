import React, { useState, useEffect } from 'react';
import AddApplicationForm from './components/AddApplicationForm';
import ApplicationList from './components/ApplicationList';
import { Container, Typography } from '@mui/material';
import axios from 'axios';

// API base URL configuration
const API_BASE =
  process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '';

function App() {
  const [applications, setApplications] = useState([]);
  const [archivedApplications, setArchivedApplications] = useState([]);

  const fetchApplications = async () => {
    try {
      const [activeRes, archivedRes] = await Promise.all([
        axios.get(`${API_BASE}/applications`),
        axios.get(`${API_BASE}/applications/archived`),
      ]);
      setApplications(activeRes.data);
      setArchivedApplications(archivedRes.data);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
    }
  };

  const addSuccess = () => {
    alert('Job application added successfully');
    fetchApplications();
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h3" align="center" gutterBottom>
        Job Application Tracker
      </Typography>
      <AddApplicationForm onApplicationAdded={addSuccess} />

      <ApplicationList
        applications={applications}
        onStatusChange={fetchApplications}
      />

      {archivedApplications.length > 0 && (
        <>
          <Typography variant="h4" sx={{ mt: 4, mb: 2 }}>
            Archived Applications ({archivedApplications.length})
          </Typography>
          <ApplicationList
            applications={archivedApplications}
            onStatusChange={fetchApplications}
          />
        </>
      )}
    </Container>
  );
}

export default App;
