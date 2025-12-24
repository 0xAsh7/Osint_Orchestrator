export enum TargetType {
  PHONE = 'PHONE',
  EMAIL = 'EMAIL',
  USERNAME = 'USERNAME',
  NAME = 'NAME',
  UNKNOWN = 'UNKNOWN'
}

export interface OsintResult {
  reportMarkdown: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  GENERATING = 'GENERATING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}