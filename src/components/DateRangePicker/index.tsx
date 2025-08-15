// Kopyalamaya buradan başlayın
import React, { memo } from 'react';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useAppStore } from '../../store/useAppStore.js';
import { Box, Typography, createTheme, ThemeProvider } from '@mui/material';

const DateRangePicker: React.FC = () => {
  const { dateRange, setDateRange, theme } = useAppStore();

  const startDate = dateRange?.start ?? null;
  const endDate = dateRange?.end ?? null;

  const handleStartDateChange = (newDate: Date | null) => {
    if (newDate && endDate) {
      setDateRange({ start: newDate, end: endDate });
    }
  };

  const handleEndDateChange = (newDate: Date | null) => {
    if (newDate && startDate) {
      setDateRange({ start: startDate, end: newDate });
    }
  };

  // Tüm stil mantığını burada birleştiriyoruz
  const muiTheme = createTheme({
    palette: {
      mode: theme,
      ...(theme === 'dark' ? {
        primary: { main: '#3b82f6' },
        background: { paper: 'var(--color-background-secondary)' },
        text: { 
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)' 
        },
      } : {
        primary: { main: '#3b82f6' },
        background: { paper: 'var(--color-background-secondary)' },
      }),
    },
    components: {
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: 'var(--color-background-main)',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'var(--color-border)',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'var(--color-brand)',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: 'var(--color-brand)',
            },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: 'var(--color-text-secondary)',
            '&.Mui-focused': {
              color: 'var(--color-brand)',
            },
          },
        },
      },
      MuiSvgIcon: {
        styleOverrides: {
          root: {
            color: 'var(--color-text-secondary)',
          },
        },
      },
    },
  });

  return (
    <ThemeProvider theme={muiTheme}>
      <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          p: 2.5,
          bgcolor: 'background.paper',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-main)'
        }}>
        <Typography variant="h6" component="h2" sx={{ color: 'text.primary', fontWeight: '600', textAlign: 'center', mb: 1, fontSize: '16px' }}>
          Select Date Range
        </Typography>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={undefined}>
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={handleStartDateChange}
            disabled={!startDate}
          />
          <DatePicker
            label="End Date"
            value={endDate}
            onChange={handleEndDateChange}
            disabled={!endDate}
          />
        </LocalizationProvider>
      </Box>
    </ThemeProvider>
  );
};

export default memo(DateRangePicker);