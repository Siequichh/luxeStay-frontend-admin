import { Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { BookingService, BookingResponse, Page } from '../../core/services/booking.service';
import { AuthService } from '../../core/services/auth.service';

const STATUS_OPTIONS = [
  { label: 'Confirmar',      value: 'CONFIRMED' },
  { label: 'Cancelar',       value: 'CANCELLED' },
  { label: 'Completar',      value: 'COMPLETED' },
  { label: 'No se presentó', value: 'NO_SHOW'   },
];

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [
    CommonModule, FormsModule, CardModule, TableModule, TagModule,
    ButtonModule, InputTextModule, PaginatorModule, SelectModule,
    ToastModule, ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './bookings.component.html',
  styleUrl: './bookings.component.scss',
})
export class BookingsComponent implements OnInit {

  private bookingService = inject(BookingService);
  private auth           = inject(AuthService);
  private msgService     = inject(MessageService);
  private confirmService = inject(ConfirmationService);

  bookings:      BookingResponse[] = [];
  loading        = true;
  totalElements  = 0;
  pageSize       = 20;
  currentPage    = 0;

  statusOptions  = STATUS_OPTIONS;
  updatingId: number | null = null;

  // Modelo por booking.id — null muestra el placeholder "Acción"
  pendingStatus: Record<number, string | null> = {};

  isAdmin = computed(() => this.auth.currentUser()?.role === 'ADMIN');

  ngOnInit(): void { this.loadBookings(); }

  loadBookings(): void {
    this.loading = true;
    const req$ = this.isAdmin()
      ? this.bookingService.getAllBookings(this.currentPage, this.pageSize)
      : this.bookingService.getManagerBookings(this.currentPage, this.pageSize);

    req$.subscribe({
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

  onStatusSelect(booking: BookingResponse, status: string): void {
    const messages: Record<string, string> = {
      CONFIRMED: 'Confirmar indica que el pago fue recibido (en línea o presencial). La reserva pasará a Confirmada y quedará registrada como pagada. ¿Continuar?',
      CANCELLED: `¿Cancelar la reserva ${booking.referenceCode}? El huésped recibirá una notificación.`,
      COMPLETED: `¿Marcar la reserva ${booking.referenceCode} como Completada?`,
      NO_SHOW:   `¿Marcar al huésped como No Presentado en la reserva ${booking.referenceCode}?`,
    };

    this.confirmService.confirm({
      message:     messages[status] ?? `¿Cambiar estado a "${this.statusLabel(status)}"?`,
      header:      status === 'CONFIRMED' ? 'Confirmar pago recibido' : 'Confirmar acción',
      icon:        status === 'CONFIRMED' ? 'pi pi-check-circle' : 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, continuar',
      rejectLabel: 'Cancelar',
      accept: () => this.changeStatus(booking, status),
      reject: () => { this.pendingStatus[booking.id] = null; },
    });
  }

  changeStatus(booking: BookingResponse, status: string): void {
    this.updatingId = booking.id;
    this.bookingService.updateStatus(booking.id, status).subscribe({
      next: updated => {
        const idx = this.bookings.findIndex(b => b.id === updated.id);
        if (idx >= 0) this.bookings = [
          ...this.bookings.slice(0, idx), updated, ...this.bookings.slice(idx + 1)
        ];
        this.updatingId = null;
        this.pendingStatus[booking.id] = null;
        this.msgService.add({ severity: 'success', summary: 'Estado actualizado',
                              detail: `Reserva ${updated.referenceCode} → ${this.statusLabel(updated.status)}` });
      },
      error: err => {
        this.updatingId = null;
        this.pendingStatus[booking.id] = null;
        this.msgService.add({ severity: 'error', summary: 'Error',
                              detail: err.error?.message ?? 'No se pudo cambiar el estado' });
      },
    });
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      CONFIRMED: 'Confirmada', PENDING: 'Pendiente', CANCELLED: 'Cancelada',
      COMPLETED: 'Completada', NO_SHOW: 'No presentó',
    };
    return labels[status] ?? status;
  }

  statusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<string, any> = {
      CONFIRMED: 'success', PENDING: 'warn', CANCELLED: 'danger',
      COMPLETED: 'info', NO_SHOW: 'secondary',
    };
    return map[status] ?? 'secondary';
  }
}
