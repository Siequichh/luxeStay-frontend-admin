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
import { TooltipModule } from 'primeng/tooltip';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { HotelService, HotelResponse } from '../../core/services/hotel.service';
import { RoomTypeService, RoomTypeResponse } from '../../core/services/room-type.service';
import {
  AvailabilityService, RoomAdmin, AvailabilityDay, VelocityBlock, SeasonalPricing,
} from '../../core/services/availability.service';

type Tab = 'availability' | 'velocity' | 'seasonal';

/** Bloques Luxe Velocity estándar (20:00–00:00 se registra como 20:00–23:59 por validación del backend). */
const VELOCITY_PRESETS = [
  { label: '08:00 – 12:00', startTime: '08:00', endTime: '12:00' },
  { label: '12:00 – 16:00', startTime: '12:00', endTime: '16:00' },
  { label: '16:00 – 20:00', startTime: '16:00', endTime: '20:00' },
  { label: '20:00 – 00:00', startTime: '20:00', endTime: '23:59' },
];

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    TableModule, TagModule, ButtonModule, DrawerModule,
    InputTextModule, InputNumberModule, SelectModule,
    TooltipModule, MessageModule, ToastModule, ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './pricing.component.html',
  styleUrl: './pricing.component.scss',
})
export class PricingComponent implements OnInit {

  private auth           = inject(AuthService);
  private hotelService   = inject(HotelService);
  private rtService      = inject(RoomTypeService);
  private availService   = inject(AvailabilityService);
  private msgService     = inject(MessageService);
  private confirmService = inject(ConfirmationService);

  readonly velocityPresets = VELOCITY_PRESETS;

  tab = signal<Tab>('availability');

  hotels          = signal<HotelResponse[]>([]);
  rooms           = signal<RoomAdmin[]>([]);
  roomTypes       = signal<RoomTypeResponse[]>([]);
  selectedHotelId = signal<number | null>(null);
  selectedRoomId  = signal<number | null>(null);
  selectedRtId    = signal<number | null>(null);

  isAdmin = computed(() => this.auth.currentUser()?.role === 'ADMIN');

  // ── Disponibilidad ────────────────────────────────────────────
  availFrom  = isoDate(new Date());
  availTo    = isoDate(new Date(Date.now() + 13 * 86400000));
  days       = signal<AvailabilityDay[]>([]);
  daysDirty  = signal(false);
  loadingAvail = signal(false);
  savingAvail  = signal(false);

  // ── Velocity ─────────────────────────────────────────────────
  velocityDate   = isoDate(new Date());
  blocks         = signal<VelocityBlock[]>([]);
  loadingBlocks  = signal(false);
  newBlockPrice: number | null = null;

  // ── Temporadas ───────────────────────────────────────────────
  seasons        = signal<SeasonalPricing[]>([]);
  loadingSeasons = signal(false);
  seasonDrawer   = signal(false);
  savingSeason   = signal(false);
  seasonError    = signal('');
  editingSeasonId: number | null = null;
  seasonForm = { name: '', startDate: '', endDate: '', priceMultiplier: 1.5 };

  async ngOnInit() {
    const hotels = await firstValueFrom(
      this.isAdmin() ? this.hotelService.getAll() : this.hotelService.getMyHotels());
    this.hotels.set(hotels);
    if (hotels.length > 0) {
      this.selectedHotelId.set(hotels[0].id);
      await this.onHotelChange();
    }
  }

  async onHotelChange() {
    const hotelId = this.selectedHotelId();
    if (!hotelId) return;
    const [rooms, rts] = await Promise.all([
      firstValueFrom(this.availService.listRooms(hotelId)),
      firstValueFrom(this.rtService.listByHotel(hotelId)),
    ]);
    this.rooms.set(rooms.filter(r => r.active));
    this.roomTypes.set(rts);
    this.selectedRoomId.set(rooms[0]?.id ?? null);
    this.selectedRtId.set(rts[0]?.id ?? null);
    this.days.set([]);
    this.blocks.set([]);
    this.seasons.set([]);
    this.refreshCurrentTab();
  }

  setTab(t: Tab) {
    this.tab.set(t);
    this.refreshCurrentTab();
  }

  private refreshCurrentTab() {
    switch (this.tab()) {
      case 'availability': this.loadAvailability(); break;
      case 'velocity':     this.loadBlocks();       break;
      case 'seasonal':     this.loadSeasons();      break;
    }
  }

  // ── Disponibilidad ────────────────────────────────────────────

  async loadAvailability() {
    const roomId = this.selectedRoomId();
    if (!roomId || this.availFrom > this.availTo) return;
    this.loadingAvail.set(true);
    this.daysDirty.set(false);
    try {
      const existing = await firstValueFrom(
        this.availService.getAvailability(roomId, this.availFrom, this.availTo));
      const byDate = new Map(existing.map(e => [e.date, e]));
      // Genera el rango completo: días sin registro = disponibles
      const range: AvailabilityDay[] = [];
      for (let d = new Date(this.availFrom + 'T00:00:00'); isoDate(d) <= this.availTo; d.setDate(d.getDate() + 1)) {
        const date = isoDate(d);
        range.push(byDate.get(date) ?? { date, available: true, blockedReason: '' });
      }
      this.days.set(range);
    } finally {
      this.loadingAvail.set(false);
    }
  }

  toggleDay(day: AvailabilityDay) {
    this.days.update(list => list.map(d =>
      d.date === day.date ? { ...d, available: !d.available, blockedReason: d.available ? d.blockedReason : '' } : d));
    this.daysDirty.set(true);
  }

  setReason(day: AvailabilityDay, reason: string) {
    this.days.update(list => list.map(d => d.date === day.date ? { ...d, blockedReason: reason } : d));
    this.daysDirty.set(true);
  }

  async saveAvailability() {
    const roomId = this.selectedRoomId();
    if (!roomId) return;
    this.savingAvail.set(true);
    try {
      await firstValueFrom(this.availService.setAvailability(roomId, this.days()));
      this.daysDirty.set(false);
      this.msgService.add({ severity: 'success', summary: 'Guardado', detail: 'Disponibilidad actualizada.' });
    } catch (err: any) {
      this.msgService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? 'No se pudo guardar' });
    } finally {
      this.savingAvail.set(false);
    }
  }

  dayNum   = (iso: string) => +iso.slice(8, 10);
  dayLabel = (iso: string) =>
    new Date(iso + 'T00:00:00').toLocaleDateString('es-PE', { weekday: 'short', month: 'short' });

  // ── Velocity ─────────────────────────────────────────────────

  async loadBlocks() {
    const roomId = this.selectedRoomId();
    if (!roomId) return;
    this.loadingBlocks.set(true);
    try {
      this.blocks.set(await firstValueFrom(
        this.availService.getVelocityBlocks(roomId, this.velocityDate)));
    } finally {
      this.loadingBlocks.set(false);
    }
  }

  blockExists(preset: { startTime: string }) {
    return this.blocks().some(b => b.startTime.startsWith(preset.startTime));
  }

  async addBlock(preset: { startTime: string; endTime: string }) {
    const roomId = this.selectedRoomId();
    if (!roomId) return;
    if (!this.newBlockPrice) {
      this.msgService.add({ severity: 'warn', summary: 'Falta precio', detail: 'Ingresa el precio del bloque.' });
      return;
    }
    try {
      await firstValueFrom(this.availService.createVelocityBlock(roomId, {
        blockDate: this.velocityDate,
        startTime: preset.startTime,
        endTime:   preset.endTime,
        priceBlock: this.newBlockPrice,
      }));
      this.msgService.add({ severity: 'success', summary: 'Bloque creado' });
      this.loadBlocks();
    } catch (err: any) {
      this.msgService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? 'No se pudo crear' });
    }
  }

  confirmDeleteBlock(b: VelocityBlock) {
    this.confirmService.confirm({
      message: `¿Eliminar el bloque ${b.startTime.slice(0, 5)} – ${b.endTime.slice(0, 5)}?`,
      header: 'Confirmar', icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí', rejectLabel: 'No',
      accept: async () => {
        try {
          await firstValueFrom(this.availService.deleteVelocityBlock(b.id));
          this.blocks.update(list => list.filter(x => x.id !== b.id));
          this.msgService.add({ severity: 'warn', summary: 'Bloque eliminado' });
        } catch (err: any) {
          this.msgService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? 'No se pudo eliminar' });
        }
      },
    });
  }

  // ── Temporadas ───────────────────────────────────────────────

  async loadSeasons() {
    const rtId = this.selectedRtId();
    if (!rtId) return;
    this.loadingSeasons.set(true);
    try {
      this.seasons.set(await firstValueFrom(this.availService.getSeasonalPricing(rtId)));
    } finally {
      this.loadingSeasons.set(false);
    }
  }

  openSeasonCreate() {
    this.editingSeasonId = null;
    this.seasonForm = { name: '', startDate: isoDate(new Date()), endDate: '', priceMultiplier: 1.5 };
    this.seasonError.set('');
    this.seasonDrawer.set(true);
  }

  openSeasonEdit(s: SeasonalPricing) {
    this.editingSeasonId = s.id;
    this.seasonForm = { name: s.name, startDate: s.startDate, endDate: s.endDate, priceMultiplier: s.priceMultiplier };
    this.seasonError.set('');
    this.seasonDrawer.set(true);
  }

  async saveSeason() {
    const f = this.seasonForm;
    if (!f.name || !f.startDate || !f.endDate) {
      this.seasonError.set('Nombre y fechas son requeridos.');
      return;
    }
    if (f.endDate <= f.startDate) {
      this.seasonError.set('La fecha fin debe ser posterior al inicio.');
      return;
    }
    this.savingSeason.set(true);
    this.seasonError.set('');
    try {
      if (this.editingSeasonId) {
        await firstValueFrom(this.availService.updateSeasonalPricing(this.editingSeasonId, f));
      } else {
        await firstValueFrom(this.availService.createSeasonalPricing(this.selectedRtId()!, f));
      }
      this.seasonDrawer.set(false);
      this.msgService.add({ severity: 'success', summary: 'Guardado', detail: `Temporada "${f.name}" guardada.` });
      this.loadSeasons();
    } catch (err: any) {
      this.seasonError.set(err.error?.message ?? 'Error al guardar');
    } finally {
      this.savingSeason.set(false);
    }
  }

  confirmDeleteSeason(s: SeasonalPricing) {
    this.confirmService.confirm({
      message: `¿Desactivar la temporada "${s.name}"?`,
      header: 'Confirmar', icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí', rejectLabel: 'No',
      accept: async () => {
        try {
          await firstValueFrom(this.availService.deleteSeasonalPricing(s.id));
          this.seasons.update(list => list.map(x => x.id === s.id ? { ...x, active: false } : x));
          this.msgService.add({ severity: 'warn', summary: 'Temporada desactivada' });
        } catch (err: any) {
          this.msgService.add({ severity: 'error', summary: 'Error', detail: err.error?.message ?? 'No se pudo desactivar' });
        }
      },
    });
  }
}
