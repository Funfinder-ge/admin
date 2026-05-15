import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Divider,
  DialogContentText,
  Grid,
  Stack,
  Tooltip,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Business as CompanyIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Place as PlaceIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Verified as VerifiedIcon,
  Inventory2 as EmptyIcon,
  Badge as BadgeIcon,
  AccessTime as ExpiresIcon,
} from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import { companyApi } from '../services/api';

const Companies = () => {
  const theme = useTheme();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [deleteCompanyId, setDeleteCompanyId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    founded_year: new Date().getFullYear(),
    is_verified: false,
    is_active: true,
    email: '',
    phone: '',
    ceo: '',
    expires_at: '',
    identity_number: '',
    address: '',
    company_id: 0,
    user_id: 0,
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await companyApi.getAll();
      let companiesList = [];
      if (Array.isArray(response)) companiesList = response;
      else if (response?.data && Array.isArray(response.data)) companiesList = response.data;
      else if (response?.results && Array.isArray(response.results)) companiesList = response.results;
      setCompanies(companiesList);
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError('Failed to load companies. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (company = null) => {
    if (company) {
      setEditingCompany(company);
      let formattedDate = '';
      if (company.expires_at) {
        const date = new Date(company.expires_at);
        if (!isNaN(date.getTime())) formattedDate = date.toISOString().split('T')[0];
      }
      setFormData({
        name: company.name || '',
        description: company.description || '',
        founded_year: company.founded_year || new Date().getFullYear(),
        is_verified: company.is_verified || false,
        is_active: company.is_active !== undefined ? company.is_active : true,
        email: company.email || '',
        phone: company.phone || '',
        ceo: company.ceo || '',
        expires_at: formattedDate,
        identity_number: company.identity_number || '',
        address: company.address || '',
        company_id: company.company_id || company.id || null,
        user_id: company.user_id || null,
      });
    } else {
      setEditingCompany(null);
      const def = new Date();
      def.setFullYear(def.getFullYear() + 1);
      setFormData({
        name: '', description: '',
        founded_year: new Date().getFullYear(),
        is_verified: false, is_active: true,
        email: '', phone: '', ceo: '',
        expires_at: def.toISOString().split('T')[0],
        identity_number: '', address: '',
        company_id: null, user_id: null,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCompany(null);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      const submitData = { ...formData };
      if (editingCompany) {
        await companyApi.update(editingCompany.id, submitData);
        setCompanies(companies.map((c) => (c.id === editingCompany.id ? { ...c, ...submitData } : c)));
      } else {
        const response = await companyApi.create(submitData);
        setCompanies([...companies, response.data || response]);
      }
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving company:', err);
      setError(`Failed to ${editingCompany ? 'update' : 'create'} company: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleDeleteClick = (companyId) => {
    setDeleteCompanyId(companyId);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await companyApi.delete(deleteCompanyId);
      setCompanies(companies.filter((c) => c.id !== deleteCompanyId));
      setOpenDeleteDialog(false);
      setDeleteCompanyId(null);
    } catch (err) {
      console.error('Error deleting company:', err);
      setError(`Failed to delete company: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleDeleteCancel = () => {
    setOpenDeleteDialog(false);
    setDeleteCompanyId(null);
  };

  const filteredCompanies = useMemo(() => {
    const q = search.trim().toLowerCase();
    return companies.filter((c) => {
      if (statusFilter === 'active' && !c.is_active) return false;
      if (statusFilter === 'inactive' && c.is_active) return false;
      if (statusFilter === 'verified' && !c.is_verified) return false;
      if (!q) return true;
      return (
        (c.name || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.ceo || '').toLowerCase().includes(q) ||
        (c.identity_number || '').toLowerCase().includes(q)
      );
    });
  }, [companies, search, statusFilter]);

  const counts = useMemo(
    () => ({
      total: companies.length,
      active: companies.filter((c) => c.is_active).length,
      inactive: companies.filter((c) => !c.is_active).length,
      verified: companies.filter((c) => c.is_verified).length,
    }),
    [companies]
  );

  const initials = (name) =>
    (name || '?')
      .split(' ')
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();

  const companyAccent = (name) => {
    const palette = ['#87003A', '#0EA5E9', '#16A34A', '#F59E0B', '#6366F1', '#EC4899'];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    return palette[hash % palette.length];
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Companies"
        subtitle="Partner organizations registered on the platform"
        icon={<CompanyIcon />}
        breadcrumbs={[{ label: 'Partners & People' }, { label: 'Companies' }]}
        actions={
          <>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchCompanies}>
              Refresh
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
              New company
            </Button>
          </>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2.5 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

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
              placeholder="Search by name, CEO, email…"
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

            <ToggleButtonGroup
              value={statusFilter}
              exclusive
              onChange={(_, v) => v && setStatusFilter(v)}
              size="small"
            >
              <ToggleButton value="all" sx={{ px: 2, fontWeight: 600 }}>
                All ({counts.total})
              </ToggleButton>
              <ToggleButton value="active" sx={{ px: 2, fontWeight: 600 }}>
                Active ({counts.active})
              </ToggleButton>
              <ToggleButton value="inactive" sx={{ px: 2, fontWeight: 600 }}>
                Inactive ({counts.inactive})
              </ToggleButton>
              <ToggleButton value="verified" sx={{ px: 2, fontWeight: 600 }}>
                <VerifiedIcon sx={{ fontSize: 16, mr: 0.75 }} />
                Verified ({counts.verified})
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </CardContent>
      </Card>

      {/* Content */}
      {filteredCompanies.length > 0 ? (
        <Box
          sx={{
            display: 'grid',
            gap: 2.5,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
              xl: 'repeat(4, 1fr)',
            },
          }}
        >
          {filteredCompanies.map((company) => {
            const accent = companyAccent(company.name);
            return (
              <Box key={company.id}>
                <Card
                  sx={{
                    width: '100%',
                    height: 360,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    transition: 'all .18s ease',
                    '&:hover': {
                      borderColor: alpha(accent, 0.6),
                      boxShadow: `0 12px 32px ${alpha(accent, 0.18)}`,
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  {/* Accent header */}
                  <Box
                    sx={{
                      position: 'relative',
                      height: 96,
                      px: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      background: `linear-gradient(135deg, ${accent} 0%, ${alpha(accent, 0.7)} 100%)`,
                      color: '#fff',
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 52, height: 52,
                        bgcolor: alpha('#fff', 0.22),
                        backdropFilter: 'blur(8px)',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '1rem',
                      }}
                    >
                      {initials(company.name)}
                    </Avatar>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        sx={{
                          fontSize: '0.65rem', fontWeight: 700,
                          letterSpacing: '0.12em', textTransform: 'uppercase',
                          opacity: 0.85,
                        }}
                      >
                        ID #{company.id}
                      </Typography>
                      <Typography variant="h6" sx={{ color: '#fff', lineHeight: 1.2 }} noWrap>
                        {company.name}
                      </Typography>
                    </Box>
                    <Stack direction="column" spacing={0.5} alignItems="flex-end">
                      <Chip
                        label={company.is_active ? 'Active' : 'Inactive'}
                        size="small"
                        sx={{
                          height: 22, fontSize: '0.7rem', fontWeight: 700,
                          bgcolor: company.is_active ? alpha('#16A34A', 0.95) : alpha('#fff', 0.25),
                          color: '#fff',
                        }}
                      />
                      {company.is_verified && (
                        <Chip
                          icon={<VerifiedIcon sx={{ fontSize: 14, color: '#fff !important' }} />}
                          label="Verified"
                          size="small"
                          sx={{
                            height: 22, fontSize: '0.7rem', fontWeight: 700,
                            bgcolor: alpha('#fff', 0.22),
                            color: '#fff',
                            '& .MuiChip-icon': { ml: 0.5 },
                          }}
                        />
                      )}
                    </Stack>
                  </Box>

                  {/* Body */}
                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        minHeight: 42,
                      }}
                    >
                      {company.description || 'No description provided'}
                    </Typography>

                    <Stack spacing={0.65} sx={{ mb: 1.5 }}>
                      <DetailRow icon={<PersonIcon sx={{ fontSize: 14 }} />} value={company.ceo} placeholder="—" />
                      <DetailRow icon={<EmailIcon sx={{ fontSize: 14 }} />} value={company.email} placeholder="—" />
                      <DetailRow icon={<PhoneIcon sx={{ fontSize: 14 }} />} value={company.phone} placeholder="—" />
                      <DetailRow
                        icon={<ExpiresIcon sx={{ fontSize: 14 }} />}
                        value={
                          company.expires_at
                            ? `Expires ${new Date(company.expires_at).toLocaleDateString()}`
                            : null
                        }
                        placeholder="No expiration"
                      />
                    </Stack>

                    <Box sx={{ flexGrow: 1 }} />
                    <Divider sx={{ mb: 1.25 }} />
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">
                        {company.founded_year ? `Since ${company.founded_year}` : 'Founded —'}
                      </Typography>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleOpenDialog(company)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => handleDeleteClick(company.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
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
              {companies.length === 0 ? 'No companies yet' : 'No companies match your filter'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2.5 }}>
              {companies.length === 0
                ? 'Add your first partner company to get started.'
                : 'Try clearing the search or selecting a different status.'}
            </Typography>
            {companies.length === 0 ? (
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
                Add a company
              </Button>
            ) : (
              <Button variant="outlined" onClick={() => { setSearch(''); setStatusFilter('all'); }}>
                Clear filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 36, height: 36, borderRadius: 1.5,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: 'primary.main', color: 'primary.contrastText',
              }}
            >
              <CompanyIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ lineHeight: 1.1 }}>
                {editingCompany ? 'Edit company' : 'New company'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {editingCompany ? 'Update company details' : 'Add a new partner organization'}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.25 }}>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Company name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Founded year"
                type="number"
                value={formData.founded_year}
                onChange={(e) => handleInputChange('founded_year', parseInt(e.target.value) || '')}
                required
                inputProps={{ min: 1800, max: new Date().getFullYear() }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="CEO"
                value={formData.ceo}
                onChange={(e) => handleInputChange('ceo', e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon fontSize="small" /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Identity number"
                value={formData.identity_number}
                onChange={(e) => handleInputChange('identity_number', e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><BadgeIcon fontSize="small" /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon fontSize="small" /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon fontSize="small" /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><PlaceIcon fontSize="small" /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Expires at"
                type="date"
                value={formData.expires_at}
                onChange={(e) => handleInputChange('expires_at', e.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText="Defaults to 1 year"
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.is_active}
                  label="Status"
                  onChange={(e) => handleInputChange('is_active', e.target.value)}
                >
                  <MenuItem value={true}>Active</MenuItem>
                  <MenuItem value={false}>Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Verification</InputLabel>
                <Select
                  value={formData.is_verified}
                  label="Verification"
                  onChange={(e) => handleInputChange('is_verified', e.target.value)}
                >
                  <MenuItem value={true}>Verified</MenuItem>
                  <MenuItem value={false}>Not verified</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingCompany ? 'Save changes' : 'Create company'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={openDeleteDialog} onClose={handleDeleteCancel} maxWidth="xs" fullWidth>
        <DialogTitle>Delete company?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This action cannot be undone and will affect all associated staff members.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const DetailRow = ({ icon, value, placeholder }) => (
  <Stack direction="row" alignItems="center" spacing={1} sx={{ color: 'text.secondary' }}>
    <Box sx={{ display: 'flex', color: value ? 'text.secondary' : 'text.disabled' }}>{icon}</Box>
    <Typography
      variant="body2"
      sx={{
        color: value ? 'text.primary' : 'text.disabled',
        fontWeight: value ? 500 : 400,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        minWidth: 0,
        flex: 1,
      }}
    >
      {value || placeholder}
    </Typography>
  </Stack>
);

export default Companies;
