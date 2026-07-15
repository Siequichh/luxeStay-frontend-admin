import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { HotelService, HotelResponse } from '../../core/services/hotel.service';
import { RoomTypeService, RoomTypeResponse } from '../../core/services/room-type.service';
import { RoomService, RoomAdminResponse } from '../../core/services/room.service';

const STATUS_OPTIONS = [
  { label: 'Disponible',       value: 'AVAILABLE'    },
  { label: 'Ocupada',          value: 'OCCUPIED'     },
  { label: 'En Mantenimiento', value: 'MAINTENANCE'  },
  { label: 'En Limpieza',      value: 'CLEANING'     },
];

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    TableModule, TagModule, ButtonModule, DrawerModule,
    InputTextModule, InputNumberModule, SelectModule, TextareaModule,
    TooltipModule, MessageModule, ToastModule, ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './rooms.component.html',
})
export class RoomsComponent implements OnInit {

  private auth           = inject(AuthService);
  private hotelService   = inject(HotelService);
  private rtService      = inject(RoomTypeService);
  private roomService    = inject(RoomService);
  private msgService     = inject(MessageService);
  private confirmService = inject(ConfirmationService);

  readonly statusOptions = STATUS_OPTIONS;

  hotels          = signal<HotelResponse[]>([]);
  rooms           = signal<RoomAdminResponse[]>([]);
  roomTypes       = signal<RoomTypeResponse[]>([]);
  loading         = signal(true);
  selectedHotelId = signal<number | null>(null);

  isAdmin = computed(() => this.auth.currentUser()?.role === 'ADMIN');

  // ── Drawer ──────────────────────────────────────────────────
  drawerVisible = signal(false);
  isEdit        = signal(false);
  editingId     = signal<number | null>(null);
  saving        = signal(false);
  formError     = signal('');

  form = {
    roomNumber: '',
    floor: 1,
    roomTypeId: null as number | null,
    status: 'AVAILABLE',
    notes: '',
  };

  async ngOnInit() {
    const hotels = await firstValueFrom(
      this.isAdmin() ? this.hotelService.getAll() : this.hotelService.getMyHotels()
    );
    this.hotels.set(hotels);
    if (hotels.length > 0) {
      this.selectedHotelId.set(hotels[0].id);
      await this.loadData();
    } else {
      this.loading.set(false);
    }
  }

  async loadData() {
    const hotelId = this.selectedHotelId();
    if (!hotelId) return;
    this.loading.set(true);
    try {
      const [rooms, rts] = await Promise.all([
        firstValueFrom(this.roomService.listByHotel(hotelId)),
        firstValueFrom(this.rtService.listByHotel(hotelId)),
      ]);
      this.rooms.set(rooms);
      this.roomTypes.set(rts.filter(rt => rt.active));
    } finally {
      this.loading.set(false);
    }
  }

  onHotelChange() { this.loadData(); }

  statusSeverity(status: string): string {
    switch (status) {
      case 'AVAILABLE':   return 'success';
      case 'OCCUPIED':    return 'warn';
      case 'MAINTENANCE': return 'danger';
      case 'CLEANING':    return 'info';
      default:            return 'secondary';
    }
  }

  openCreate() {
    this.isEdit.set(false);
    this.editingId.set(null);
    this.form = { roomNumber: '', floor: 1, roomTypeId: null, status: 'AVAILABLE', notes: '' };
    this.formError.set('');
    this.drawerVisible.set(true);
  }

  openEdit(r: RoomAdminResponse) {
    this.isEdit.set(true);
    this.editingId.set(r.id);
    this.form = { roomNumber: r.roomNumber, floor: r.floor, roomTypeId: r.roomTypeId,
                  status: r.status, notes: r.notes ?? '' };
    this.formError.set('');
    this.drawerVisible.set(true);
  }

  async save() {
    if (!this.form.roomNumber.trim()) {
      this.formError.set('El número de habitación es requerido.'); return;
    }
    if (!this.form.roomTypeId) {
      this.formError.set('Selecciona un tipo de habitación.'); return;
    }
    this.saving.set(true);
    this.formError.set('');
    const req = {
      roomNumber: this.form.roomNumber.trim(),
      floor:      this.form.floor,
      roomTypeId: this.form.roomTypeId,
      status:     this.form.status,
      notes:      this.form.notes || undefined,
    };
    try {
      if (this.isEdit()) {
        const updated = await firstValueFrom(this.roomService.updateRoom(this.editingId()!, req));
        this.rooms.update(list => list.map(r => r.id === updated.id ? updated : r));
        this.msgService.add({ severity: 'success', summary: 'Guardado', detail: 'Habitación actualizada.' });
      } else {
        const created = await firstValueFrom(
          this.roomService.createRoom(this.selectedHotelId()!, req));
        this.rooms.update(list => [created, ...list]);
        this.msgService.add({ severity: 'success', summary: 'Creada',
                              detail: `Hab. ${created.roomNumber} creada.` });
      }
      this.drawerVisible.set(false);
    } catch (err: any) {
      this.formError.set(err.error?.message ?? 'Error al guardar');
    } finally {
      this.saving.set(false);
    }
  }

  confirmDeactivate(r: RoomAdminResponse) {
    this.confirmService.confirm({
      message:     `¿Desactivar la habitación ${r.roomNumber}?`,
      header:      'Confirmar',
      icon:        'pi pi-exclamation-triangle',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      accept: async () => {
        try {
          await firstValueFrom(this.roomService.deactivateRoom(r.id));
          this.rooms.update(list => list.filter(x => x.id !== r.id));
          this.msgService.add({ severity: 'warn', summary: 'Desactivada',
                                detail: `Hab. ${r.roomNumber} desactivada.` });
        } catch (err: any) {
          this.msgService.add({ severity: 'error', summary: 'Error',
                                detail: err.error?.message ?? 'No se pudo desactivar' });
        }
      },
    });
  }
}
