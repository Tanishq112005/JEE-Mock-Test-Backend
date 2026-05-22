export interface NotificationMessage {
  toEmail?: string;
  toPhone?: string;
  subject?: string;
  content?: string;
  cc?: string[];
  type? : string ; 
  metadata?: Record<string, any>; // Catch-all for extra variables
}

export interface INotificationService {
  send(message: NotificationMessage): Promise<any>;
}