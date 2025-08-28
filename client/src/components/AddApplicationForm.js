import React, { useState } from 'react';
import { createApplication } from '../api';
import {
  Box,
  Button,
  TextField,
  Typography,
  Stack,
  Paper,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

export default function AddApplicationForm({ onApplicationAdded }) {
  const [form, setForm] = useState({
    company: '',
    role: '',
    jobDescription: '',
    resume: '',
    deadline: '',
  });

  const handleChange = e => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const app = await createApplication(form);
      alert(`Application created! Workflow ID: ${app.workflowId}`);
      if (onApplicationAdded) {
        onApplicationAdded();
      }
      setForm({
        company: '',
        role: '',
        jobDescription: '',
        resume: '',
        deadline: '',
      });
    } catch (err) {
      console.error(err);
      alert('Error creating application');
    }
  };

  return (
    <Paper elevation={3} sx={{ padding: 3, maxWidth: 500, mx: 'auto' }}>
      <Typography variant="h5" component="h2" gutterBottom>
        <AddCircleOutlineIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
        Add Application
      </Typography>

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <TextField
            label="Company"
            name="company"
            value={form.company}
            onChange={handleChange}
            variant="outlined"
            required
            fullWidth
          />
          <TextField
            label="Role"
            name="role"
            value={form.role}
            onChange={handleChange}
            variant="outlined"
            required
            fullWidth
          />
          <TextField
            label="Job Description"
            name="jobDescription"
            value={form.jobDescription}
            onChange={handleChange}
            variant="outlined"
            multiline
            rows={4}
            required
            fullWidth
          />
          <TextField
            label="Resume (file name or link)"
            name="resume"
            value={form.resume}
            onChange={handleChange}
            variant="outlined"
            required
            fullWidth
          />
          <TextField
            label="Deadline"
            name="deadline"
            type="date"
            value={form.deadline}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <Button
            variant="contained"
            color="primary"
            type="submit"
            size="large"
            sx={{ mt: 1 }}
          >
            Add
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}
