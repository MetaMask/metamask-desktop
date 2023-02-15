/**
 * Analytics Events
 */
export const EVENT_NAMES = {
  DESKTOP_APP_PAIRED: 'Desktop App Paired',
  METRICS_OPT_IN: 'Metrics Opt In',
  METRICS_OPT_OUT: 'Metrics Opt Out',
  INVALID_OTP: 'Invalid OTP',
  DESKTOP_APP_STARTING: 'Desktop App Starting',
  DESKTOP_UI_LOADED: 'Desktop UI Loaded',
  UI_CRITICAL_ERROR: 'Desktop UI Critical Error',
  DESKTOP_APP_UNPAIRED: 'Desktop App Unpaired',
  DESKTOP_APP_OPENED_STARTUP: 'Desktop App Opened at Startup',
};

export enum MetricsDecision {
  ENABLED = 'ENABLED',
  DISABLED = 'DISABLED',
  PENDING = 'PENDING',
}
