import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface NotifPage {
  unread: number;
  items: NotificationItem[];
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  unread = signal(0);
  items  = signal<NotificationItem[]>([]);

  private base = `${environment.apiUrl}/notifications`;
  private intervalId?: ReturnType<typeof setInterval>;

  constructor(private http: HttpClient, private auth: AuthService) {}

  start(): void {
    this.load();
    this.intervalId = setInterval(() => this.load(), 15000);
  }

  stop(): void {
    clearInterval(this.intervalId);
  }

  markAllRead(): void {
    this.http.patch(`${this.base}/read-all`, {}).subscribe({
      next: () => {
        this.unread.set(0);
        this.items.update(list => list.map(n => ({ ...n, read: true })));
      },
      error: () => {},
    });
  }

  markRead(id: number): void {
    this.http.patch(`${this.base}/${id}/read`, {}).subscribe({
      next: () => {
        this.unread.update(v => Math.max(0, v - 1));
        this.items.update(list => list.map(n => n.id === id ? { ...n, read: true } : n));
      },
      error: () => {},
    });
  }

  private load(): void {
    if (!this.auth.currentUser()) return;
    this.http.get<NotifPage>(this.base).subscribe({
      next: d => { this.unread.set(d.unread); this.items.set(d.items); },
      error: () => {},
    });
  }
}
