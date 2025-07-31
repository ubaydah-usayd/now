export interface Project {
  id: string;
  name: string;
  color: string;
  dailyHours: number;
  tasks: Task[];
  completedSessions: number;
}

export interface Task {
  id: string;
  name: string;
  projectId: string;
  status: 'pending' | 'in-progress' | 'completed';
  assignedDate: 'today' | 'tomorrow';
  timeSpent: number;
}

export interface Session {
  id: string;
  projectId: string;
  taskId?: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  completed: boolean;
  taskWorkedOn?: string;
  taskCompleted?: boolean;
}

export interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  currentProjectId: string | null;
  timeRemaining: number;
  totalTime: number;
  sessionStartTime: Date | null;
  pauseStartTime: Date | null; // Moment où la pause a commencé
  projectSessions: Record<string, number>; // Temps déjà passé sur chaque projet aujourd'hui (en secondes)
  projectSessionProgress: Record<string, number>; // Temps restant de la session en cours pour chaque projet (en secondes)
}

export interface AppState {
  projects: Project[];
  tasks: Task[];
  sessions: Session[];
  timer: TimerState;
  showSessionModal: boolean;
  currentSession: Session | null;
  lastResetDate?: string; // Date de la dernière réinitialisation quotidienne
} 