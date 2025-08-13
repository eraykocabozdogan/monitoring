// Test formatDuration function
const formatDuration = (startTime, endTime) => {
  const diffMs = endTime.getTime() - startTime.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  // 1 haftadan uzunsa (7 günden fazla)
  if (diffDays >= 7) {
    const days = diffDays;
    const remainingHours = diffHours - (days * 24);
    if (remainingHours > 0) {
      return `${days} gün ${remainingHours} saat`;
    } else {
      return `${days} gün`;
    }
  }
  // 1 haftadan kısaysa
  else {
    const hours = diffHours;
    const remainingMinutes = diffMinutes - (hours * 60);
    if (hours > 0) {
      return `${hours} saat ${remainingMinutes} dakika`;
    } else {
      return `${diffMinutes} dakika`;
    }
  }
};

// Test cases
const now = new Date();

// 30 dakika
const test1Start = new Date(now.getTime());
const test1End = new Date(now.getTime() + 30 * 60 * 1000);
console.log("30 dakika:", formatDuration(test1Start, test1End));

// 2 saat 15 dakika
const test2Start = new Date(now.getTime());
const test2End = new Date(now.getTime() + (2 * 60 + 15) * 60 * 1000);
console.log("2 saat 15 dakika:", formatDuration(test2Start, test2End));

// 8 gün 5 saat
const test3Start = new Date(now.getTime());
const test3End = new Date(now.getTime() + (8 * 24 + 5) * 60 * 60 * 1000);
console.log("8 gün 5 saat:", formatDuration(test3Start, test3End));

// 7 gün tam
const test4Start = new Date(now.getTime());
const test4End = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
console.log("7 gün tam:", formatDuration(test4Start, test4End));
