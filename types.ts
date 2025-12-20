export type UserRole = 'counselor' | 'headteacher';

export interface StudentDataRow {
  user_id: string | number;
  real_name: string;
  package_grade: string;
  counselor_name: string;
  
  level_sequence: number | string; // Unit
  unit_sequence: number | string;  // Lesson
  
  unit_finish_status: string;
  first_cost_seconds: number | string; 
  answer_right_rate: string | number; 
  pass_rate?: string | number; // Added pass_rate
  wrong_answer_count?: number | string;
  first_finish_answer_step_fail_cnt?: number | string; // Field for specific error count
  
  [key: string]: any;
}

export interface Badge {
  name: string;
  type: 'completion' | 'accuracy';
  level: 'gold' | 'silver' | 'bronze' | 'star' | 'sprout' | 'model' | 'master' | 'progress' | 'potential' | 'growth';
  description: string;
  stars?: number; // Added for Head Teacher mode (0-5)
}

export interface UnitData {
  unitNumber: number;
  unitName: string;
  timeSpentSeconds: number;
  status: 'high' | 'low';
  statusLabel: string;
  accuracy: number;
  classAccuracy: number;
  passRate: number;       // Added for trend metric switching
  classPassRate: number;  // Added for trend metric switching
  wrongCount: number; // For Head Teacher error tracking
  analysis: string;
}

export interface TrendAnalysis {
  status: string;
  title: string;
  content: string;
}

export interface MonthlySummary {
  milestone: string;
  highlights: string[];
  improvements: string[];
}

export interface ProcessedReportData {
  studentName: string;
  grade: string;
  teacher: string;
  role: UserRole;
  
  // Time Stats
  totalTimeSeconds: number;
  avgTimePerSession: number;
  timeComment: string;

  // Badge Data
  completionBadge: Badge;
  accuracyBadge: Badge;
  htBadges?: Badge[]; // For Head Teacher mode: 4 specific badges

  // Main Data
  completedUnitsCount: number;
  units: UnitData[]; // Lessons in HeadTeacher mode
  
  // Analysis
  trendAnalysis: TrendAnalysis;
  monthlySummary: MonthlySummary;
}