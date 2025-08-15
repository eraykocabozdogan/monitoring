// Dosya Yolu: src/utils/formatters.ts
// Kopyalamaya buradan başlayın
export const formatDuration = (startTime: Date, endTime: Date): string => {
    const diffMs = endTime.getTime() - startTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    // 1 haftadan uzunsa (7 günden fazla)
    if (diffDays >= 7) {
      const days = diffDays;
      const remainingHours = diffHours - (days * 24);
      if (remainingHours > 0) {
        return `${days} days ${remainingHours} hours`;
      } else {
        return `${days} days`;
      }
    }
    // 1 haftadan kısaysa
    else {
      const hours = diffHours;
      const remainingMinutes = diffMinutes - (hours * 60);
      if (hours > 0) {
        return `${hours} hours ${remainingMinutes} minutes`;
      } else {
        return `${diffMinutes} minutes`;
      }
    }
  };