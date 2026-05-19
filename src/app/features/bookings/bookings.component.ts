import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { BookingService, BookingResponse, Page } from '../../core/services/booking.service';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [
    CommonModule, CardModule, TableModule, TagModule,
    ButtonModule, InputTextModule, PaginatorModule,
  ],
  templateUrl: './bookings.component.html',
  styleUrl: './bookings.component.scss',
})
export class BookingsComponent implements OnInit {
  bookings: BookingResponse[] = [];
  loading = true;
  totalElements = 0;
  pageSize = 20;
  currentPage = 0;

  constructor(private bookingService: BookingService) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.loading = true;
    this.bookingService.getAllBookings(this.currentPage, this.pageSize).subscribe({
      next: (page: Page<BookingResponse>) => {
        this.bookings      = page.content;
        this.totalElements = page.totalElements;
        this.loading       = false;
      },
      error: () => { this.loading = false; },
    });
  }

  onPageChange(event: PaginatorState): void {
    this.currentPage = event.page ?? 0;
    this.pageSize    = event.rows ?? 20;
    this.loadBookings();
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      CONFIRMED: 'Confirmada',
      PENDING:   'Pendiente',
      CANCELLED: 'Cancelada',
      COMPLETED: 'Completada',
      NO_SHOW:   'No presentó',
    };
    return labels[status] ?? status;
  }

  statusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
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
