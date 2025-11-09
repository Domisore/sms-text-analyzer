// Simple SMS test access - can be called from console or integrated anywhere
import SMSTestComponent from './SMSTestComponent';

// Global function that can be called from anywhere
global.testSMS = SMSTestComponent.runTest;
global.checkSMSStatus = SMSTestComponent.checkStatus;

// Export for import
export const testSMS = SMSTestComponent.runTest;
export const checkSMSStatus = SMSTestComponent.checkStatus;

// Console instructions
console.log('🔐 SMS Test Functions Available:');
console.log('• testSMS() - Run full SMS permission test');
console.log('• checkSMSStatus() - Quick permission status check');

export default SMSTestComponent;