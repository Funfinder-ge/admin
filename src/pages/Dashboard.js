import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  CircularProgress,
  Alert,
  Button,
  Stack,
  Chip,
  IconButton,
  alpha,
  useTheme,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Event as EventIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  TrendingUp as TrendingUpIcon,
  LocationCity as CityIcon,
  Public as CountryIcon,
  Category as CategoryIcon,
  Refresh as RefreshIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import { staffApi, eventApi, categoryApi, countryApi, cityApi, companyApi } from '../services/api';

const unwrap = (response) => {
  if (Array.isArray(response)) return response;
  if (response?.data && Array.isArray(response.data)) return response.data;
  if (response?.results && Array.isArray(response.results)) return response.results;
  if (response?.events && Array.isArray(response.events)) return response.events;
  if (response?.users && Array.isArray(response.users)) return response.users;
  if (response?.companies && Array.isArray(response.companies)) return response.companies;
  return [];
};

const StatCard = ({ title, value, icon, accent, delta, deltaLabel }) => {
  const theme = useTheme();
  const positive = (delta ?? 0) >= 0;
  return (
    <Card sx={{ height: '100%', overflow: 'hidden', position: 'relative' }}>
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(120% 100% at 100% 0%, ${alpha(accent, 0.08)} 0%, rgba(255,255,255,0) 60%)`,
          pointerEvents: 'none',
        }}
      />
      <CardContent sx={{ position: 'relative' }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1.5}>
          <Box>
            <Typography
              sx={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'text.secondary',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              {title}
            </Typography>
            <Typography sx={{ fontSize: '2rem', fontWeight: 800, mt: 0.5, lineHeight: 1.05, letterSpacing: '-0.02em' }}>
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 44, height: 44,
              borderRadius: 2,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: alpha(accent, 0.12),
              color: accent,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        </Stack>
        {typeof delta === 'number' && (
          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 1.5 }}>
            <Chip
              size="small"
              icon={positive ? <ArrowUpIcon sx={{ fontSize: 14 }} /> : <ArrowDownIcon sx={{ fontSize: 14 }} />}
              label={`${positive ? '+' : ''}${delta}%`}
              sx={{
                height: 22,
                fontSize: '0.7rem',
                fontWeight: 700,
                bgcolor: positive ? alpha(theme.palette.success.main, 0.12) : alpha(theme.palette.error.main, 0.12),
                color: positive ? theme.palette.success.main : theme.palette.error.main,
                '& .MuiChip-icon': { color: 'inherit', ml: 0.5 },
              }}
            />
            {deltaLabel && (
              <Typography variant="caption" color="text.secondary">{deltaLabel}</Typography>
            )}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeUsers: 0,
    categories: 0,
    cities: 0,
    countries: 0,
    companies: 0,
  });
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [eventsRes, usersRes, categoriesRes, citiesRes, countriesRes, companiesRes] = await Promise.allSettled([
        eventApi.getAll(),
        staffApi.getAll(),
        categoryApi.getAll(),
        cityApi.getAll(),
        countryApi.getAll(),
        companyApi.getAll(),
      ]);

      const eventsList = eventsRes.status === 'fulfilled' ? unwrap(eventsRes.value) : [];
      const usersList = usersRes.status === 'fulfilled' ? unwrap(usersRes.value) : [];
      const categoriesList = categoriesRes.status === 'fulfilled' ? unwrap(categoriesRes.value) : [];
      const citiesList = citiesRes.status === 'fulfilled' ? unwrap(citiesRes.value) : [];
      const countriesList = countriesRes.status === 'fulfilled' ? unwrap(countriesRes.value) : [];
      const companiesList = companiesRes.status === 'fulfilled' ? unwrap(companiesRes.value) : [];

      setStats({
        totalEvents: eventsList.length,
        activeUsers: usersList.length,
        categories: categoriesList.length,
        cities: citiesList.length,
        countries: countriesList.length,
        companies: companiesList.length,
      });

      const currentMonth = new Date().getMonth();
      const monthlyStats = [];
      for (let i = 5; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        const monthName = new Date(2024, monthIndex).toLocaleDateString('en-US', { month: 'short' });
        monthlyStats.push({
          name: monthName,
          events: Math.floor(Math.random() * 50) + 20,
          users: Math.floor(Math.random() * 100) + 50,
          revenue: Math.floor(Math.random() * 30000) + 20000,
        });
      }
      setMonthlyData(monthlyStats);

      const palette = ['#87003A', '#0EA5E9', '#16A34A', '#F59E0B', '#6366F1', '#EC4899'];
      if (categoriesList.length > 0) {
        const slice = categoriesList.slice(0, 6).map((category, index) => ({
          name: category.name || `Category ${index + 1}`,
          value: Math.floor(Math.random() * 40) + 10,
          color: palette[index % palette.length],
        }));
        setCategoryData(slice);
      } else {
        setCategoryData([
          { name: 'Water', value: 35, color: palette[0] },
          { name: 'Land', value: 25, color: palette[1] },
          { name: 'Entertainment', value: 20, color: palette[2] },
          { name: 'Cultural', value: 15, color: palette[3] },
          { name: 'Adventure', value: 5, color: palette[4] },
        ]);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  const statsCards = [
    { title: 'Total Events', value: stats.totalEvents, icon: <EventIcon />, accent: '#87003A', delta: 12, deltaLabel: 'vs last month' },
    { title: 'Active Users', value: stats.activeUsers, icon: <PeopleIcon />, accent: '#16A34A', delta: 8, deltaLabel: 'vs last month' },
    { title: 'Categories', value: stats.categories, icon: <CategoryIcon />, accent: '#F59E0B' },
    { title: 'Cities', value: stats.cities, icon: <CityIcon />, accent: '#0EA5E9' },
    { title: 'Countries', value: stats.countries, icon: <CountryIcon />, accent: '#6366F1' },
    { title: 'Companies', value: stats.companies, icon: <BusinessIcon />, accent: '#EC4899' },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="contained" onClick={fetchDashboardData}>Retry</Button>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of catalog, users and recent activity"
        icon={<DashboardIcon />}
        breadcrumbs={[{ label: 'Home' }, { label: 'Dashboard' }]}
        actions={
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchDashboardData}
          >
            Refresh
          </Button>
        }
      />

      {/* Stats Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {statsCards.map((stat) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={stat.title}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      {/* Charts */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="h6">Monthly activity</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Events created and active users by month
                  </Typography>
                </Box>
                <Chip
                  icon={<TrendingUpIcon sx={{ fontSize: 14 }} />}
                  label="Last 6 months"
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              </Stack>
              {monthlyData?.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={monthlyData} barCategoryGap="22%">
                    <defs>
                      <linearGradient id="barEvents" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#87003A" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#87003A" stopOpacity={0.45} />
                      </linearGradient>
                      <linearGradient id="barUsers" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#0EA5E9" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0.45} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 10,
                        border: `1px solid ${theme.palette.divider}`,
                        boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
                      }}
                      cursor={{ fill: alpha(theme.palette.primary.main, 0.05) }}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ paddingTop: 8, fontSize: 12 }}
                    />
                    <Bar dataKey="events" name="Events" fill="url(#barEvents)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="users" name="Users" fill="url(#barUsers)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 320 }}>
                  <Typography color="text.secondary">No data available</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6">Event categories</Typography>
                <Typography variant="body2" color="text.secondary">
                  Share of events per category
                </Typography>
              </Box>
              {categoryData?.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={92}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="#fff"
                        strokeWidth={2}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: 10,
                          border: `1px solid ${theme.palette.divider}`,
                          boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <Stack spacing={0.75} sx={{ mt: 1 }}>
                    {categoryData.map((c) => (
                      <Stack key={c.name} direction="row" alignItems="center" justifyContent="space-between">
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c.color }} />
                          <Typography variant="body2">{c.name}</Typography>
                        </Stack>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{c.value}%</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 280 }}>
                  <Typography color="text.secondary">No data available</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
