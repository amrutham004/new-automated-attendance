/**
 * clearOldData.ts - Utility to clear old mock data from localStorage
 * Run this once to clean up any old mock attendance records
 */

export const clearOldAttendanceData = (): void => {
  try {
    // Clear attendance records
    localStorage.removeItem('attendance_records');
    
    console.log('✅ Old attendance data cleared successfully');
    console.log('ℹ️ The system will now only show real attendance data from student check-ins');
    
    return;
  } catch (error) {
    console.error('Failed to clear old data:', error);
  }
};

// Auto-clear on first load if needed
export const initializeCleanData = (): void => {
  const hasCleared = localStorage.getItem('data_cleaned_v1');
  
  if (!hasCleared) {
    clearOldAttendanceData();
    localStorage.setItem('data_cleaned_v1', 'true');
    console.log('🔄 First-time data cleanup completed');
  }
};
