import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
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
  MenuItem,
  IconButton,
  InputAdornment,
  Stack,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Category as CategoryIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon,
  Search as SearchIcon,
  Business as BusinessIcon,
  Waves as WaterIcon,
  Terrain as LandIcon,
  Inventory2 as EmptyIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Place as PlaceIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import { categoryApi, companyApi } from '../services/api';

const ACTIVITY_OPTIONS = [
  { value: 'water', label: 'Water', color: '#0EA5E9', Icon: WaterIcon },
  { value: 'land', label: 'Land', color: '#16A34A', Icon: LandIcon },
];

const activityMeta = (value) =>
  ACTIVITY_OPTIONS.find((o) => o.value === value) || { label: value, color: '#64748B', Icon: CategoryIcon };

const Categories = () => {
  const theme = useTheme();

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
  const [search, setSearch] = useState('');
  const [activityFilter, setActivityFilter] = useState('all');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchCategories();
    fetchAllCompanies();
  }, []);

  const fetchAllCompanies = async () => {
    try {
      setLoadingAllCompanies(true);
      const response = await companyApi.getAll();
      const list = Array.isArray(response) ? response : response?.data || [];
      setAllCompanies(list);
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
      setCategories(Array.isArray(response) ? response : response?.data || []);
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
        activity: category.activity || '',
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
    setFormData((prev) => ({ ...prev, [name]: name === 'order' ? parseInt(value) || 0 : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingCategory) {
        await categoryApi.update({ ...formData, category_id: editingCategory.id || editingCategory.category_id });
        showSnackbar('Category updated', 'success');
      } else {
        await categoryApi.create(formData);
        showSnackbar('Category created', 'success');
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
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      setLoading(true);
      await categoryApi.delete(id);
      showSnackbar('Category deleted', 'success');
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      showSnackbar('Failed to delete category', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleViewCompanies = async (categoryId) => {
    try {
      setLoadingCompanies(true);
      setSelectedCategoryId(categoryId);
      const category = categories.find((c) => (c.id || c.category_id) === categoryId);
      setSelectedCategoryName(category?.name || 'Unknown Category');

      const response = await categoryApi.getCompanyFeedByCategory(categoryId);
      const companiesData = Array.isArray(response) ? response : response?.data || [];
      setCompanies(companiesData);
      setOpenCompaniesDialog(true);
    } catch (error) {
      console.error('Error fetching companies:', error);
      showSnackbar('Failed to load companies for this category', 'error');
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

  const showSnackbar = (message, severity = 'success') => setSnackbar({ open: true, message, severity });
  const handleCloseSnackbar = () => setSnackbar((p) => ({ ...p, open: false }));

  const handleOpenLinkDialog = (categoryId) => {
    setSelectedCategoryId(categoryId);
    const category = categories.find((c) => (c.id || c.category_id) === categoryId);
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
      showSnackbar('Category linked to company', 'success');
      handleCloseLinkDialog();
      if (openCompaniesDialog) handleViewCompanies(selectedCategoryId);
    } catch (error) {
      console.error('Error linking category:', error);
      showSnackbar(`Failed to link: ${error.response?.data?.detail || error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkCategory = async (companyId, companyName) => {
    if (!window.confirm(`Unlink "${companyName}" from this category?`)) return;
    try {
      setLoadingCompanies(true);
      await categoryApi.unlinkCategoryFromCompany(companyId, selectedCategoryId);
      showSnackbar('Company unlinked', 'success');
      handleViewCompanies(selectedCategoryId);
    } catch (error) {
      console.error('Error unlinking category:', error);
      showSnackbar(`Failed to unlink: ${error.response?.data?.detail || error.message}`, 'error');
    } finally {
      setLoadingCompanies(false);
    }
  };

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    return categories
      .filter((c) => {
        if (activityFilter !== 'all' && c.activity !== activityFilter) return false;
        if (!q) return true;
        return (
          (c.name || '').toLowerCase().includes(q) ||
          (c.description || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [categories, search, activityFilter]);

  const counts = useMemo(() => {
    const water = categories.filter((c) => c.activity === 'water').length;
    const land = categories.filter((c) => c.activity === 'land').length;
    return { total: categories.length, water, land };
  }, [categories]);

  return (
    <Box>
      <PageHeader
        title="Categories"
        subtitle="Group activities into navigable categories for the catalog"
        icon={<CategoryIcon />}
        breadcrumbs={[{ label: 'Catalog' }, { label: 'Categories' }]}
        actions={
          <>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchCategories}>
              Refresh
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
              New category
            </Button>
          </>
        }
      />

      {/* Filter bar */}
      <Card sx={{ mb: 2.5 }}>
        <CardContent sx={{ py: 2 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', md: 'center' }}
            justifyContent="space-between"
          >
            <TextField
              placeholder="Search categories…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ width: { xs: '100%', md: 360 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearch('')}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />

            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              <ToggleButtonGroup
                value={activityFilter}
                exclusive
                onChange={(_, v) => v && setActivityFilter(v)}
                size="small"
              >
                <ToggleButton value="all" sx={{ px: 2, fontWeight: 600 }}>
                  All ({counts.total})
                </ToggleButton>
                <ToggleButton value="water" sx={{ px: 2, fontWeight: 600 }}>
                  <WaterIcon sx={{ fontSize: 16, mr: 0.75 }} />
                  Water ({counts.water})
                </ToggleButton>
                <ToggleButton value="land" sx={{ px: 2, fontWeight: 600 }}>
                  <LandIcon sx={{ fontSize: 16, mr: 0.75 }} />
                  Land ({counts.land})
                </ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Content */}
      {loading && categories.length === 0 ? (
        <Box display="flex" justifyContent="center" my={6}>
          <CircularProgress />
        </Box>
      ) : filteredCategories.length > 0 ? (
        <Box
          sx={{
            display: 'grid',
            gap: 2.5,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)',
            },
          }}
        >
          {filteredCategories.map((category) => {
            const meta = activityMeta(category.activity);
            const Icon = meta.Icon;
            const id = category.id || category.category_id;

            return (
              <Box key={id}>
                <Card
                  sx={{
                    width: '100%',
                    height: 296,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    transition: 'all .18s ease',
                    '&:hover': {
                      borderColor: alpha(meta.color, 0.6),
                      boxShadow: `0 12px 32px ${alpha(meta.color, 0.18)}`,
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  {/* Accent header */}
                  <Box
                    sx={{
                      position: 'relative',
                      height: 96,
                      px: 2.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      background: `linear-gradient(135deg, ${meta.color} 0%, ${alpha(meta.color, 0.75)} 100%)`,
                      color: '#fff',
                    }}
                  >
                    <Box
                      sx={{
                        width: 48, height: 48,
                        borderRadius: 2,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: alpha('#fff', 0.22),
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      <Icon sx={{ fontSize: 26 }} />
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        sx={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.85 }}
                      >
                        {meta.label} activity
                      </Typography>
                      <Typography variant="h6" sx={{ color: '#fff', lineHeight: 1.2 }} noWrap>
                        {category.name}
                      </Typography>
                    </Box>
                    {typeof category.order === 'number' && (
                      <Tooltip title="Display order">
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 10, right: 12,
                            px: 1, py: 0.25,
                            borderRadius: 999,
                            bgcolor: alpha('#fff', 0.22),
                            fontSize: '0.7rem',
                            fontWeight: 700,
                          }}
                        >
                          #{category.order}
                        </Box>
                      </Tooltip>
                    )}
                  </Box>

                  {/* Body */}
                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        minHeight: 63,
                      }}
                    >
                      {category.description || 'No description provided'}
                    </Typography>

                    <Box sx={{ flexGrow: 1 }} />
                    <Divider sx={{ mb: 1.5 }} />

                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                      <Button
                        size="small"
                        startIcon={<BusinessIcon sx={{ fontSize: 16 }} />}
                        onClick={() => handleViewCompanies(id)}
                        sx={{
                          flex: 1,
                          justifyContent: 'flex-start',
                          color: meta.color,
                          fontWeight: 600,
                          '&:hover': { bgcolor: alpha(meta.color, 0.08) },
                        }}
                      >
                        Companies
                      </Button>
                      <Tooltip title="Link to company">
                        <IconButton size="small" onClick={() => handleOpenLinkDialog(id)}>
                          <LinkIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleOpenDialog(category)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => handleDelete(id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </CardContent>
                </Card>
              </Box>
            );
          })}
        </Box>
      ) : (
        <Card>
          <CardContent sx={{ py: 6, textAlign: 'center' }}>
            <Box
              sx={{
                width: 64, height: 64, mx: 'auto', mb: 2,
                borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                color: 'primary.main',
              }}
            >
              <EmptyIcon sx={{ fontSize: 32 }} />
            </Box>
            <Typography variant="h6">
              {categories.length === 0 ? 'No categories yet' : 'No categories match your filter'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2.5 }}>
              {categories.length === 0
                ? 'Create your first category to start organizing the catalog.'
                : 'Try clearing the search or selecting a different activity.'}
            </Typography>
            {categories.length === 0 ? (
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
                Create a category
              </Button>
            ) : (
              <Button variant="outlined" onClick={() => { setSearch(''); setActivityFilter('all'); }}>
                Clear filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ pb: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  width: 36, height: 36, borderRadius: 1.5,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  bgcolor: 'primary.main', color: 'primary.contrastText',
                }}
              >
                <CategoryIcon sx={{ fontSize: 20 }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ lineHeight: 1.1 }}>
                  {editingCategory ? 'Edit category' : 'New category'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {editingCategory ? 'Update category details' : 'Fill in the details below'}
                </Typography>
              </Box>
            </Stack>
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ mt: 0.5 }}>
              <TextField
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                fullWidth
                required
                autoFocus
              />
              <TextField
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={3}
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl fullWidth required>
                  <InputLabel>Activity</InputLabel>
                  <Select
                    name="activity"
                    value={formData.activity}
                    label="Activity"
                    onChange={handleInputChange}
                  >
                    {ACTIVITY_OPTIONS.map((opt) => {
                      const OptIcon = opt.Icon;
                      return (
                        <MenuItem key={opt.value} value={opt.value}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <OptIcon sx={{ fontSize: 18, color: opt.color }} />
                            <span>{opt.label}</span>
                          </Stack>
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
                <TextField
                  label="Display order"
                  name="order"
                  type="number"
                  value={formData.order}
                  onChange={handleInputChange}
                  fullWidth
                  inputProps={{ min: 0 }}
                  helperText="Lower numbers appear first"
                />
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Saving…' : editingCategory ? 'Save changes' : 'Create category'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Companies Dialog */}
      <Dialog open={openCompaniesDialog} onClose={handleCloseCompaniesDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="overline" color="text.secondary">Companies in</Typography>
              <Typography variant="h6" sx={{ lineHeight: 1.2 }}>{selectedCategoryName}</Typography>
              <Typography variant="caption" color="text.secondary">
                {companies.length} {companies.length === 1 ? 'company' : 'companies'} linked
              </Typography>
            </Box>
            <Button
              size="small"
              startIcon={<LinkIcon />}
              variant="outlined"
              onClick={() => {
                setOpenLinkDialog(true);
                setSelectedCompanyId('');
              }}
            >
              Link a company
            </Button>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {loadingCompanies ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : companies.length > 0 ? (
            <Grid container spacing={2}>
              {companies.map((company) => (
                <Grid item xs={12} sm={6} key={company.id || company.company_id}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Box
                            sx={{
                              width: 34, height: 34, borderRadius: 1.5,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: 'primary.main',
                            }}
                          >
                            <BusinessIcon sx={{ fontSize: 18 }} />
                          </Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            {company.name}
                          </Typography>
                        </Stack>
                        {company.is_active !== undefined && (
                          <Chip
                            label={company.is_active ? 'Active' : 'Inactive'}
                            size="small"
                            color={company.is_active ? 'success' : 'default'}
                          />
                        )}
                      </Stack>

                      {company.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                          {company.description}
                        </Typography>
                      )}

                      <Stack spacing={0.5} sx={{ mb: 1.5 }}>
                        {company.email && (
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <EmailIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">{company.email}</Typography>
                          </Stack>
                        )}
                        {company.phone && (
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <PhoneIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">{company.phone}</Typography>
                          </Stack>
                        )}
                        {company.address && (
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <PlaceIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">{company.address}</Typography>
                          </Stack>
                        )}
                      </Stack>

                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        startIcon={<LinkOffIcon sx={{ fontSize: 16 }} />}
                        onClick={() => handleUnlinkCategory(company.id || company.company_id, company.name)}
                      >
                        Unlink
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <BusinessIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body1">No companies linked yet</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Use "Link a company" above to connect one.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseCompaniesDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Link Category Dialog */}
      <Dialog open={openLinkDialog} onClose={handleCloseLinkDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6">Link category to a company</Typography>
          {selectedCategoryName && (
            <Typography variant="caption" color="text.secondary">
              Category: <strong>{selectedCategoryName}</strong>
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          <FormControl fullWidth sx={{ mt: 0.5 }}>
            <InputLabel>Select a company</InputLabel>
            <Select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              label="Select a company"
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
              <CircularProgress size={20} />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseLinkDialog}>Cancel</Button>
          <Button onClick={handleLinkCategory} variant="contained" disabled={!selectedCompanyId || loading}>
            {loading ? 'Linking…' : 'Link company'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Categories;
