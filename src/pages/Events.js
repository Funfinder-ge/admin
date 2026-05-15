import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  FormControlLabel,
  Checkbox,
  LinearProgress,
  Card,
  CardContent,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Event as EventIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Image as ImageIcon,
  Visibility as ViewIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  LocationOn as LocationIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  DeleteOutline as DeleteImageIcon,
  EditOutlined as EditImageIcon,
  Map as MapIcon,
  StarBorder as FeaturedIcon
} from '@mui/icons-material';
import { eventApi, eventApiV2, companyApi, categoryApi, cityApi } from '../services/api';
import apiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import MapPicker from '../components/MapPicker';

const getImageUrl = (imgPath) => {
  if (!imgPath) return null;
  if (typeof imgPath !== 'string') return null;
  if (imgPath.startsWith('http')) return imgPath;
  if (imgPath.startsWith('/')) return `https://base.funfinder.ge${imgPath}`;
  return `https://base.funfinder.ge/${imgPath}`;
};

const Events = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { canCreate, canUpdate, canDelete, canRead } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Image upload modal state
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [imageUploadData, setImageUploadData] = useState({
    image: null,
    alt_text: '',
    is_primary: false
  });
  const [imageUploading, setImageUploading] = useState(false);

  // Event details modal state
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [eventDetails, setEventDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Image update modal state
  const [imageUpdateModalOpen, setImageUpdateModalOpen] = useState(false);
  const [selectedImageForUpdate, setSelectedImageForUpdate] = useState(null);
  const [imageUpdateData, setImageUpdateData] = useState({
    alt_text: '',
    is_primary: false
  });
  const [imageUpdating, setImageUpdating] = useState(false);
  
  // Map picker state
  const [openMapPicker, setOpenMapPicker] = useState(false);

  // Removed axiosInstance; not needed for v1 feed usage
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    city: '',
    base_price: '',
    price_per_person: '',
    min_people: '',
    max_people: '',
    location: '',
    latitude: '',
    longitude: '',
    is_popular: false,
    is_active: true,
    is_featured: false,
    company_id: '',
    image: null,
    image_alt_text: '',
    image_is_primary: true
  });

  // Additional state for dropdowns
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [companies, setCompanies] = useState([]);
  
  // Function to extract coordinates from event object
  const extractCoordinates = (event) => {
    // Try multiple possible field names and structures
    const possibleLatFields = [
      'latitude', 'lat', 'lat_lng', 'location_lat', 'geo_lat',
      'coordinates.lat', 'location_data.lat', 'position.lat'
    ];
    const possibleLngFields = [
      'longitude', 'lng', 'lon', 'lng_lat', 'location_lng', 'geo_lng',
      'coordinates.lng', 'location_data.lng', 'position.lng'
    ];

    let latitude = null;
    let longitude = null;

    // Try direct field access
    for (const field of possibleLatFields) {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        if (event[parent] && event[parent][child]) {
          latitude = event[parent][child];
          break;
        }
      } else if (event[field]) {
        latitude = event[field];
        break;
      }
    }

    for (const field of possibleLngFields) {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        if (event[parent] && event[parent][child]) {
          longitude = event[parent][child];
          break;
        }
      } else if (event[field]) {
        longitude = event[field];
        break;
      }
    }

    // Try array format [lat, lng] or [lng, lat]
    if (!latitude && !longitude) {
      if (Array.isArray(event.coordinates) && event.coordinates.length >= 2) {
        latitude = event.coordinates[0];
        longitude = event.coordinates[1];
      } else if (Array.isArray(event.lat_lng) && event.lat_lng.length >= 2) {
        latitude = event.lat_lng[0];
        longitude = event.lat_lng[1];
      } else if (Array.isArray(event.position) && event.position.length >= 2) {
        latitude = event.position[0];
        longitude = event.position[1];
      }
    }

    return { latitude, longitude };
  };

  // Debug: Log events state changes
  useEffect(() => {
    console.log('Events state updated:', events);
    console.log('Events count:', events.length);
    if (events.length > 0) {
      console.log('First event:', events[0]);
      console.log('First event ID:', events[0]?.id);
      const coords = extractCoordinates(events[0]);
      console.log('Extracted coordinates:', coords);
    }
  }, [events]);

  // Fetch events from API (v1 feed)
  const fetchEvents = async () => {
    try {
      setLoading(true);
      console.log('Fetching events from v1 feed /event/feed ...');

      // v1 feed returns an array directly
      const response = await eventApi.getAll();

      let eventsList = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];
      
      console.log('Extracted events list:', eventsList);
      console.log('Sample event structure:', eventsList.length > 0 ? eventsList[0] : 'No events');
      
      // Debug: Check what fields are available in the first event
      if (eventsList.length > 0) {
        const firstEvent = eventsList[0];
        console.log('=== EVENT FIELD DEBUG ===');
        console.log('First event fields:', Object.keys(firstEvent));
        console.log('Full first event object:', JSON.stringify(firstEvent, null, 2));
        console.log('Has latitude?', 'latitude' in firstEvent, firstEvent.latitude);
        console.log('Has longitude?', 'longitude' in firstEvent, firstEvent.longitude);
        console.log('Has lat?', 'lat' in firstEvent, firstEvent.lat);
        console.log('Has lng?', 'lng' in firstEvent, firstEvent.lng);
        console.log('Has coordinates?', 'coordinates' in firstEvent, firstEvent.coordinates);
        console.log('Has location_data?', 'location_data' in firstEvent, firstEvent.location_data);
        console.log('Has location_coordinates?', 'location_coordinates' in firstEvent, firstEvent.location_coordinates);
        console.log('Has geo?', 'geo' in firstEvent, firstEvent.geo);
        console.log('Has position?', 'position' in firstEvent, firstEvent.position);
        console.log('Has lat_lng?', 'lat_lng' in firstEvent, firstEvent.lat_lng);
        console.log('========================');
      }
      
      console.log('Final events list:', eventsList);
      
      // Ensure all events have an id property for MUI DataGrid
      const eventsWithIds = eventsList.map((event, index) => {
        // Generate a unique ID if none exists
        if (!event.id || event.id === '' || event.id === null || event.id === undefined) {
          const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${index}`;
          console.warn(`Event without ID found at index ${index}, assigned temp ID: ${tempId}`, event);
          return { ...event, id: tempId };
        }
        return event;
      });
      
      // Double-check that all events have valid IDs
      const validEvents = eventsWithIds.filter(event => {
        const hasValidId = event.id && event.id !== '' && event.id !== null && event.id !== undefined;
        if (!hasValidId) {
          console.error('Event still missing ID after processing:', event);
        }
        return hasValidId;
      });
      
      console.log('Events with IDs:', eventsWithIds);
      console.log('Valid events:', validEvents);
      console.log('Events count:', validEvents.length);
      
      // Set events only if we have valid ones
      if (validEvents.length > 0) {
        setEvents(validEvents);
      } else {
        console.warn('No valid events found, setting empty array');
        setEvents([]);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setSnackbar({
        open: true,
        message: `Error fetching events: ${error.response?.data?.detail || error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Load events on component mount
  useEffect(() => {
    fetchEvents();
    fetchCategories();
    fetchCities();
    fetchCompanies();
  }, []);

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      const response = await categoryApi.getAll();
      console.log('Categories API response:', response);
      
      let categoriesList = [];
      if (Array.isArray(response)) {
        categoriesList = response;
      } else if (response?.data && Array.isArray(response.data)) {
        categoriesList = response.data;
      } else if (response?.results && Array.isArray(response.results)) {
        categoriesList = response.results;
      }
      
      console.log('Processed categories list:', categoriesList);
      setCategories(categoriesList);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  // Fetch cities from API
  const fetchCities = async () => {
    try {
      const response = await cityApi.getAll();
      console.log('Cities API response:', response);
      
      let citiesList = [];
      if (Array.isArray(response)) {
        citiesList = response;
      } else if (response?.data && Array.isArray(response.data)) {
        citiesList = response.data;
      } else if (response?.results && Array.isArray(response.results)) {
        citiesList = response.results;
      }
      
      console.log('Processed cities list:', citiesList);
      setCities(citiesList);
    } catch (error) {
      console.error('Error fetching cities:', error);
      setCities([]);
    }
  };

  // Fetch companies from API
  const fetchCompanies = async () => {
    try {
      console.log('Fetching companies for Events component...');
      const response = await companyApi.getAll();
      console.log('Companies API response:', response);
      
      let companiesList = [];
      if (Array.isArray(response)) {
        companiesList = response;
      } else if (response?.data && Array.isArray(response.data)) {
        companiesList = response.data;
      } else if (response?.results && Array.isArray(response.results)) {
        companiesList = response.results;
      }
      
      console.log('Processed companies list for Events:', companiesList);
      setCompanies(companiesList);
    } catch (error) {
      console.error('Error fetching companies:', error);
      setCompanies([]);
    }
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Map picker functions
  const handleOpenMapPicker = () => {
    setOpenMapPicker(true);
  };

  const handleCloseMapPicker = () => {
    setOpenMapPicker(false);
  };

  const handleLocationSelect = (location) => {
    // Format coordinates to have no more than 9 digits total
    const formatCoordinate = (coord) => {
      const str = coord.toString();
      if (str.length <= 9) {
        return coord;
      }
      // Truncate to 9 digits total
      return parseFloat(str.substring(0, 9));
    };

    const formattedLat = formatCoordinate(location.lat);
    const formattedLng = formatCoordinate(location.lng);

    setFormData(prev => ({
      ...prev,
      latitude: formattedLat,
      longitude: formattedLng
    }));
    setSnackbar({
      open: true,
      message: `Location selected: ${formattedLat}, ${formattedLng}`,
      severity: 'success'
    });
  };

  // Open dialog for creating/editing event
  const handleOpenDialog = (event = null) => {
    if (event) {
      // Editing existing event
      setEditingEvent(event);
      setFormData({
        name: event.name || '',
        description: event.description || '',
        category: event.category?.id || event.category || '',
        city: event.city?.id || event.city || '',
        base_price: event.base_price || '',
        price_per_person: event.price_per_person || '',
        min_people: event.min_people || '',
        max_people: event.max_people || '',
        location: event.location || '',
        latitude: event.latitude || '',
        longitude: event.longitude || '',
        is_popular: event.is_popular || false,
        is_active: event.is_active !== undefined ? event.is_active : true,
        is_featured: event.is_featured || false,
        company_id: event.company || event.company_id || '',
        image: null,
        image_alt_text: '',
        image_is_primary: true
      });
    } else {
      // Creating new event
      setEditingEvent(null);
      setFormData({
        name: '',
        description: '',
        category: '',
        city: '',
        base_price: '',
        price_per_person: '',
        min_people: '',
        max_people: '',
        location: '',
        latitude: '',
        longitude: '',
        is_popular: false,
        is_active: true,
        is_featured: false,
        company_id: '',
        image: null,
        image_alt_text: '',
        image_is_primary: true
      });
    }
    setOpenDialog(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingEvent(null);
    setFormData({
      name: '',
      description: '',
      category: '',
      city: '',
      base_price: '',
      price_per_person: '',
      min_people: '',
      max_people: '',
      location: '',
      latitude: '',
      longitude: '',
      is_popular: false,
      is_active: true,
      is_featured: false,
      company_id: '',
      image: null,
      image_alt_text: '',
      image_is_primary: true
    });
  };

  // Handle image file selection inside the create/edit dialog
  const handleFormImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setSnackbar({ open: true, message: 'Please select a valid image file (PNG, JPEG, GIF, or WebP)', severity: 'error' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setSnackbar({ open: true, message: 'Image file size must be less than 10MB', severity: 'error' });
      return;
    }

    setFormData(prev => ({ ...prev, image: file }));
  };

  // Validate form data
  const validateForm = () => {
    if (!formData.name.trim()) {
      setSnackbar({ open: true, message: 'Name is required', severity: 'error' });
      return false;
    }
    if (!formData.description.trim()) {
      setSnackbar({ open: true, message: 'Description is required', severity: 'error' });
      return false;
    }
    if (!formData.category) {
      setSnackbar({ open: true, message: 'Category is required', severity: 'error' });
      return false;
    }
    if (!formData.city) {
      setSnackbar({ open: true, message: 'City is required', severity: 'error' });
      return false;
    }
    if (!formData.company_id) {
      setSnackbar({ open: true, message: 'Company is required', severity: 'error' });
      return false;
    }
    if (!formData.base_price || parseFloat(formData.base_price) <= 0) {
      setSnackbar({ open: true, message: 'Base price must be greater than 0', severity: 'error' });
      return false;
    }
    if (!formData.price_per_person || parseFloat(formData.price_per_person) <= 0) {
      setSnackbar({ open: true, message: 'Price per person must be greater than 0', severity: 'error' });
      return false;
    }
    if (!formData.min_people || parseInt(formData.min_people) <= 0) {
      setSnackbar({ open: true, message: 'Minimum people must be greater than 0', severity: 'error' });
      return false;
    }
    if (!formData.max_people || parseInt(formData.max_people) <= 0) {
      setSnackbar({ open: true, message: 'Maximum people must be greater than 0', severity: 'error' });
      return false;
    }
    if (parseInt(formData.min_people) > parseInt(formData.max_people)) {
      setSnackbar({ open: true, message: 'Minimum people cannot be greater than maximum people', severity: 'error' });
      return false;
    }
    if (!formData.location.trim()) {
      setSnackbar({ open: true, message: 'Location is required', severity: 'error' });
      return false;
    }
    if (!formData.latitude || isNaN(parseFloat(formData.latitude))) {
      setSnackbar({ open: true, message: 'Valid latitude is required', severity: 'error' });
      return false;
    }
    if (!formData.longitude || isNaN(parseFloat(formData.longitude))) {
      setSnackbar({ open: true, message: 'Valid longitude is required', severity: 'error' });
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    // Check if we have authentication token
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setSnackbar({
        open: true,
        message: 'Authentication token not found. Please log in again.',
        severity: 'error'
      });
      return;
    }
    
    console.log('Auth token available:', !!token);

    try {
      // Start with the original working fields
      const eventData = {
        company_id: parseInt(formData.company_id),
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: parseInt(formData.category),
        city: parseInt(formData.city),
        price_per_person: parseFloat(formData.price_per_person),
        location: formData.location.trim()
      };

      // Add new fields if they have values
      if (formData.base_price) {
        eventData.base_price = parseFloat(formData.base_price);
      }
      if (formData.min_people) {
        eventData.min_people = parseInt(formData.min_people);
      }
      if (formData.max_people) {
        eventData.max_people = parseInt(formData.max_people);
      }
      if (formData.latitude) {
        eventData.latitude = parseFloat(formData.latitude);
      }
      if (formData.longitude) {
        eventData.longitude = parseFloat(formData.longitude);
      }
      if (formData.is_popular !== undefined) {
        eventData.is_popular = formData.is_popular;
      }
      if (formData.is_active !== undefined) {
        eventData.is_active = formData.is_active;
      }
      if (formData.is_featured !== undefined) {
        eventData.is_featured = formData.is_featured;
      }

      console.log('=== EVENT CREATION DEBUG ===');
      console.log('Form data:', formData);
      console.log('Event data to send:', eventData);
      console.log('Editing event:', editingEvent);
      console.log('Is editing mode:', !!editingEvent);
      console.log('Event ID for update:', editingEvent?.id);
      console.log('API endpoint:', editingEvent ? `/event/admin/event/update/${editingEvent.id}` : '/event/admin/event/create');
      console.log('Method:', editingEvent ? 'PATCH' : 'POST');
      console.log('Full URL will be:', `https://base.funfinder.ge/en/api/v2${editingEvent ? `/event/admin/event/update/${editingEvent.id}` : '/event/admin/event/create'}`);
      console.log('==========================');

      let response;
      let savedEventId = editingEvent?.id;
    if (editingEvent && editingEvent.id) {
        // Update existing event
        console.log('=== UPDATING EVENT ===');
        console.log('Calling eventApiV2.update with ID:', editingEvent.id);
        console.log('Update data:', eventData);
        try {
          response = await eventApiV2.update(editingEvent.id, eventData);
          console.log('Update response:', response);
          setSnackbar({
            open: true,
            message: 'Event updated successfully',
            severity: 'success'
          });
        } catch (updateError) {
          console.error('Update failed:', updateError);
          throw updateError;
        }
    } else {
        // Create new event
        console.log('=== CREATING EVENT ===');
        console.log('Calling eventApiV2.create with data:', eventData);
        try {
          response = await eventApiV2.create(eventData);
          console.log('Create response:', response);
          savedEventId = response?.id || response?.data?.id || response?.event?.id || response?.result?.id;
          setSnackbar({
            open: true,
            message: 'Event created successfully',
            severity: 'success'
          });
        } catch (createError) {
          console.error('Create failed:', createError);
          throw createError;
        }
      }

      // Upload image if one was selected in the form
      if (formData.image && savedEventId) {
        try {
          const imageFormData = new FormData();
          imageFormData.append('image', formData.image);
          imageFormData.append('alt_text', formData.image_alt_text?.trim() || formData.name.trim());
          imageFormData.append('is_primary', formData.image_is_primary);

          await eventApi.uploadImage(savedEventId, imageFormData);
          setSnackbar({
            open: true,
            message: editingEvent ? 'Event and image updated successfully' : 'Event created and image uploaded successfully',
            severity: 'success'
          });
        } catch (imageError) {
          console.error('Image upload failed:', imageError);
          setSnackbar({
            open: true,
            message: `Event saved, but image upload failed: ${imageError.response?.data?.detail || imageError.message}`,
            severity: 'warning'
          });
        }
      } else if (formData.image && !savedEventId) {
        setSnackbar({
          open: true,
          message: 'Event saved, but image could not be uploaded (missing event id).',
          severity: 'warning'
        });
      }

      console.log('API Response:', response);

      // Refresh events list to get the updated data with proper IDs
      await fetchEvents();
      
      // Ensure the dialog is closed after successful operation
      handleCloseDialog();
    } catch (error) {
      console.error('=== EVENT CREATION ERROR ===');
      console.error('Error object:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      console.error('Error message:', error.message);
      console.error('Request config:', error.config);
      console.error('==========================');
      
      // Log the full error response for debugging
      console.error('Full error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      
      // Try to extract more detailed error information
      let errorMessage = 'Error saving event';
      if (error.response?.data) {
        if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (typeof error.response.data === 'object') {
          // Try to extract field-specific errors
          const fieldErrors = Object.entries(error.response.data)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('; ');
          if (fieldErrors) {
            errorMessage = `Validation errors: ${fieldErrors}`;
          }
        }
      } else {
        errorMessage = error.message || 'Error saving event';
      }
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  };

  // Delete event
  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      await eventApiV2.delete(eventId);
      setSnackbar({
        open: true,
        message: 'Event deleted successfully',
        severity: 'success'
      });
      await fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      setSnackbar({
        open: true,
        message: `Error deleting event: ${error.response?.data?.detail || error.message}`,
        severity: 'error'
      });
    }
  };

  // Toggle event active status
  const handleToggleStatus = async (event) => {
    const action = event.is_active ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} "${event.name}"?`)) {
      return;
    }

    try {
      const eventData = {
        company_id: event.company_id || event.company,
        name: event.name,
        description: event.description,
        category: event.category?.id || event.category,
        city: event.city?.id || event.city,
        base_price: event.base_price || event.price_per_person,
        price_per_person: event.price_per_person,
        min_people: event.min_people,
        max_people: event.max_people,
        location: event.location,
        latitude: event.lat || event.latitude || event.coordinates?.lat,
        longitude: event.lng || event.longitude || event.coordinates?.lng,
        is_popular: event.is_popular,
        is_active: !event.is_active,
        is_featured: event.is_featured
      };
      
      await eventApiV2.update(event.id, eventData);
      setSnackbar({
        open: true,
        message: `Event ${action}d successfully`,
        severity: 'success'
      });
      await fetchEvents();
    } catch (error) {
      console.error(`Error ${action}ing event:`, error);
      setSnackbar({
        open: true,
        message: `Error ${action}ing event: ${error.response?.data?.detail || error.message}`,
        severity: 'error'
      });
    }
  };

  // Handle view details button click
  const handleViewDetails = async (event) => {
    console.log('Viewing details for event:', event.name, 'ID:', event.id);
    setDetailsLoading(true);
    setDetailsModalOpen(true);
    
    try {
      // Use getDetails endpoint which calls /event/details/${id}
      const response = await eventApi.getDetails(event.id);
      console.log('Using event details endpoint');

      console.log('Event details response:', response);
      console.log('Event details response keys:', Object.keys(response || {}));
      console.log('Event details images:', response?.images);
      console.log('Event details images type:', typeof response?.images);
      console.log('Event details images length:', response?.images?.length);
      
      // Handle different response structures
      let eventDetailsData = response;
      if (response?.data) {
        eventDetailsData = response.data;
      }
      
      // Log the final event details data
      console.log('Final eventDetailsData:', eventDetailsData);
      console.log('Final eventDetailsData images:', eventDetailsData?.images);
      console.log('Final eventDetailsData images length:', eventDetailsData?.images?.length);
      
      setEventDetails(eventDetailsData);
    } catch (error) {
      console.error('Error fetching event details:', error);
      setSnackbar({
        open: true,
        message: `Error loading event details: ${error.response?.data?.detail || error.message}`,
        severity: 'error'
      });
      setDetailsModalOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Handle close details modal
  const handleCloseDetailsModal = () => {
    setDetailsModalOpen(false);
    setEventDetails(null);
    setDetailsLoading(false);
  };

  // Handle delete image
  const handleDeleteImage = async (imageId, eventId) => {
    if (!window.confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
      return;
    }

    try {
      console.log('Deleting image:', imageId, 'from event:', eventId);
      await eventApi.deleteImage(eventId, imageId);
      
      setSnackbar({
        open: true,
        message: 'Image deleted successfully!',
        severity: 'success'
      });
      
      // Refresh event details to show updated data
      if (eventDetails) {
        await handleViewDetails({ id: eventDetails.id });
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      setSnackbar({
        open: true,
        message: `Error deleting image: ${error.response?.data?.detail || error.message}`,
        severity: 'error'
      });
    }
  };

  // Handle edit image button click
  const handleEditImage = (image, eventId) => {
    console.log('Editing image:', image, 'for event:', eventId);
    setSelectedImageForUpdate({ ...image, eventId });
    setImageUpdateData({
      alt_text: image.alt_text || '',
      is_primary: image.is_primary || false
    });
    setImageUpdateModalOpen(true);
  };

  // Handle close image update modal
  const handleCloseImageUpdateModal = () => {
    setImageUpdateModalOpen(false);
    setSelectedImageForUpdate(null);
    setImageUpdateData({
      alt_text: '',
      is_primary: false
    });
    setImageUpdating(false);
  };

  // Handle image update form submission
  const handleImageUpdate = async () => {
    if (!selectedImageForUpdate) {
      setSnackbar({
        open: true,
        message: 'No image selected for update',
        severity: 'error'
      });
      return;
    }

    if (!imageUpdateData.alt_text.trim()) {
      setSnackbar({
        open: true,
        message: 'Please provide alternative text for the image',
        severity: 'error'
      });
      return;
    }

    setImageUpdating(true);

    try {
      const updateData = {
        alt_text: imageUpdateData.alt_text.trim(),
        is_primary: imageUpdateData.is_primary
      };

      console.log('Updating image:', selectedImageForUpdate.id, 'with data:', updateData);
      
      const response = await eventApi.updateImage(
        selectedImageForUpdate.eventId, 
        selectedImageForUpdate.id, 
        updateData
      );

      console.log('Image update response:', response);

      setSnackbar({
        open: true,
        message: 'Image updated successfully!',
        severity: 'success'
      });

      handleCloseImageUpdateModal();
      
      // Refresh event details to show updated data
      if (eventDetails) {
        await handleViewDetails({ id: eventDetails.id });
      }
    } catch (error) {
      console.error('Error updating image:', error);
      setSnackbar({
        open: true,
        message: `Error updating image: ${error.response?.data?.detail || error.message}`,
        severity: 'error'
      });
    } finally {
      setImageUpdating(false);
    }
  };

  // Handle add image button click
  const handleAddImage = (event) => {
    console.log('Add image for event:', event.name);
    setSelectedEvent(event);
    setImageUploadData({
      image: null,
      alt_text: '',
      is_primary: false
    });
    setImageModalOpen(true);
  };

  // Handle image upload modal close
  const handleImageModalClose = () => {
    setImageModalOpen(false);
    setSelectedEvent(null);
    setImageUploadData({
      image: null,
      alt_text: '',
      is_primary: false
    });
    setImageUploading(false);
  };

  // Handle image file selection
  const handleImageFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setSnackbar({
          open: true,
          message: 'Please select a valid image file (PNG, JPEG, GIF, or WebP)',
          severity: 'error'
        });
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setSnackbar({
          open: true,
          message: 'Image file size must be less than 10MB',
          severity: 'error'
        });
        return;
      }

      setImageUploadData(prev => ({
        ...prev,
        image: file
      }));
    }
  };

  // Handle image upload form submission
  const handleImageUpload = async () => {
    if (!imageUploadData.image) {
      setSnackbar({
        open: true,
        message: 'Please select an image file',
        severity: 'error'
      });
      return;
    }

    if (!imageUploadData.alt_text.trim()) {
      setSnackbar({
        open: true,
        message: 'Please provide alternative text for the image',
        severity: 'error'
      });
      return;
    }

    setImageUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', imageUploadData.image);
      formData.append('alt_text', imageUploadData.alt_text);
      formData.append('is_primary', imageUploadData.is_primary);

      const response = await eventApi.uploadImage(selectedEvent.id, formData);

      setSnackbar({
        open: true,
        message: 'Image uploaded successfully!',
        severity: 'success'
      });

      handleImageModalClose();
      
      // Refresh events to show updated data
      await fetchEvents();
    } catch (error) {
      console.error('Error uploading image:', error);
      setSnackbar({
        open: true,
        message: `Error uploading image: ${error.response?.data?.detail || error.message}`,
        severity: 'error'
      });
    } finally {
      setImageUploading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Copy coordinates to clipboard
  const handleCopyCoordinates = (latitude, longitude) => {
    const coordinates = `${latitude}, ${longitude}`;
    navigator.clipboard.writeText(coordinates).then(() => {
      setSnackbar({
        open: true,
        message: 'Coordinates copied to clipboard!',
        severity: 'success'
      });
    }).catch(() => {
      setSnackbar({
        open: true,
        message: 'Failed to copy coordinates',
        severity: 'error'
      });
    });
  };

  // Get status color
  const getStatusColor = (isActive) => {
    return isActive ? 'success' : 'error';
  };

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' }, 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', md: 'center' }, 
        mb: 4,
        p: 3,
        borderRadius: 3,
        background: 'linear-gradient(135deg, #ffffff 0%, #f4f6f8 100%)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.04)',
        gap: { xs: 2, md: 0 }
      }}>
        <Typography variant="h4" sx={{ fontWeight: 800, background: 'linear-gradient(45deg, #1976d2, #9c27b0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Events Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', md: 'auto' } }}>
          {canCreate && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{ 
                borderRadius: 2, 
                px: 3,
                boxShadow: '0 4px 14px rgba(25, 118, 210, 0.4)',
                flex: { xs: 1, md: 'none' }
              }}
            >
              Add Event
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchEvents}
            disabled={loading}
            sx={{ 
              borderRadius: 2,
              flex: { xs: 1, md: 'none' }
            }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : events.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <Typography variant="h6" color="textSecondary">
            No events found
          </Typography>
        </Box>
      ) : isMobile ? (
        <Grid container spacing={3}>
          {events
            .filter(event => event && event.id && typeof event.id !== 'undefined')
            .map((event) => {
              const coords = extractCoordinates(event);
              return (
                <Grid item xs={12} key={event.id} sx={{ display: 'flex', width: '100%' }}>
                  <Card sx={{
                    borderRadius: 3,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 32px rgba(0,0,0,0.1)'
                    }
                  }}>
                    <Box sx={{ position: 'relative', height: 180, backgroundColor: '#f0f2f5' }}>
                      {event.image || event.primary_image ? (
                        <>
                          <img
                            src={getImageUrl(event.image || event.primary_image?.image)}
                            alt={event.primary_image?.alt_text || event.name || 'Event image'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const fallback = e.target.parentElement?.querySelector('.fallback-icon');
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                          <Box className="fallback-icon" sx={{ display: 'none', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                            <ImageIcon sx={{ color: 'text.secondary', fontSize: 40 }} />
                          </Box>
                        </>
                      ) : (
                        <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ImageIcon sx={{ color: 'text.secondary', fontSize: 40 }} />
                        </Box>
                      )}
                      
                      <Box sx={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 1 }}>
                        <Chip 
                          label={event.is_active ? 'Active' : 'Inactive'} 
                          sx={{ 
                            backgroundColor: event.is_active ? 'rgba(46, 204, 113, 0.9)' : 'rgba(231, 76, 60, 0.9)', 
                            color: 'white', 
                            fontWeight: 600, 
                            backdropFilter: 'blur(4px)' 
                          }} 
                          size="small" 
                        />
                      </Box>
                    </Box>
                    <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#1a1f36' }}>
                        {event.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <LocationIcon sx={{ fontSize: 16, color: 'primary.main', mr: 0.5 }} />
                        <Typography variant="body2" color="text.secondary">
                          {event.city?.name || event.city || 'N/A'} • {event.location || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                        <Chip label={event.category?.name || event.category || 'N/A'} size="small" sx={{ backgroundColor: '#f3f4f6', color: '#4b5563', fontWeight: 600 }} />
                        {event.is_popular && <Chip label="Popular" size="small" sx={{ backgroundColor: '#fff3cd', color: '#856404', fontWeight: 600 }} />}
                        {event.is_featured && <Chip label="Featured" size="small" sx={{ backgroundColor: '#cce5ff', color: '#004085', fontWeight: 600 }} />}
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, borderTop: '1px solid #f0f0f0' }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            Price
                          </Typography>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1a1f36' }}>
                            ${event.price_per_person || 'N/A'}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            Capacity
                          </Typography>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1a1f36' }}>
                            {event.min_people || 'N/A'} - {event.max_people || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, mt: 'auto', pt: 2, borderTop: '1px solid #f0f0f0', justifyContent: 'flex-end' }}>
                        {canRead && (
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => handleViewDetails(event)} sx={{ backgroundColor: '#e3f2fd', color: '#1976d2', '&:hover': { backgroundColor: '#bbdefb' } }}>
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {canUpdate && (
                          <Tooltip title="Edit Event">
                            <IconButton size="small" onClick={() => handleOpenDialog(event)} sx={{ backgroundColor: '#f3e5f5', color: '#9c27b0', '&:hover': { backgroundColor: '#e1bee7' } }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Add Image">
                          <IconButton size="small" onClick={() => handleAddImage(event)} sx={{ backgroundColor: '#fff8e1', color: '#f57c00', '&:hover': { backgroundColor: '#ffecb3' } }}>
                            <ImageIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {canDelete && (
                          <Tooltip title="Delete Event">
                            <IconButton size="small" onClick={() => handleDeleteEvent(event.id)} sx={{ backgroundColor: '#ffebee', color: '#d32f2f', '&:hover': { backgroundColor: '#ffcdd2' } }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
        </Grid>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.04)', overflow: 'hidden', border: 'none' }}>
          <Table sx={{ minWidth: 1000 }}>
            <TableHead sx={{ backgroundColor: '#fafbfc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: '#4a5568', py: 2 }}>Event Details</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#4a5568', py: 2 }}>Category & Location</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#4a5568', py: 2 }}>Pricing</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#4a5568', py: 2 }}>Status</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, color: '#4a5568', py: 2 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events
                .filter(event => event && event.id && typeof event.id !== 'undefined')
                .map((event) => (
                <TableRow key={event.id} hover sx={{ '&:hover': { backgroundColor: '#f8fafd' }, transition: 'background-color 0.2s ease' }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ mr: 2, position: 'relative' }}>
                        {event.image || event.primary_image ? (
                          <>
                            <img
                              src={getImageUrl(event.image || event.primary_image?.image)}
                              alt={event.primary_image?.alt_text || event.name || 'Event image'}
                              style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                const fallback = e.target.parentElement?.querySelector('.event-thumb-fallback');
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                            <Box className="event-thumb-fallback" sx={{ display: 'none', width: 64, height: 64, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f2f5', borderRadius: 12 }}>
                              <ImageIcon sx={{ color: 'text.secondary', fontSize: 28 }} />
                            </Box>
                          </>
                        ) : (
                          <Box sx={{ width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f2f5', borderRadius: 12 }}>
                            <ImageIcon sx={{ color: 'text.secondary', fontSize: 28 }} />
                          </Box>
                        )}
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1a202c', fontSize: '0.95rem' }}>
                          {event.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#718096', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {event.description}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Chip label={event.category?.name || event.category || 'N/A'} size="small" sx={{ width: 'fit-content', backgroundColor: '#edf2f7', color: '#2d3748', fontWeight: 600 }} />
                      <Typography variant="body2" sx={{ color: '#4a5568', mt: 1, display: 'flex', alignItems: 'center' }}>
                        <LocationIcon sx={{ fontSize: 14, mr: 0.5, color: '#a0aec0' }} />
                        {event.city?.name || event.city || 'N/A'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#2d3748' }}>
                        ${event.price_per_person || 'N/A'} <span style={{ fontWeight: 400, color: '#a0aec0' }}>/ person</span>
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#718096' }}>
                        Capacity: {event.min_people || 'N/A'} - {event.max_people || 'N/A'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip label={event.is_active ? 'Active' : 'Inactive'} sx={{ backgroundColor: event.is_active ? '#c6f6d5' : '#fed7d7', color: event.is_active ? '#22543d' : '#822727', fontWeight: 600 }} size="small" />
                      {event.is_popular && <Chip label="Popular" sx={{ backgroundColor: '#feebc8', color: '#7b341e', fontWeight: 600 }} size="small" />}
                      {event.is_featured && <Chip label="Featured" sx={{ backgroundColor: '#eebafa', color: '#44337a', fontWeight: 600 }} size="small" />}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      {canRead && (
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => handleViewDetails(event)} sx={{ color: '#3182ce', backgroundColor: '#ebf8ff', '&:hover': { backgroundColor: '#bee3f8' } }}>
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canUpdate && (
                        <Tooltip title="Edit Event">
                          <IconButton size="small" onClick={() => handleOpenDialog(event)} sx={{ color: '#805ad5', backgroundColor: '#faf5ff', '&:hover': { backgroundColor: '#e9d8fd' } }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Add Image">
                        <IconButton size="small" onClick={() => handleAddImage(event)} sx={{ color: '#dd6b20', backgroundColor: '#fffff0', '&:hover': { backgroundColor: '#fefcbf' } }}>
                          <ImageIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {canDelete && (
                        <Tooltip title="Delete Event">
                          <IconButton size="small" onClick={() => handleDeleteEvent(event.id)} sx={{ color: '#e53e3e', backgroundColor: '#fff5f5', '&:hover': { backgroundColor: '#fed7d7' } }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit Event Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingEvent ? 'Edit Event' : 'Add New Event'}
        </DialogTitle>
                <DialogContent sx={{ p: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ color: '#ff6b35', fontWeight: 'bold', mb: 2 }}>
              Event Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  placeholder="Event Name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 2, color: '#666' }}>
                        📝
                      </Box>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      '&:hover': {
                        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  multiline
                  rows={3}
                  required
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 2, color: '#666' }}>
                        📄
                      </Box>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      '&:hover': {
                        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                      },
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ color: '#ff6b35', fontWeight: 'bold', mb: 2 }}>
              Company & Category
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Company</InputLabel>
                  <Select
                    value={formData.company_id}
                    onChange={(e) => handleInputChange('company_id', e.target.value)}
                    label="Company"
                    startAdornment={
                      <Box sx={{ mr: 2, color: '#666' }}>
                        🏢
                      </Box>
                    }
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        '&:hover': {
                          boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                        },
                      },
                    }}
                  >
                    {companies.length === 0 ? (
                      <MenuItem disabled>
                        <Typography variant="body2" color="text.secondary">
                          {loading ? 'Loading companies...' : 'No companies available'}
                        </Typography>
                      </MenuItem>
                    ) : (
                      companies.map((company) => (
                        <MenuItem key={company.id} value={company.id}>
                          {company.name}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    label="Category"
                    startAdornment={
                      <Box sx={{ mr: 2, color: '#666' }}>
                        🏷️
                      </Box>
                    }
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        '&:hover': {
                          boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                        },
                      },
                    }}
                  >
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ color: '#ff6b35', fontWeight: 'bold', mb: 2 }}>
              Location & Pricing
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth required>
                  <InputLabel>City</InputLabel>
                  <Select
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    label="City"
                    startAdornment={
                      <Box sx={{ mr: 2, color: '#666' }}>
                        🏙️
                      </Box>
                    }
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        '&:hover': {
                          boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                        },
                      },
                    }}
                  >
                    {cities.map((city) => (
                      <MenuItem key={city.id} value={city.id}>
                        {city.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  placeholder="Price Per Person"
                  type="number"
                  value={formData.base_price}
                  onChange={(e) => handleInputChange('base_price', e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 2, color: '#666' }}>
                        💰
                      </Box>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      '&:hover': {
                        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  placeholder="Base Price"
                  type="number"
                  value={formData.price_per_person}
                  onChange={(e) => handleInputChange('price_per_person', e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 2, color: '#666' }}>
                        💵
                      </Box>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      '&:hover': {
                        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  placeholder="Min People"
                  type="number"
                  value={formData.min_people}
                  onChange={(e) => handleInputChange('min_people', e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 2, color: '#666' }}>
                        👥
                      </Box>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      '&:hover': {
                        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  placeholder="Max People"
                  type="number"
                  value={formData.max_people}
                  onChange={(e) => handleInputChange('max_people', e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 2, color: '#666' }}>
                        👥
                      </Box>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      '&:hover': {
                        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  placeholder="Location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 2, color: '#666' }}>
                        📍
                      </Box>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      '&:hover': {
                        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                      },
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ color: '#ff6b35', fontWeight: 'bold', mb: 2 }}>
              Coordinates
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  placeholder="Latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Limit to 9 digits total
                    if (value.length <= 9) {
                      handleInputChange('latitude', value);
                    }
                  }}
                  helperText="Max 9 digits total"
                  required
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 2, color: '#666' }}>
                        🌐
                      </Box>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      '&:hover': {
                        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  placeholder="Longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Limit to 9 digits total
                    if (value.length <= 9) {
                      handleInputChange('longitude', value);
                    }
                  }}
                  helperText="Max 9 digits total"
                  required
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 2, color: '#666' }}>
                        🌐
                      </Box>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      '&:hover': {
                        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  startIcon={<MapIcon />}
                  onClick={handleOpenMapPicker}
                  sx={{
                    borderColor: '#ff6b35',
                    color: '#ff6b35',
                    '&:hover': {
                      borderColor: '#e55a2b',
                      backgroundColor: '#fff5f2',
                    },
                  }}
                >
                  Pick Location on Map
                </Button>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ color: '#ff6b35', fontWeight: 'bold', mb: 2 }}>
              Event Image
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {editingEvent
                ? 'Optional. Upload a new image to add to this event. Existing images are not replaced.'
                : 'Optional. Upload an image to attach when the event is created.'}
            </Typography>

            <Box sx={{ mb: 2 }}>
              <input
                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                style={{ display: 'none' }}
                id="event-form-image-upload"
                type="file"
                onChange={handleFormImageChange}
              />
              <label htmlFor="event-form-image-upload">
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                  sx={{
                    py: 2,
                    borderStyle: 'dashed',
                    borderWidth: 2,
                    '&:hover': { borderStyle: 'dashed', borderWidth: 2 }
                  }}
                >
                  {formData.image ? (
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body1" color="primary">
                        {formData.image.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {(formData.image.size / 1024 / 1024).toFixed(2)} MB
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center' }}>
                      <ImageIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                      <Typography variant="body1">Click to select an image</Typography>
                      <Typography variant="body2" color="text.secondary">
                        PNG, JPEG, GIF, WebP — max 10MB
                      </Typography>
                    </Box>
                  )}
                </Button>
              </label>
              {formData.image && (
                <Button
                  size="small"
                  color="error"
                  sx={{ mt: 1 }}
                  onClick={() => setFormData(prev => ({ ...prev, image: null }))}
                >
                  Remove selected image
                </Button>
              )}
            </Box>

            {formData.image && (
              <>
                <TextField
                  fullWidth
                  label="Alternative Text"
                  placeholder="Describe the image for accessibility (defaults to event name)"
                  value={formData.image_alt_text}
                  onChange={(e) => handleInputChange('image_alt_text', e.target.value)}
                  multiline
                  rows={2}
                  sx={{ mb: 2 }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.image_is_primary}
                      onChange={(e) => handleInputChange('image_is_primary', e.target.checked)}
                    />
                  }
                  label="Set as primary image"
                />
              </>
            )}
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ color: '#ff6b35', fontWeight: 'bold', mb: 2 }}>
              Event Settings
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.is_popular}
                      onChange={(e) => handleInputChange('is_popular', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Is Popular"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.is_active}
                      onChange={(e) => handleInputChange('is_active', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Is Active"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.is_featured}
                      onChange={(e) => handleInputChange('is_featured', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Is Featured"
                />
              </Grid>
            </Grid>
          </Box>

        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingEvent ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Map Picker Modal */}
      <MapPicker
        open={openMapPicker}
        onClose={handleCloseMapPicker}
        onLocationSelect={handleLocationSelect}
        initialLocation={{
          lat: formData.latitude ? parseFloat(formData.latitude) : 41.6500,
          lng: formData.longitude ? parseFloat(formData.longitude) : 41.6333
        }}
        height="500px"
      />

      {/* Image Upload Modal */}
      <Dialog open={imageModalOpen} onClose={handleImageModalClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ImageIcon sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="h6">
              Upload Image for "{selectedEvent?.name}"
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Upload an image for this event. Supported formats: PNG, JPEG, GIF, WebP (max 10MB)
            </Typography>
            
            {/* File Upload */}
            <Box sx={{ mb: 3 }}>
              <input
                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                style={{ display: 'none' }}
                id="image-upload"
                type="file"
                onChange={handleImageFileChange}
              />
              <label htmlFor="image-upload">
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                  sx={{ 
                    py: 2,
                    borderStyle: 'dashed',
                    borderWidth: 2,
                    '&:hover': {
                      borderStyle: 'dashed',
                      borderWidth: 2,
                    }
                  }}
                >
                  {imageUploadData.image ? (
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body1" color="primary">
                        {imageUploadData.image.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {(imageUploadData.image.size / 1024 / 1024).toFixed(2)} MB
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center' }}>
                      <ImageIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                      <Typography variant="body1">
                        Click to select image file
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        or drag and drop
                      </Typography>
                    </Box>
                  )}
                </Button>
              </label>
            </Box>

            {/* Alt Text */}
            <TextField
              fullWidth
              label="Alternative Text"
              placeholder="Describe the image for accessibility"
              value={imageUploadData.alt_text}
              onChange={(e) => setImageUploadData(prev => ({
                ...prev,
                alt_text: e.target.value
              }))}
              multiline
              rows={2}
              required
              sx={{ mb: 3 }}
            />

            {/* Primary Image Checkbox */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={imageUploadData.is_primary}
                  onChange={(e) => setImageUploadData(prev => ({
                    ...prev,
                    is_primary: e.target.checked
                  }))}
                />
              }
              label="Set as primary image"
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Primary images are displayed as the main event image
            </Typography>
          </Box>

          {/* Upload Progress */}
          {imageUploading && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Uploading image...
              </Typography>
              <LinearProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleImageModalClose} disabled={imageUploading}>
            Cancel
          </Button>
          <Button 
            onClick={handleImageUpload} 
            variant="contained"
            disabled={!imageUploadData.image || !imageUploadData.alt_text.trim() || imageUploading}
            startIcon={<ImageIcon />}
          >
            {imageUploading ? 'Uploading...' : 'Upload Image'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Event Details Modal */}
      <Dialog open={detailsModalOpen} onClose={handleCloseDetailsModal} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <EventIcon sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="h5">
              Event Details
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {detailsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : eventDetails ? (
            <Box>
              {/* Basic Information */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ color: '#ff6b35', fontWeight: 'bold', mb: 2 }}>
                  Basic Information
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <EventIcon sx={{ mr: 2, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {eventDetails.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ID: {eventDetails.id}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <LocationIcon sx={{ mr: 2, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="body1" fontWeight="bold">
                          {eventDetails.location}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {eventDetails.city?.name || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      {eventDetails.description}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Pricing Information */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ color: '#ff6b35', fontWeight: 'bold', mb: 2 }}>
                  Pricing & Capacity
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    <Card sx={{ p: 2, textAlign: 'center' }}>
                      <MoneyIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                      <Typography variant="h6" fontWeight="bold">
                        ${eventDetails.base_price}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Base Price
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card sx={{ p: 2, textAlign: 'center' }}>
                      <MoneyIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                      <Typography variant="h6" fontWeight="bold">
                        ${eventDetails.discounted_price || eventDetails.price_per_person}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Current Price
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card sx={{ p: 2, textAlign: 'center' }}>
                      <PeopleIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                      <Typography variant="h6" fontWeight="bold">
                        {eventDetails.min_people || 'N/A'} - {eventDetails.max_people || 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        People Capacity
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>
              </Box>

              {/* Discount Information */}
              {eventDetails.current_discount && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ color: '#ff6b35', fontWeight: 'bold', mb: 2 }}>
                    Current Discount
                  </Typography>
                  <Card sx={{ p: 2, backgroundColor: '#f8f9fa' }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body1">
                          <strong>Type:</strong> {eventDetails.current_discount.discount_type}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body1">
                          <strong>Value:</strong> {eventDetails.current_discount.discount_value}
                          {eventDetails.current_discount.discount_type === 'percentage' ? '%' : '$'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body1">
                          <strong>Valid Until:</strong> {eventDetails.current_discount.valid_until ? 
                            new Date(eventDetails.current_discount.valid_until).toLocaleDateString() : 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body1">
                          <strong>Savings:</strong> ${eventDetails.base_price - eventDetails.discounted_price}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Card>
                </Box>
              )}

              {/* Statistics */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ color: '#ff6b35', fontWeight: 'bold', mb: 2 }}>
                  Statistics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TrendingUpIcon sx={{ mr: 2, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {eventDetails.views_count || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Views
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PeopleIcon sx={{ mr: 2, color: 'success.main' }} />
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {eventDetails.bookings_count || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Bookings
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <StarIcon sx={{ mr: 2, color: 'warning.main' }} />
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {eventDetails.is_popular ? 'Yes' : 'No'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Popular
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* Category & Company */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ color: '#ff6b35', fontWeight: 'bold', mb: 2 }}>
                  Category & Company
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Card sx={{ p: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                        Category
                      </Typography>
                      <Typography variant="body1">
                        {eventDetails.category?.name || 'N/A'}
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card sx={{ p: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                        Company
                      </Typography>
                      <Typography variant="body1">
                        {eventDetails.company?.name || 'N/A'}
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>
              </Box>

              {/* Location & Coordinates */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ color: '#ff6b35', fontWeight: 'bold', mb: 2 }}>
                  Location & Coordinates
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Card sx={{ p: 2, border: '2px solid #1976d2', backgroundColor: '#f3f8ff' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <LocationIcon sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                        <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
                          Latitude
                        </Typography>
                      </Box>
                      <Typography variant="h6" fontWeight="bold" color="primary.main">
                        {eventDetails.latitude || 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Geographic latitude coordinate
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card sx={{ p: 2, border: '2px solid #9c27b0', backgroundColor: '#faf5ff' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <LocationIcon sx={{ mr: 1, color: 'secondary.main', fontSize: 20 }} />
                        <Typography variant="subtitle1" fontWeight="bold" color="secondary.main">
                          Longitude
                        </Typography>
                      </Box>
                      <Typography variant="h6" fontWeight="bold" color="secondary.main">
                        {eventDetails.longitude || 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Geographic longitude coordinate
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12}>
                    <Card sx={{ p: 2, backgroundColor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <MapIcon sx={{ mr: 1, color: 'text.primary', fontSize: 20 }} />
                          <Typography variant="subtitle1" fontWeight="bold">
                            Full Coordinates
                          </Typography>
                        </Box>
                        {eventDetails.latitude && eventDetails.longitude && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleCopyCoordinates(eventDetails.latitude, eventDetails.longitude)}
                            sx={{ 
                              minWidth: 'auto',
                              px: 2,
                              py: 0.5,
                              fontSize: '0.75rem'
                            }}
                          >
                            Copy
                          </Button>
                        )}
                      </Box>
                      <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '1.1rem', mb: 1 }}>
                        {eventDetails.latitude && eventDetails.longitude 
                          ? `${eventDetails.latitude}, ${eventDetails.longitude}`
                          : 'Coordinates not available'
                        }
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {eventDetails.latitude && eventDetails.longitude 
                          ? 'Click "Copy" to copy coordinates to clipboard for use in mapping applications'
                          : 'No coordinates available for this event'
                        }
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>
              </Box>

              {/* Status Flags */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ color: '#ff6b35', fontWeight: 'bold', mb: 2 }}>
                  Status Flags
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    <Card sx={{ p: 2, textAlign: 'center' }}>
                      <StarIcon sx={{ fontSize: 40, color: eventDetails.is_popular ? 'warning.main' : 'grey.400', mb: 1 }} />
                      <Typography variant="h6" fontWeight="bold" color={eventDetails.is_popular ? 'warning.main' : 'text.secondary'}>
                        {eventDetails.is_popular ? 'Yes' : 'No'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Popular
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card sx={{ p: 2, textAlign: 'center' }}>
                      <CheckCircleIcon sx={{ fontSize: 40, color: eventDetails.is_active ? 'success.main' : 'grey.400', mb: 1 }} />
                      <Typography variant="h6" fontWeight="bold" color={eventDetails.is_active ? 'success.main' : 'text.secondary'}>
                        {eventDetails.is_active ? 'Yes' : 'No'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Active
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card sx={{ p: 2, textAlign: 'center' }}>
                      <FeaturedIcon sx={{ fontSize: 40, color: eventDetails.is_featured ? 'primary.main' : 'grey.400', mb: 1 }} />
                      <Typography variant="h6" fontWeight="bold" color={eventDetails.is_featured ? 'primary.main' : 'text.secondary'}>
                        {eventDetails.is_featured ? 'Yes' : 'No'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Featured
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>
              </Box>

              {/* Timestamps */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ color: '#ff6b35', fontWeight: 'bold', mb: 2 }}>
                  Timestamps
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Card sx={{ p: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                        Created At
                      </Typography>
                      <Typography variant="body1">
                        {eventDetails.created_at ? new Date(eventDetails.created_at).toLocaleString() : 'N/A'}
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card sx={{ p: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                        Updated At
                      </Typography>
                      <Typography variant="body1">
                        {eventDetails.updated_at ? new Date(eventDetails.updated_at).toLocaleString() : 'N/A'}
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>
              </Box>

              {/* Images */}
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: '#ff6b35', fontWeight: 'bold' }}>
                    Event Images ({(() => {
                      const images = eventDetails.images || eventDetails.event_images || [];
                      console.log('Admin - Images count - eventDetails.images:', eventDetails.images);
                      console.log('Admin - Images count - eventDetails.event_images:', eventDetails.event_images);
                      console.log('Admin - Images count - final:', images.length);
                      return images.length;
                    })()})
                  </Typography>
                  {canCreate && (
                    <Button
                      variant="outlined"
                      startIcon={<ImageIcon />}
                      onClick={() => handleAddImage(eventDetails)}
                      size="small"
                    >
                      Add Image
                    </Button>
                  )}
                </Box>
                
                {(() => {
                  const images = eventDetails.images || eventDetails.event_images || [];
                  console.log('Admin - Rendering images section. Images array:', images);
                  return images.length > 0 ? (
                  <Grid container spacing={2}>
                    {images.map((image, index) => {
                      console.log('Admin - Rendering image:', image, 'index:', index);
                      return (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card sx={{ 
                          p: 2, 
                          position: 'relative',
                          border: image.is_primary ? '2px solid #1976d2' : '1px solid #e0e0e0',
                          '&:hover': {
                            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                            transform: 'translateY(-2px)',
                            transition: 'all 0.2s ease-in-out'
                          }
                        }}>
                          {/* Primary Image Badge */}
                          {image.is_primary && (
                            <Chip 
                              label="Primary Image" 
                              color="primary" 
                              size="small" 
                              sx={{ 
                                position: 'absolute', 
                                top: 8, 
                                right: 8, 
                                zIndex: 1,
                                fontWeight: 'bold'
                              }} 
                            />
                          )}
                          
                          {/* Image */}
                          <Box sx={{ position: 'relative', mb: 2 }}>
                            <img
                              src={image.image?.startsWith('http') 
                                ? image.image 
                                : image.image?.startsWith('/')
                                ? `https://base.funfinder.ge${image.image}`
                                : `https://base.funfinder.ge/${image.image}`}
                              alt={image.alt_text || 'Event image'}
                              style={{
                                width: '100%',
                                height: 200,
                                objectFit: 'cover',
                                borderRadius: 8,
                                cursor: 'pointer'
                              }}
                              onError={(e) => {
                                console.error('Image load error:', image.image, e);
                                e.target.style.display = 'none';
                              }}
                              onClick={() => {
                                // Open image in new tab for full view
                                const imageUrl = image.image?.startsWith('http') 
                                  ? image.image 
                                  : image.image?.startsWith('/')
                                  ? `https://base.funfinder.ge${image.image}`
                                  : `https://base.funfinder.ge/${image.image}`;
                                window.open(imageUrl, '_blank');
                              }}
                            />
                            
                            {/* Image Overlay on Hover */}
                            <Box sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              background: 'rgba(0,0,0,0.5)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: 0,
                              transition: 'opacity 0.2s ease-in-out',
                              borderRadius: 8,
                              '&:hover': {
                                opacity: 1
                              }
                            }}>
                              <Typography variant="body2" color="white" fontWeight="bold">
                                Click to view full size
                              </Typography>
                            </Box>
                          </Box>
                          
                          {/* Image Info */}
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              <strong>Alt Text:</strong> {image.alt_text || 'No description'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              <strong>ID:</strong> {image.id}
                            </Typography>
                          </Box>
                          
                          {/* Action Buttons */}
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            {canUpdate && (
                              <Tooltip title="Edit Image">
                                <IconButton 
                                  size="small" 
                                  color="primary"
                                  onClick={() => handleEditImage(image, eventDetails.id)}
                                >
                                  <EditImageIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {canDelete && (
                              <Tooltip title="Delete Image">
                                <IconButton 
                                  size="small" 
                                  color="error"
                                  onClick={() => handleDeleteImage(image.id, eventDetails.id)}
                                >
                                  <DeleteImageIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </Card>
                      </Grid>
                      );
                    })}
                  </Grid>
                  ) : (
                  <Box sx={{ 
                    textAlign: 'center', 
                    py: 4, 
                    border: '2px dashed #e0e0e0', 
                    borderRadius: 2,
                    bgcolor: '#fafafa'
                  }}>
                    <ImageIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                      No Images Yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Add images to make your event more attractive
                    </Typography>
                    {canCreate && (
                      <Button
                        variant="contained"
                        startIcon={<ImageIcon />}
                        onClick={() => handleAddImage(eventDetails)}
                      >
                        Add First Image
                      </Button>
                    )}
                  </Box>
                );
                })()}
              </Box>

              {/* Creation Date */}
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Created: {eventDetails.created_at ? new Date(eventDetails.created_at).toLocaleDateString() : 'N/A'}
                </Typography>
              </Box>
            </Box>
          ) : (
            <Typography variant="body1" color="text.secondary">
              No event details available
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseDetailsModal} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Update Modal */}
      <Dialog open={imageUpdateModalOpen} onClose={handleCloseImageUpdateModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <EditImageIcon sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="h6">
              Update Image
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedImageForUpdate && (
            <Box>
              {/* Current Image Preview */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Current Image:
                </Typography>
                <img
                  src={`${selectedImageForUpdate.image}`}
                  alt={selectedImageForUpdate.alt_text || 'Event image'}
                  style={{
                    width: '100%',
                    maxHeight: 200,
                    objectFit: 'cover',
                    borderRadius: 8,
                    border: '1px solid #e0e0e0'
                  }}
                />
              </Box>

              {/* Alt Text */}
              <TextField
                fullWidth
                label="Alternative Text"
                placeholder="Describe the image for accessibility"
                value={imageUpdateData.alt_text}
                onChange={(e) => setImageUpdateData(prev => ({
                  ...prev,
                  alt_text: e.target.value
                }))}
                multiline
                rows={2}
                required
                sx={{ mb: 3 }}
              />

              {/* Primary Image Checkbox */}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={imageUpdateData.is_primary}
                    onChange={(e) => setImageUpdateData(prev => ({
                      ...prev,
                      is_primary: e.target.checked
                    }))}
                  />
                }
                label="Set as primary image"
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Primary images are displayed as the main event image
              </Typography>

              {/* Update Progress */}
              {imageUpdating && (
                <Box sx={{ mb: 2, mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Updating image...
                  </Typography>
                  <LinearProgress />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleCloseImageUpdateModal} disabled={imageUpdating}>
            Cancel
          </Button>
          <Button 
            onClick={handleImageUpdate} 
            variant="contained"
            disabled={!imageUpdateData.alt_text.trim() || imageUpdating}
            startIcon={<EditImageIcon />}
          >
            {imageUpdating ? 'Updating...' : 'Update Image'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Events;
