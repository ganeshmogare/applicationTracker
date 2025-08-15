import React, { useState } from 'react';
import { 
  List, 
  ListItem, 
  ListItemText, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Chip,
  Box,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import axios from 'axios';

function ApplicationList({ applications, onStatusUpdate }) {
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [coverLetterDialog, setCoverLetterDialog] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState(null);
  const [error, setError] = useState(null);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await axios.post(`/applications/${id}/status`, { status: newStatus });
      onStatusUpdate();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleRegenerateCoverLetter = async (id) => {
    setRegenerating(true);
    setRegeneratingId(id);
    setError(null);
    
    try {
      const response = await axios.post(`/applications/${id}/regenerate-cover-letter`);
      
      // Update the application in the list
      const updatedApplication = {
        ...applications.find(app => app.workflow_id === id),
        cover_letter: response.data.coverLetter
      };
      
      setSelectedApplication(updatedApplication);
      
      // Refresh the applications list
      onStatusUpdate();
      
    } catch (error) {
      console.error('Error regenerating cover letter:', error);
      setError('Failed to generate cover letter. Please try again.');
    } finally {
      setRegenerating(false);
      setRegeneratingId(null);
    }
  };

  return (
    <div>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <List>
        {applications.map((app) => (
          <ListItem key={app.workflow_id} divider>
            <ListItemText
              primary={`${app.role} at ${app.company}`}
              secondary={
                <div>
                  <Typography variant="body2" color="text.secondary">
                    Status: <Chip label={app.status} size="small" />
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Deadline: {new Date(app.deadline).toLocaleDateString()}
                  </Typography>
                  {app.cover_letter && (
                    <Button 
                      size="small" 
                      onClick={() => {
                        setSelectedApplication(app);
                        setCoverLetterDialog(true);
                      }}
                      sx={{ mr: 1 }}
                    >
                      View Cover Letter
                    </Button>
                  )}
                  <Button 
                    size="small" 
                    onClick={() => handleRegenerateCoverLetter(app.workflow_id)}
                    disabled={regenerating}
                    startIcon={regenerating && regeneratingId === app.workflow_id ? <CircularProgress size={16} /> : null}
                  >
                    {regenerating && regeneratingId === app.workflow_id ? 'Generating...' : 'Regenerate Cover Letter'}
                  </Button>
                </div>
              }
            />
            <Box>
              <Button 
                onClick={() => handleStatusUpdate(app.workflow_id, 'Interview')}
                variant="outlined" 
                size="small"
                sx={{ mr: 1 }}
              >
                Interview
              </Button>
              <Button 
                onClick={() => handleStatusUpdate(app.workflow_id, 'Rejected')}
                variant="outlined" 
                size="small"
                sx={{ mr: 1 }}
              >
                Rejected
              </Button>
              <Button 
                onClick={() => handleStatusUpdate(app.workflow_id, 'Archived')}
                variant="outlined" 
                size="small"
              >
                Archive
              </Button>
            </Box>
          </ListItem>
        ))}
      </List>

      {/* Cover Letter Dialog */}
      <Dialog 
        open={coverLetterDialog} 
        onClose={() => setCoverLetterDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Cover Letter - {selectedApplication?.role} at {selectedApplication?.company}
        </DialogTitle>
        <DialogContent>
          <Typography 
            variant="body1" 
            component="pre" 
            sx={{ 
              whiteSpace: 'pre-wrap', 
              fontFamily: 'inherit',
              maxHeight: '400px',
              overflow: 'auto'
            }}
          >
            {selectedApplication?.cover_letter}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCoverLetterDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default ApplicationList;
