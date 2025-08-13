// Test English duration formatting
const formatDuration = (startTime, endTime) => {
  const diffMs = endTime.getTime() - startTime.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  // If longer than a week (more than 7 days)
  if (diffDays >= 7) {
    const days = diffDays;
    const remainingHours = diffHours - (days * 24);
    if (remainingHours > 0) {
      return `${days} days ${remainingHours} hours`;
    } else {
      return `${days} days`;
    }
  }
  // If shorter than a week
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

// Test cases
const now = new Date();

// 30 minutes
const test1Start = new Date(now.getTime());
const test1End = new Date(now.getTime() + 30 * 60 * 1000);
console.log("30 minutes:", formatDuration(test1Start, test1End));

// 2 hours 15 minutes
const test2Start = new Date(now.getTime());
const test2End = new Date(now.getTime() + (2 * 60 + 15) * 60 * 1000);
console.log("2 hours 15 minutes:", formatDuration(test2Start, test2End));

// 8 days 5 hours
const test3Start = new Date(now.getTime());
const test3End = new Date(now.getTime() + (8 * 24 + 5) * 60 * 60 * 1000);
console.log("8 days 5 hours:", formatDuration(test3Start, test3End));

// 7 days exactly
const test4Start = new Date(now.getTime());
const test4End = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
console.log("7 days exactly:", formatDuration(test4Start, test4End));
