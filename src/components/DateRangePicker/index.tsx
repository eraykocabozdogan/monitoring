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

  // GÜNCELLEME: MUI teması, uygulamanın yeni koyu temasıyla eşleşecek şekilde tamamen yeniden yapılandırıldı.
  const muiTheme = createTheme({
    palette: {
      mode: theme,
      ...(theme === 'dark' && {
        primary: {
          main: '#FFC107', // Marka rengimiz (sarı)
        },
        background: {
          paper: '#1E1E1E', // Bileşen arka planı
        },
        text: {
          primary: '#E0E0E0',
          secondary: '#B3B3B3',
        },
      }),
    },
    components: {
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    ...(theme === 'dark' && {
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#333333',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#444444',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#FFC107',
                        },
                        backgroundColor: '#2A2A2A', // Input arka planı
                    })
                }
            }
        },
        MuiSvgIcon: {
            styleOverrides: {
                root: {
                    ...(theme === 'dark' && {
                        color: '#B3B3B3',
                    })
                }
            }
        }
    }
  });

  return (
    <ThemeProvider theme={muiTheme}>
      <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          p: 2.5, // Padding 20px'e denk gelecek şekilde ayarlandı
          bgcolor: 'background.paper',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-main)'
        }}>
        <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 'bold', textAlign: 'center', mb: 1 }}>
          Select Date Range
        </Typography>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
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