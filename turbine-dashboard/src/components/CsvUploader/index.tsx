import type { ChangeEvent } from 'react';
import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore.js';
import styles from './CsvUploader.module.css';

const CsvUploader = () => {
  // Store'dan gerekli state ve action'ları al
  const { stagedFiles, addStagedFile, removeStagedFile, processStagedFiles } = useAppStore();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      addStagedFile(file);
    }
    // Input'u temizle ki aynı dosya tekrar seçilebilsin
    event.target.value = '';
  };

  const handleProcessClick = async () => {
    setIsLoading(true);
    setMessage(null);
    const result = await processStagedFiles();
    if (!result.success) {
      setMessage({ text: result.message, type: 'error' });
    }
    setIsLoading(false);
  };
  
  const handleUploadClick = () => {
    document.getElementById('csv-upload-single')?.click();
  };


  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Veri Yükleme</h2>
      
      {/* Dosya Seçme Alanı */}
      <div className={styles.uploadArea} onClick={handleUploadClick}>
        <input
          id="csv-upload-single"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className={styles.uploadInput}
        />
        <button className={styles.uploadButton} type="button">
          Dosya Ekle
        </button>
        <p className={styles.uploadText}>
          İşlemek için Event Log ve Power Curve dosyalarını ekleyin.
        </p>
      </div>

      {/* Yüklenen Dosyalar Listesi */}
      {stagedFiles.length > 0 && (
        <div className={styles.fileList}>
          <h3 className={styles.fileListTitle}>Yüklenecek Dosyalar:</h3>
          <ul>
            {stagedFiles.map(file => (
              <li key={file.name}>
                <span>{file.name}</span>
                <button
                  onClick={() => removeStagedFile(file.name)}
                  className={styles.removeButton}
                  title="Dosyayı kaldır"
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
        {isLoading ? 'İşleniyor...' : 'Seçili Dosyaları Onayla'}
      </button>
    </div>
  );
};

export default React.memo(CsvUploader);