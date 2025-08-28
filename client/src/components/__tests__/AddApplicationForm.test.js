/* global jest, describe, it, expect, beforeEach */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddApplicationForm from '../AddApplicationForm';

// Mock the API module
jest.mock('../../api', () => ({
  createApplication: jest.fn(),
}));

const mockCreateApplication = require('../../api').createApplication;

describe('AddApplicationForm', () => {
  const mockOnApplicationAdded = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all form fields', () => {
    render(<AddApplicationForm onApplicationAdded={mockOnApplicationAdded} />);

    expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/job description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/resume/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/deadline/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
  });

  it('submits form with correct data', async () => {
    const user = userEvent.setup();
    const mockApplication = {
      workflowId: 'test-workflow-id',
    };

    mockCreateApplication.mockResolvedValue(mockApplication);

    render(<AddApplicationForm onApplicationAdded={mockOnApplicationAdded} />);

    // Fill out the form
    await user.type(screen.getByLabelText(/company/i), 'Test Company');
    await user.type(screen.getByLabelText(/role/i), 'Software Engineer');
    await user.type(
      screen.getByLabelText(/job description/i),
      'Test job description'
    );
    await user.type(screen.getByLabelText(/resume/i), 'resume.pdf');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /add/i }));

    await waitFor(() => {
      expect(mockCreateApplication).toHaveBeenCalledWith({
        company: 'Test Company',
        role: 'Software Engineer',
        jobDescription: 'Test job description',
        resume: 'resume.pdf',
        deadline: '',
      });
    });

    expect(mockOnApplicationAdded).toHaveBeenCalled();
  });

  it('clears form after successful submission', async () => {
    const user = userEvent.setup();
    const mockApplication = { workflowId: 'test-workflow-id' };

    mockCreateApplication.mockResolvedValue(mockApplication);

    render(<AddApplicationForm onApplicationAdded={mockOnApplicationAdded} />);

    // Fill out the form
    await user.type(screen.getByLabelText(/company/i), 'Test Company');
    await user.type(screen.getByLabelText(/role/i), 'Software Engineer');
    await user.type(
      screen.getByLabelText(/job description/i),
      'Test job description'
    );
    await user.type(screen.getByLabelText(/resume/i), 'resume.pdf');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /add/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/company/i)).toHaveValue('');
      expect(screen.getByLabelText(/role/i)).toHaveValue('');
      expect(screen.getByLabelText(/job description/i)).toHaveValue('');
      expect(screen.getByLabelText(/resume/i)).toHaveValue('');
    });
  });

  it('handles API errors gracefully', async () => {
    const user = userEvent.setup();
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    mockCreateApplication.mockRejectedValue(new Error('API Error'));

    render(<AddApplicationForm onApplicationAdded={mockOnApplicationAdded} />);

    // Fill out the form
    await user.type(screen.getByLabelText(/company/i), 'Test Company');
    await user.type(screen.getByLabelText(/role/i), 'Software Engineer');
    await user.type(
      screen.getByLabelText(/job description/i),
      'Test job description'
    );
    await user.type(screen.getByLabelText(/resume/i), 'resume.pdf');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /add/i }));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error creating application');
    });

    expect(mockOnApplicationAdded).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
    alertSpy.mockRestore();
  });
});
