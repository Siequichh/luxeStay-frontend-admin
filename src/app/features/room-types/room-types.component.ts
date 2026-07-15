import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { FileUploadModule } from 'primeng/fileupload';
import { MessageService, ConfirmationService } from 'primeng/api';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { HotelService, HotelResponse } from '../../core/services/hotel.service';
import { RoomTypeService, RoomTypeResponse, RoomTypeRequest } from '../../core/services/room-type.service';
import { ImageService } from '../../core/services/image.service';

const CATEGORY_OPTIONS = [
  { label: 'Individual',    value: 'INDIVIDUAL'   },
  { label: 'Doble',         value: 'DOBLE'        },
  { label: 'Matrimonial',   value: 'MATRIMONIAL'  },
  { label: 'Triple',        value: 'TRIPLE'       },
  { label: 'Familiar',      value: 'FAMILIAR'     },
];

@Component({
  selector: 'app-room-types',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    TableModule, TagModule, ButtonModule, DrawerModule,
    InputTextModule, TextareaModule, InputNumberModule, SelectModule, CheckboxModule,
    TooltipModule, MessageModule, ToastModule, ConfirmDialogModule, FileUploadModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './room-types.component.html',
})
export class RoomTypesComponent implements OnInit {

  private auth           = inject(AuthService);
  private hotelService   = inject(HotelService);
  private rtService      = inject(RoomTypeService);
  private imageService   = inject(ImageService);
  private msgService     = inject(MessageService);
  private confirmService = inject(ConfirmationService);

  readonly categoryOptions = CATEGORY_OPTIONS;

  hotels     = signal<HotelResponse[]>([]);
  roomTypes  = signal<RoomTypeResponse[]>([]);
  loading    = signal(true);

  selectedHotelId = signal<number | null>(null);

  // ── Drawer ─────────────────────────────────────────────────
  drawerVisible = signal(false);
  isEdit        = signal(false);
  editingId     = signal<number | null>(null);
  saving        = signal(false);
  formError     = signal('');

  form = {
    name: '', category: 'INDIVIDUAL', description: '',
    maxGuests: 1, areaSqm: 20, basePriceNight: 100,
    basePriceHour: null as number | null, allowsVelocity: false,
    imageUrls: [] as string[],
  };

  uploadingImage = signal(false);

  isAdmin = computed(() => this.auth.currentUser()?.role === 'ADMIN');

  async ngOnInit() {
    const hotels = await firstValueFrom(
      this.isAdmin() ? this.hotelService.getAll() : this.hotelService.getMyHotels()
    );
    this.hotels.set(hotels);
    if (hotels.length > 0) {
      this.selectedHotelId.set(hotels[0].id);
      await this.loadRoomTypes();
    } else {
      this.loading.set(false);
    }
  }

  async loadRoomTypes() {
    const hotelId = this.selectedHotelId();
    if (!hotelId) return;
    this.loading.set(true);
    try {
      const rts = await firstValueFrom(this.rtService.listByHotel(hotelId));
      this.roomTypes.set(rts);
    } finally {
      this.loading.set(false);
    }
  }

  onHotelChange() { this.loadRoomTypes(); }

  // ── Create ─────────────────────────────────────────────────

  openCreate() {
    this.isEdit.set(false);
    this.editingId.set(null);
    this.form = {
      name: '', category: 'INDIVIDUAL', description: '',
      maxGuests: 1, areaSqm: 20, basePriceNight: 100,
      basePriceHour: null, allowsVelocity: false, imageUrls: [],
    };
    this.formError.set('');
    this.drawerVisible.set(true);
  }

  openEdit(rt: RoomTypeResponse) {
    this.isEdit.set(true);
    this.editingId.set(rt.id);
    this.form = {
      name: rt.name, category: rt.category.toUpperCase(), description: rt.description,
      maxGuests: rt.maxGuests, areaSqm: rt.areaSqm,
      basePriceNight: rt.basePriceNight, basePriceHour: rt.basePriceHour,
      allowsVelocity: rt.allowsVelocity, imageUrls: [...rt.images],
    };
    this.formError.set('');
    this.drawerVisible.set(true);
  }

  async save() {
    if (!this.form.name || !this.form.description) {
      this.formError.set('Nombre y descripción son requeridos.');
      return;
    }
    if (this.form.allowsVelocity && !this.form.basePriceHour) {
      this.formError.set('Precio por hora requerido cuando Luxe Velocity está habilitado.');
      return;
    }
    this.saving.set(true);
    this.formError.set('');

    const req: RoomTypeRequest = {
      name: this.form.name, category: this.form.category, description: this.form.description,
      maxGuests: this.form.maxGuests, areaSqm: this.form.areaSqm,
      basePriceNight: this.form.basePriceNight,
      basePriceHour: this.form.basePriceHour ?? undefined,
      allowsVelocity: this.form.allowsVelocity,
      imageUrls: this.form.imageUrls,
      primaryImageIndex: 0,
    };

    try {
      if (this.isEdit()) {
        const updated = await firstValueFrom(this.rtService.update(this.editingId()!, req));
        this.roomTypes.update(list => list.map(r => r.id === updated.id ? updated : r));
        this.msgService.add({ severity: 'success', summary: 'Guardado', detail: 'Tipo actualizado.' });
      } else {
        const created = await firstValueFrom(
          this.rtService.create(this.selectedHotelId()!, req));
        this.roomTypes.update(list => [created, ...list]);
        this.msgService.add({ severity: 'success', summary: 'Creado', detail: `"${created.name}" creado.` });
      }
      this.drawerVisible.set(false);
    } catch (err: any) {
      this.formError.set(err.error?.message ?? 'Error al guardar');
    } finally {
      this.saving.set(false);
    }
  }

  confirmDeactivate(rt: RoomTypeResponse) {
    this.confirmService.confirm({
      message:     `¿Desactivar "${rt.name}"?`,
      header:      'Confirmar',
      icon:        'pi pi-exclamation-triangle',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      accept: async () => {
        try {
          await firstValueFrom(this.rtService.deactivate(rt.id));
          this.roomTypes.update(list => list.map(r => r.id === rt.id ? { ...r, active: false } : r));
          this.msgService.add({ severity: 'warn', summary: 'Desactivado', detail: `"${rt.name}" desactivado.` });
        } catch (err: any) {
          this.msgService.add({ severity: 'error', summary: 'Error',
                                detail: err.error?.message ?? 'No se pudo desactivar' });
        }
      },
    });
  }

  // ── Image upload ──────────────────────────────────────────

  async onFileSelect(event: any) {
    const file: File = event.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      this.msgService.add({ severity: 'error', summary: 'Archivo muy grande',
                            detail: 'La imagen no puede superar los 10 MB.' });
      return;
    }
    this.uploadingImage.set(true);
    try {
      const url = await firstValueFrom(this.imageService.upload(file));
      this.form.imageUrls = [...this.form.imageUrls, url];
      this.msgService.add({ severity: 'success', summary: 'Imagen subida', detail: 'Imagen cargada correctamente.' });
    } catch {
      this.msgService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo subir la imagen. Intenta de nuevo.' });
    } finally {
      this.uploadingImage.set(false);
    }
  }

  removeImage(idx: number) {
    this.form.imageUrls = this.form.imageUrls.filter((_, i) => i !== idx);
  }

  selectedHotelName = computed(() =>
    this.hotels().find(h => h.id === this.selectedHotelId())?.name ?? '');
}
