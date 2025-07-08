// src/components/DateRangePicker/index.tsx
import React from 'react';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useAppStore } from '../../store/useAppStore';
import { Box, Typography } from '@mui/material';

const DateRangePicker: React.FC = () => {
  const { dateRange, setDateRange } = useAppStore();

  // dateRange null ise, DatePicker'lar null değer almalı
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

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2, backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <Typography variant="subtitle1" sx={{ color: '#333', fontWeight: 'bold' }}>
          Select Date Range
        </Typography>
        <DatePicker
          label="Start Date"
          value={startDate}
          onChange={handleStartDateChange}
          disabled={!startDate} // Veri yokken devre dışı
        />
        <DatePicker
          label="End Date"
          value={endDate}
          onChange={handleEndDateChange}
          disabled={!endDate} // Veri yokken devre dışı
        />
      </Box>
    </LocalizationProvider>
  );
};

export default DateRangePicker;