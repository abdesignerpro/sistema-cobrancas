export interface Client {
  id: string;
  name: string;
  service: string;
  value: number;
  dueDate: string;
  dueTime: string;
  phone?: string;
  status: string;
  automaticMessage: boolean;
  pixKey?: string;
  pixQRCode?: string;
}

export interface MessageConfig {
  chargeTemplate: string;
  messageTemplate: string;
  daysBeforeDue: number;
  sendReminder: boolean;
  reminderDays: number;
  reminderMessage: string;
  hour: number;
  minute: number;
}

export interface DashboardStats {
  totalReceivables: number;
  upcomingPayments: number;
  upcomingDueDates: Array<{
    client: string;
    dueDate: string;
    value: number;
    status: string;
  }>;
}
