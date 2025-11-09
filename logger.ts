// Custom logger for Textile SMS app
const APP_TAG = 'TextileSMS';

export const logger = {
  info: (message: string, data?: any) => {
    console.log(`[${APP_TAG}] INFO: ${message}`, data || '');
  },
  
  error: (message: string, error?: any) => {
    console.error(`[${APP_TAG}] ERROR: ${message}`, error || '');
  },
  
  warn: (message: string, data?: any) => {
    console.warn(`[${APP_TAG}] WARN: ${message}`, data || '');
  },
  
  debug: (message: string, data?: any) => {
    console.log(`[${APP_TAG}] DEBUG: ${message}`, data || '');
  },
  
  sms: (message: string, data?: any) => {
    console.log(`[${APP_TAG}] SMS: ${message}`, data || '');
  },
  
  db: (message: string, data?: any) => {
    console.log(`[${APP_TAG}] DB: ${message}`, data || '');
  },
  
  ui: (message: string, data?: any) => {
    console.log(`[${APP_TAG}] UI: ${message}`, data || '');
  }
};

// Export the tag for filtering
export const LOG_TAG = APP_TAG;