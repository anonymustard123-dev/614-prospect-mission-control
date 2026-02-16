export type ModuleType = 'Water' | 'Fiber' | 'Power' | 'Land' | 'Misc';
export type ModuleStatus = 'pending' | 'in_progress' | 'completed' | 'on_hold';

export interface Module {
  id: string;
  name: string;
  type: ModuleType;
  lat: number;
  lng: number;
  status: ModuleStatus;
  icon_key?: string | null;
  color?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Task {
  id: string;
  module_id: string;
  title: string;
  description?: string | null;
  start_date: string; // ISO date string
  end_date: string; // ISO date string
  is_completed: boolean;
  parent_id?: string | null;
  color?: string | null;
  created_at?: string;
  updated_at?: string;
}
