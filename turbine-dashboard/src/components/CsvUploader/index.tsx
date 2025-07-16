import type { ChangeEvent } from 'react';
import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore.js';
import { parseCsvFiles } from '../../utils/csvParser.js';
import styles from './CsvUploader.module.css';

const CsvUploader = () => {
  const { setLogEvents, setPowerCurveData } = useAppStore();
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    setFileNames(Array.from(files).map(f => f.name));
    setError('');
    setIsLoading(true);

    try {
      const { logs, power } = await parseCsvFiles(files);
      if (logs.length > 0) {
        setLogEvents(logs);
      }
      if (power.length > 0) {
        setPowerCurveData(power);
      }
      if(logs.length === 0 && power.length === 0) {
        setError('Could not parse any known data from the file(s). Please check the file formats.');
      }
    } catch (err) {
      console.error('Error parsing CSV files:', err);
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Error parsing CSV files: ${message}`);
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
          multiple // Allow multiple files
        />
        <button className={styles.uploadButton} disabled={isLoading}>
          {isLoading ? 'Uploading...' : 'Choose CSV File(s)'}
        </button>
        <p className={styles.uploadText}>
          Select both Event Log and Power Curve CSV files.
        </p>
      </div>
      {fileNames.length > 0 && (
        <div className={styles.fileName}>
          Selected: {fileNames.join(', ')}
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

export default React.memo(CsvUploader);