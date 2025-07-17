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

  const muiTheme = createTheme({
    palette: {
      mode: theme,
      ...(theme === 'dark' && {
        background: {
          paper: '#1f2937',
        },
      }),
    },
  });

  return (
    <ThemeProvider theme={muiTheme}>
      <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          p: 2,
          bgcolor: 'background.paper',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-main)'
        }}>
        <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
          Select Date Range
        </Typography>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={handleStartDateChange}
            disabled={!startDate}
            slotProps={{
              textField: {
                sx: {
                  '.MuiOutlinedInput-root': {
                    backgroundColor: 'var(--color-background-hover)',
                  },
                },
              },
            }}
          />
          <DatePicker
            label="End Date"
            value={endDate}
            onChange={handleEndDateChange}
            disabled={!endDate}
            slotProps={{
              textField: {
                sx: {
                  '.MuiOutlinedInput-root': {
                    backgroundColor: 'var(--color-background-hover)',
                  },
                },
              },
            }}
          />
        </LocalizationProvider>
      </Box>
    </ThemeProvider>
  );
};

export default memo(DateRangePicker);