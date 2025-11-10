// src/components/Slider.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  CircularProgress,
  Link
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { sliderApi } from '../services/api';

const Slider = () => {
  const [sliders, setSliders] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSlider, setEditingSlider] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', link: '', image: null });
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch sliders on component mount
  useEffect(() => {
    fetchSliders();
  }, []);

  const fetchSliders = async () => {
    try {
      setLoading(true);
      const response = await sliderApi.getAll();
      // v3 feed endpoint returns array directly
      setSliders(Array.isArray(response) ? response : (response?.data || []));
    } catch (error) {
      console.error('Error fetching sliders:', error);
      showSnackbar('Failed to load sliders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (slider = null) => {
    if (slider) {
      setFormData({
        title: slider.title || '',
        description: slider.description || '',
        link: slider.link || '',
        image: null
      });
      setImagePreview(slider.image || '');
      setEditingSlider(slider);
    } else {
      setFormData({ title: '', description: '', link: '', image: null });
      setImagePreview('');
      setEditingSlider(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSlider(null);
    setImagePreview('');
  };

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file' && files && files[0]) {
      const file = files[0];
      setFormData(prev => ({
        ...prev,
        [name]: file
      }));
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Create FormData for multipart/form-data
      const submitFormData = new FormData();
      submitFormData.append('title', formData.title);
      submitFormData.append('description', formData.description);
      if (formData.link) {
        submitFormData.append('link', formData.link);
      }
      
      // Only append image if it's a new file (not a preview URL)
      if (formData.image instanceof File) {
        submitFormData.append('image', formData.image);
      }
      
      if (editingSlider) {
        // Note: Update endpoint may not be available per API documentation
        try {
          await sliderApi.update(editingSlider.id || editingSlider.slider_id, submitFormData);
          showSnackbar('Slider updated successfully', 'success');
        } catch (updateError) {
          // If update fails, show helpful message
          if (updateError.response?.status === 404) {
            showSnackbar('Update endpoint not available. Please delete and recreate the slider.', 'warning');
          } else {
            throw updateError;
          }
        }
      } else {
        // Create requires image file
        if (!formData.image || !(formData.image instanceof File)) {
          showSnackbar('Please select an image file', 'error');
          setLoading(false);
          return;
        }
        await sliderApi.create(submitFormData);
        showSnackbar('Slider created successfully', 'success');
      }
      fetchSliders();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving slider:', error);
      showSnackbar(`Failed to ${editingSlider ? 'update' : 'create'} slider`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this slider?')) {
      try {
        setLoading(true);
        await sliderApi.delete(id);
        showSnackbar('Slider deleted successfully', 'success');
        fetchSliders();
      } catch (error) {
        console.error('Error deleting slider:', error);
        showSnackbar('Failed to delete slider', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Slider Management
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add New Slider
          </Button>
        </Box>

        {loading && sliders.length === 0 ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Image</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Link</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sliders.length > 0 ? (
                  sliders.map((slider) => (
                    <TableRow key={slider.id || slider.slider_id}>
                      <TableCell>{slider.title}</TableCell>
                      <TableCell>
                        {slider.image && (
                          <img 
                            src={slider.image} 
                            alt={slider.title} 
                            style={{ maxWidth: '100px', maxHeight: '50px', objectFit: 'contain' }} 
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {slider.description || '-'}
                      </TableCell>
                      <TableCell>
                        {slider.link ? (
                          <Link 
                            href={slider.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            sx={{ wordBreak: 'break-all' }}
                          >
                            {slider.link}
                          </Link>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleOpenDialog(slider)} color="primary">
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(slider.id || slider.slider_id)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No sliders found. Click "Add New Slider" to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{editingSlider ? 'Edit Slider' : 'Add New Slider'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                fullWidth
                required
                margin="normal"
              />
              <TextField
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                fullWidth
                required
                margin="normal"
                multiline
                rows={3}
                placeholder="Enter slider description"
              />
              <TextField
                label="Link (URL)"
                name="link"
                type="url"
                value={formData.link}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                placeholder="https://example.com"
                helperText="Optional: URL to navigate to when slider is clicked"
              />
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Image {editingSlider ? '(optional - leave empty to keep current)' : '*'}
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  sx={{ mb: 1 }}
                >
                  {formData.image instanceof File ? 'Change Image' : 'Select Image'}
                  <input
                    type="file"
                    id="image"
                    name="image"
                    accept="image/*"
                    onChange={handleInputChange}
                    hidden
                  />
                </Button>
                {imagePreview && (
                  <Box mt={1} sx={{ border: '1px solid #ddd', borderRadius: 1, p: 1 }}>
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} 
                    />
                  </Box>
                )}
                {!editingSlider && (
                  <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
                    * Image is required for new sliders
                  </Typography>
                )}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Slider;