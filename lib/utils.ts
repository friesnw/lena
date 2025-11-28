export function getMonthRangeText(month: number): string {
  if (month === 0) {
    return "Summer of 2025";
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const startMonth = 9 + month; // September (9) + month number
  const endMonth = 10 + month; // October (10) + month number

  const startMonthName = monthNames[startMonth - 1]; // Convert to 0-indexed
  const endMonthName = monthNames[endMonth - 1];

  return `${startMonthName} - ${endMonthName}`;
}

// Helper function to calculate days since October 15, 2025
export function getDaysSinceOct15_2025(dateString: string): number {
  const startDate = new Date("2025-10-16T00:00:00");
  const captureDate = new Date(dateString);
  const diffTime = captureDate.getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}
