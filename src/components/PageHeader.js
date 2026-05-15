import React from 'react';
import { Box, Typography, Stack, Breadcrumbs, Link as MuiLink } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { ChevronRight as ChevronRightIcon } from '@mui/icons-material';

/**
 * Consistent page header used across admin pages.
 *
 *   <PageHeader
 *     title="Events"
 *     subtitle="Manage activity catalog and pricing"
 *     breadcrumbs={[{ label: 'Catalog' }, { label: 'Events' }]}
 *     actions={<Button>New Event</Button>}
 *   />
 */
const PageHeader = ({ title, subtitle, breadcrumbs = [], actions = null, icon = null }) => {
  return (
    <Box sx={{ mb: 3 }}>
      {breadcrumbs.length > 0 && (
        <Breadcrumbs
          separator={<ChevronRightIcon sx={{ fontSize: 14 }} />}
          sx={{
            mb: 1,
            '& .MuiBreadcrumbs-li': { fontSize: '0.78rem', color: 'text.secondary' },
          }}
        >
          {breadcrumbs.map((crumb, i) =>
            crumb.to ? (
              <MuiLink
                key={i}
                component={RouterLink}
                to={crumb.to}
                underline="hover"
                sx={{ fontSize: '0.78rem', color: 'text.secondary' }}
              >
                {crumb.label}
              </MuiLink>
            ) : (
              <Typography key={i} sx={{ fontSize: '0.78rem', color: i === breadcrumbs.length - 1 ? 'text.primary' : 'text.secondary', fontWeight: i === breadcrumbs.length - 1 ? 600 : 400 }}>
                {crumb.label}
              </Typography>
            )
          )}
        </Breadcrumbs>
      )}

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'flex-start', md: 'center' }}
        justifyContent="space-between"
        spacing={2}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          {icon && (
            <Box
              sx={{
                width: 44, height: 44,
                borderRadius: 2,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                boxShadow: '0 6px 16px rgba(135,0,58,0.25)',
              }}
            >
              {icon}
            </Box>
          )}
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h4" sx={{ lineHeight: 1.1 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
        {actions && (
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {actions}
          </Stack>
        )}
      </Stack>
    </Box>
  );
};

export default PageHeader;
