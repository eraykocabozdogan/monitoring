import type { ChangeEvent } from 'react';
import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore.js';
import styles from './CsvUploader.module.css';

const CsvUploader = () => {
  const { stagedFiles, addStagedFile, removeStagedFile, processStagedFiles, isLoading } = useAppStore();
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      addStagedFile(file);
    }
    event.target.value = '';
  };

  const handleProcessClick = async () => {
    setMessage(null);
    const result = await processStagedFiles();
    if (!result.success) {
      setMessage({ text: result.message, type: 'error' });
    }
  };
  
  const handleUploadClick = () => {
    document.getElementById('csv-upload-single')?.click();
  };


  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Data Upload</h2>
      
      {/* Dosya Seçme Alanı */}
      <div className={styles.uploadArea} onClick={handleUploadClick}>
        <input
          id="csv-upload-single"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className={styles.uploadInput}
          disabled={isLoading}
        />
        <button className={styles.uploadButton} type="button" disabled={isLoading}>
          Add File
        </button>
        <p className={styles.uploadText}>
          Add Event Log and Power Curve files to process.
        </p>
      </div>

      {/* Yüklenen Dosyalar Listesi */}
      {stagedFiles.length > 0 && (
        <div className={styles.fileList}>
          <h3 className={styles.fileListTitle}>Files to be uploaded:</h3>
          <ul>
            {stagedFiles.map(file => (
              <li key={file.name}>
                <span>{file.name}</span>
                <button
                  onClick={() => removeStagedFile(file.name)}
                  className={styles.removeButton}
                  title="Remove file"
                  disabled={isLoading}
                >
                  &times;
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Mesaj ve Onay Butonu */}
      {message && (
        <div className={message.type === 'error' ? styles.error : styles.fileName}>
          {message.text}
        </div>
      )}
      
      <button
        className={styles.processButton}
        onClick={handleProcessClick}
        disabled={isLoading || stagedFiles.length === 0}
      >
        {isLoading ? 'Processing...' : 'Process Selected Files'}
      </button>
    </div>
  );
};

export default React.memo(CsvUploader);