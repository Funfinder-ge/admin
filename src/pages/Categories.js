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
  Chip,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as ViewIcon, Category as CategoryIcon, Link as LinkIcon } from '@mui/icons-material';
import { categoryApi, companyApi } from '../services/api';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openCompaniesDialog, setOpenCompaniesDialog] = useState(false);
  const [openLinkDialog, setOpenLinkDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', order: 0, activity: '' });
  const [loading, setLoading] = useState(true);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingAllCompanies, setLoadingAllCompanies] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [allCompanies, setAllCompanies] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
    fetchAllCompanies();
  }, []);

  const fetchAllCompanies = async () => {
    try {
      setLoadingAllCompanies(true);
      const response = await companyApi.getAll();
      const companiesList = Array.isArray(response) ? response : (response?.data || []);
      setAllCompanies(companiesList);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoadingAllCompanies(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryApi.getAll();
      setCategories(Array.isArray(response) ? response : (response?.data || []));
    } catch (error) {
      console.error('Error fetching categories:', error);
      showSnackbar('Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (category = null) => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        order: category.order || 0,
        activity: category.activity || ''
      });
      setEditingCategory(category);
    } else {
      setFormData({ name: '', description: '', order: 0, activity: '' });
      setEditingCategory(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCategory(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'order' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingCategory) {
        await categoryApi.update({
          ...formData,
          category_id: editingCategory.id || editingCategory.category_id
        });
        showSnackbar('Category updated successfully', 'success');
      } else {
        await categoryApi.create(formData);
        showSnackbar('Category created successfully', 'success');
      }
      fetchCategories();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving category:', error);
      showSnackbar(`Failed to ${editingCategory ? 'update' : 'create'} category`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        setLoading(true);
        await categoryApi.delete(id);
        showSnackbar('Category deleted successfully', 'success');
        fetchCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
        showSnackbar('Failed to delete category', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleViewCompanies = async (categoryId) => {
    try {
      setLoadingCompanies(true);
      setSelectedCategoryId(categoryId);
      const category = categories.find(c => (c.id || c.category_id) === categoryId);
      setSelectedCategoryName(category?.name || 'Unknown Category');
      
      // Fetch companies connected to this category via the endpoint
      const response = await categoryApi.getCompanyFeedByCategory(categoryId);
      console.log(`Companies connected to category ${categoryId} (${category?.name}):`, response);
      
      const companiesData = Array.isArray(response) ? response : (response?.data || []);
      setCompanies(companiesData);
      setOpenCompaniesDialog(true);
    } catch (error) {
      console.error('Error fetching companies:', error);
      showSnackbar('Failed to load companies connected to this category', 'error');
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleCloseCompaniesDialog = () => {
    setOpenCompaniesDialog(false);
    setCompanies([]);
    setSelectedCategoryId(null);
    setSelectedCategoryName(null);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleOpenLinkDialog = (categoryId) => {
    setSelectedCategoryId(categoryId);
    const category = categories.find(c => (c.id || c.category_id) === categoryId);
    setSelectedCategoryName(category?.name || 'Unknown Category');
    setSelectedCompanyId('');
    setOpenLinkDialog(true);
  };

  const handleCloseLinkDialog = () => {
    setOpenLinkDialog(false);
    setSelectedCategoryId(null);
    setSelectedCategoryName(null);
    setSelectedCompanyId('');
  };

  const handleLinkCategory = async () => {
    if (!selectedCategoryId || !selectedCompanyId) {
      showSnackbar('Please select a company', 'error');
      return;
    }

    try {
      setLoading(true);
      await categoryApi.linkCategoryToCompany(selectedCompanyId, selectedCategoryId);
      showSnackbar('Category linked to company successfully', 'success');
      handleCloseLinkDialog();
      // Refresh the companies list for this category
      if (openCompaniesDialog) {
        handleViewCompanies(selectedCategoryId);
      }
    } catch (error) {
      console.error('Error linking category:', error);
      showSnackbar(`Failed to link category: ${error.response?.data?.detail || error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkCategory = async (companyId, companyName) => {
    if (!window.confirm(`Are you sure you want to unlink "${companyName}" from this category?`)) {
      return;
    }

    try {
      setLoadingCompanies(true);
      await categoryApi.unlinkCategoryFromCompany(companyId, selectedCategoryId);
      showSnackbar('Category unlinked from company successfully', 'success');
      // Refresh the companies list
      handleViewCompanies(selectedCategoryId);
    } catch (error) {
      console.error('Error unlinking category:', error);
      showSnackbar(`Failed to unlink category: ${error.response?.data?.detail || error.message}`, 'error');
    } finally {
      setLoadingCompanies(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Category Management
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add New Category
          </Button>
        </Box>

        {loading && categories.length === 0 ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : categories.length > 0 ? (
          <Grid container spacing={3}>
            {categories.map((category, index) => {
              // Color schemes for different categories
              const colorSchemes = [
                { gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)', button: '#ff6b6b' },
                { gradient: 'linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)', button: '#6c5ce7' },
                { gradient: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)', button: '#0984e3' },
                { gradient: 'linear-gradient(135deg, #55efc4 0%, #00b894 100%)', button: '#00b894' },
                { gradient: 'linear-gradient(135deg, #fdcb6e 0%, #e17055 100%)', button: '#e17055' },
                { gradient: 'linear-gradient(135deg, #fd79a8 0%, #e84393 100%)', button: '#e84393' },
              ];
              const colors = colorSchemes[index % colorSchemes.length];
              
              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={category.id || category.category_id}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 2,
                      boxShadow: 3,
                      overflow: 'hidden'
                    }}
                  >
                    {/* Colored Header Section */}
                    <Box 
                      sx={{ 
                        background: colors.gradient,
                        height: '120px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative'
                      }}
                    >
                      <CategoryIcon sx={{ fontSize: 48, color: 'white' }} />
                      {category.order !== undefined && (
                        <Chip 
                          label={category.order || 0}
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            backgroundColor: 'rgba(255, 255, 255, 0.3)',
                            color: 'white',
                            fontWeight: 600
                          }}
                        />
                      )}
                    </Box>
                    
                    {/* White Body Section */}
                    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <Typography 
                        variant="h6" 
                        component="h2" 
                        fontWeight={700}
                        sx={{ mb: 1.5 }}
                      >
                        {category.name}
                      </Typography>
                      
                      {category.description && (
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            flexGrow: 1,
                            mb: 2,
                            lineHeight: 1.6
                          }}
                        >
                          {category.description}
                        </Typography>
                      )}
                      
                      {category.activity && (
                        <Box sx={{ mb: 2 }}>
                          <Chip 
                            label={category.activity.charAt(0).toUpperCase() + category.activity.slice(1)} 
                            size="small"
                            color={
                              category.activity === 'water' ? 'primary' :
                              category.activity === 'land' ? 'success' :
                              'secondary'
                            }
                            sx={{ fontWeight: 600 }}
                          />
                        </Box>
                      )}
                      
                      {/* Action Buttons */}
                      <Box display="flex" gap={1} flexWrap="wrap">
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleViewCompanies(category.id || category.category_id)}
                          sx={{
                            background: colors.button,
                            flex: 1,
                            minWidth: '120px',
                            '&:hover': {
                              background: colors.button,
                              opacity: 0.9
                            }
                          }}
                        >
                          View Companies
                        </Button>
                        <IconButton 
                          onClick={() => handleOpenLinkDialog(category.id || category.category_id)} 
                          color="secondary"
                          size="small"
                          title="Link category to company"
                        >
                          <LinkIcon />
                        </IconButton>
                        <IconButton 
                          onClick={() => handleOpenDialog(category)} 
                          color="primary"
                          size="small"
                          title="Edit category"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          onClick={() => handleDelete(category.id || category.category_id)} 
                          color="error"
                          size="small"
                          title="Delete category"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No categories found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Click "Add New Category" to get started.
            </Typography>
          </Paper>
        )}
      </Box>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                label="Name"
                name="name"
                value={formData.name}
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
                multiline
                rows={3}
                margin="normal"
              />
              <TextField
                label="Order"
                name="order"
                type="number"
                value={formData.order}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                inputProps={{ min: 0 }}
              />
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Activity</InputLabel>
                <Select
                  name="activity"
                  value={formData.activity}
                  label="Activity"
                  onChange={handleInputChange}
                >
                  <MenuItem value="water">Water</MenuItem>
                  <MenuItem value="land">Land</MenuItem>
                </Select>
              </FormControl>
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

      {/* Companies by Category Dialog */}
      <Dialog 
        open={openCompaniesDialog} 
        onClose={handleCloseCompaniesDialog} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" component="div">
            Companies Connected to Category
          </Typography>
          {selectedCategoryName && (
            <Typography variant="subtitle1" color="primary" sx={{ mt: 1, fontWeight: 600 }}>
              "{selectedCategoryName}"
            </Typography>
          )}
          {selectedCategoryId && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Category ID: {selectedCategoryId} • {companies.length} {companies.length === 1 ? 'company' : 'companies'} found
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {loadingCompanies ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : companies.length > 0 ? (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                These are the companies that are connected/linked to this category:
              </Typography>
              <Grid container spacing={2}>
                {companies.map((company) => (
                  <Grid item xs={12} sm={6} key={company.id || company.company_id}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {company.name}
                        </Typography>
                        {company.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1 }}>
                            {company.description}
                          </Typography>
                        )}
                        <Box sx={{ mt: 1 }}>
                          {company.email && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              <strong>Email:</strong> {company.email}
                            </Typography>
                          )}
                          {company.phone && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              <strong>Phone:</strong> {company.phone}
                            </Typography>
                          )}
                          {company.address && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              <strong>Address:</strong> {company.address}
                            </Typography>
                          )}
                          <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                            {(company.is_active !== undefined) && (
                              <Chip 
                                label={company.is_active ? 'Active' : 'Inactive'} 
                                color={company.is_active ? 'success' : 'default'}
                                size="small"
                              />
                            )}
                            <Button
                              size="small"
                              color="error"
                              variant="outlined"
                              onClick={() => handleUnlinkCategory(company.id || company.company_id, company.name)}
                              sx={{ fontSize: '0.7rem' }}
                            >
                              Unlink
                            </Button>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                No companies are currently connected to this category.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Use the company management page to link companies to this category.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCompaniesDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Link Category Dialog */}
      <Dialog open={openLinkDialog} onClose={handleCloseLinkDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Link Category to Company</DialogTitle>
        <DialogContent>
          {selectedCategoryName && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Linking category: <strong>{selectedCategoryName}</strong>
            </Typography>
          )}
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Select Company</InputLabel>
            <Select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              label="Select Company"
              disabled={loadingAllCompanies}
            >
              {allCompanies.map((company) => (
                <MenuItem key={company.id} value={company.id}>
                  {company.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {loadingAllCompanies && (
            <Box display="flex" justifyContent="center" sx={{ mt: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseLinkDialog}>Cancel</Button>
          <Button
            onClick={handleLinkCategory}
            variant="contained"
            disabled={!selectedCompanyId || loading}
          >
            {loading ? 'Linking...' : 'Link Category'}
          </Button>
        </DialogActions>
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

export default Categories;
