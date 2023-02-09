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
};

export enum MetricsDecision {
  ENABLED = 'ENABLED',
  DISABLED = 'DISABLED',
  PENDING = 'PENDING',
}
