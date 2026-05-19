import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../core/services/auth.service';
import { BookingService, BookingResponse } from '../../core/services/booking.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, TableModule, TagModule, ButtonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {

  recentBookings: BookingResponse[] = [];
  loading = true;

  totalBookings     = 0;
  confirmedBookings = 0;
  pendingBookings   = 0;
  totalRevenue      = 0;

  /** true si el usuario es ADMIN (dueño del SaaS, ve datos globales) */
  isAdmin = computed(() => this.auth.currentUser()?.role === 'ADMIN');

  get userName(): string {
    return this.auth.currentUser()?.fullName?.split(' ')[0] ?? 'Administrador';
  }

  get welcomeSubtitle(): string {
    return this.isAdmin()
      ? 'Vista global de toda la plataforma LuxeStay'
      : 'Resumen de operaciones de tu hotel';
  }

  constructor(
    private auth: AuthService,
    private bookingService: BookingService,
  ) {}

  ngOnInit(): void {
    this.bookingService.getAllBookings(0, 50).subscribe({
      next: page => {
        this.recentBookings    = page.content.slice(0, 5);
        this.totalBookings     = page.totalElements;
        this.confirmedBookings = page.content.filter(b => b.status === 'CONFIRMED').length;
        this.pendingBookings   = page.content.filter(b => b.status === 'PENDING').length;
        this.totalRevenue      = page.content
          .filter(b => b.status !== 'CANCELLED')
          .reduce((sum, b) => sum + b.totalAmount, 0);
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<string, any> = {
      CONFIRMED: 'success',
      PENDING:   'warn',
      CANCELLED: 'danger',
      COMPLETED: 'info',
      NO_SHOW:   'secondary',
    };
    return map[status] ?? 'secondary';
  }
}
