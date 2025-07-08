import type { ChangeEvent } from 'react';
import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { parseCsvFile } from '../../utils/csvParser';
import styles from './CsvUploader.module.css';

const CsvUploader = () => {
  const setEvents = useAppStore((state) => state.setEvents);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) {
      return;
    }

    setFileName(file.name);
    setError('');
    setIsLoading(true);

    try {
      const parsedData = await parseCsvFile(file);
      setEvents(parsedData);
    } catch (error) {
      console.error('Error parsing CSV file:', error);
      setError('Error parsing CSV file. Please check the file format.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadClick = () => {
    const input = document.getElementById('csv-upload') as HTMLInputElement;
    input?.click();
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Data Upload</h2>
      <div className={styles.uploadArea} onClick={handleUploadClick}>
        <input
          id="csv-upload"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className={styles.uploadInput}
        />
        <button className={styles.uploadButton} disabled={isLoading}>
          {isLoading ? 'Uploading...' : 'Choose CSV File'}
        </button>
        <p className={styles.uploadText}>
          Click to select a CSV file or drag and drop
        </p>
      </div>
      {fileName && (
        <div className={styles.fileName}>
          Selected file: {fileName}
        </div>
      )}
      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}
    </div>
  );
};

export default CsvUploader;
