import type { ChangeEvent } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { parseCsvFile } from '../../utils/csvParser';

const CsvUploader = () => {
  const setEvents = useAppStore((state) => state.setEvents);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) {
      return;
    }

    try {
      const parsedData = await parseCsvFile(file);
      setEvents(parsedData);
    } catch (error) {
      console.error('Error parsing CSV file:', error);
      // You might want to add error handling UI here
    }
  };

  return (
    <div style={{ margin: '20px 0' }}>
      <label htmlFor="csv-upload" style={{ 
        display: 'block', 
        marginBottom: '10px',
        fontWeight: 'bold'
      }}>
        CSV Dosyası Yükle:
      </label>
      <input
        id="csv-upload"
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        style={{
          padding: '10px',
          border: '2px dashed #ccc',
          borderRadius: '5px',
          backgroundColor: '#f9f9f9',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      />
    </div>
  );
};

export default CsvUploader;
