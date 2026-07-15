import { Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AuthService } from '../../core/services/auth.service';
import { HotelService, HotelResponse, UpdateHotelRequest, CreateHotelRequest } from '../../core/services/hotel.service';
import { UbigeoService, DepartmentOption, ProvinceOption, UbigeoItem } from '../../core/services/ubigeo.service';

@Component({
  selector: 'app-hotels',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    TableModule, TagModule, ButtonModule,
    DialogModule, InputTextModule, TextareaModule, InputNumberModule,
    SelectModule, TooltipModule, MessageModule, ToastModule, ProgressSpinnerModule,
    ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './hotels.component.html',
  styleUrl: './hotels.component.scss',
})
export class HotelsComponent implements OnInit {

  private auth             = inject(AuthService);
  private hotelService     = inject(HotelService);
  private ubigeoService    = inject(UbigeoService);
  private msgService       = inject(MessageService);
  private confirmService   = inject(ConfirmationService);

  hotels:   HotelResponse[] = [];
  loading   = true;
  apiError  = false;

  // ── Edit dialog ────────────────────────────────────────────
  editDialogVisible = false;
  editingHotel: HotelResponse | null = null;
  saving    = false;
  editError = '';

  editForm = { name: '', description: '', address: '', starRating: null as number | null,
               latitude: null as number | null, longitude: null as number | null };

  // ── Create dialog ──────────────────────────────────────────
  createDialogVisible = false;
  creating  = false;
  createError = '';

  createForm = { name: '', description: '', address: '', starRating: null as number | null,
                 latitude: null as number | null, longitude: null as number | null };

  // ── Shared ubigeo state (reused by edit + create) ──────────
  departments:  DepartmentOption[] = [];
  provinces:    ProvinceOption[]   = [];
  districts:    UbigeoItem[]       = [];
  selectedDep:  DepartmentOption | null = null;
  selectedProv: ProvinceOption   | null = null;
  selectedDist: UbigeoItem       | null = null;
  loadingDeps   = false;
  loadingProvs  = false;
  loadingDists  = false;

  isAdmin = computed(() => this.auth.currentUser()?.role === 'ADMIN');

  ngOnInit(): void { this.loadHotels(); }

  loadHotels(): void {
    this.loading  = true;
    this.apiError = false;
    const req$ = this.isAdmin() ? this.hotelService.getAll() : this.hotelService.getMyHotels();
    req$.subscribe({
      next:  data => { this.hotels = data; this.loading = false; },
      error: ()   => { this.apiError = true; this.loading = false; },
    });
  }

  // ── Create ─────────────────────────────────────────────────

  openCreate(): void {
    this.createForm  = { name: '', description: '', address: '', starRating: null,
                         latitude: null, longitude: null };
    this.createError = '';
    this._resetUbigeo();
    this._loadDepartments();
    this.createDialogVisible = true;
  }

  saveCreate(): void {
    if (!this.createForm.name || !this.createForm.description ||
        !this.createForm.address || !this.selectedDist) {
      this.createError = 'Completa todos los campos requeridos, incluyendo la ubicación.';
      return;
    }
    this.creating    = true;
    this.createError = '';

    const req: CreateHotelRequest = {
      name:        this.createForm.name,
      description: this.createForm.description,
      address:     this.createForm.address,
      reniecCode:  this.selectedDist.reniecCode,
      starRating:  this.createForm.starRating ?? undefined,
      latitude:    this.createForm.latitude   ?? undefined,
      longitude:   this.createForm.longitude  ?? undefined,
    };

    this.hotelService.create(req).subscribe({
      next: created => {
        this.hotels = [created, ...this.hotels];
        this.creating            = false;
        this.createDialogVisible = false;
        this.msgService.add({ severity: 'success', summary: 'Creado', detail: `Hotel "${created.name}" creado.` });
      },
      error: err => {
        this.createError = err.error?.message ?? 'Error al crear el hotel';
        this.creating    = false;
      },
    });
  }

  // ── Edit ───────────────────────────────────────────────────

  openEdit(hotel: HotelResponse): void {
    this.editingHotel = hotel;
    this.editForm     = { name: hotel.name, description: hotel.description,
                          address: hotel.address, starRating: hotel.starRating,
                          latitude: hotel.latitude, longitude: hotel.longitude };
    this.editError    = '';
    this._resetUbigeo();
    this._loadDepartments(() => {
      const dep = this.departments.find(d => d.code === hotel.departmentCode);
      if (!dep) return;
      this.selectedDep = dep;
      this.loadingProvs = true;
      this.ubigeoService.getProvinces(dep.code).subscribe({
        next: provs => {
          this.provinces    = provs;
          this.loadingProvs = false;
          const prov = provs.find(p => p.code === hotel.provinceCode);
          if (!prov) return;
          this.selectedProv = prov;
          this.loadingDists = true;
          this.ubigeoService.getDistricts(dep.code, prov.code).subscribe({
            next: dists => {
              this.districts    = dists;
              this.loadingDists = false;
              this.selectedDist = dists.find(d => d.reniecCode === hotel.reniecCode) ?? null;
            },
            error: () => { this.loadingDists = false; },
          });
        },
        error: () => { this.loadingProvs = false; },
      });
    });
    this.editDialogVisible = true;
  }

  saveEdit(): void {
    if (!this.editingHotel) return;
    this.saving    = true;
    this.editError = '';

    const req: UpdateHotelRequest = {
      name:        this.editForm.name        || undefined,
      description: this.editForm.description || undefined,
      address:     this.editForm.address     || undefined,
      starRating:  this.editForm.starRating  ?? undefined,
      reniecCode:  this.selectedDist?.reniecCode ?? undefined,
      latitude:    this.editForm.latitude    ?? undefined,
      longitude:   this.editForm.longitude   ?? undefined,
    };

    const save$ = this.isAdmin()
      ? this.hotelService.updateHotel(this.editingHotel.id, req)
      : this.hotelService.updateMyHotel(this.editingHotel.id, req);

    save$.subscribe({
      next: updated => {
        this.hotels = this.hotels.map(h => h.id === updated.id ? updated : h);
        this.saving = false; this.editDialogVisible = false; this.editingHotel = null;
        this.msgService.add({ severity: 'success', summary: 'Guardado', detail: 'Hotel actualizado.' });
      },
      error: err => { this.editError = err.error?.message ?? 'Error al guardar'; this.saving = false; },
    });
  }

  closeEdit(): void { this.editDialogVisible = false; this.editingHotel = null; }

  // ── Deactivate ─────────────────────────────────────────────

  confirmDeactivate(hotel: HotelResponse): void {
    this.confirmService.confirm({
      message:     `¿Desactivar el hotel "${hotel.name}"? Las habitaciones y reservas existentes no se borrarán.`,
      header:      'Confirmar desactivación',
      icon:        'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, desactivar',
      rejectLabel: 'Cancelar',
      accept:      () => this._doDeactivate(hotel),
    });
  }

  private _doDeactivate(hotel: HotelResponse): void {
    this.hotelService.deactivate(hotel.id).subscribe({
      next: () => {
        this.hotels = this.hotels.map(h => h.id === hotel.id ? { ...h, active: false } : h);
        this.msgService.add({ severity: 'warn', summary: 'Desactivado', detail: `"${hotel.name}" desactivado.` });
      },
      error: err => this.msgService.add({ severity: 'error', summary: 'Error',
                                          detail: err.error?.message ?? 'No se pudo desactivar' }),
    });
  }

  // ── Ubigeo helpers ─────────────────────────────────────────

  private _resetUbigeo(): void {
    this.provinces = []; this.districts = [];
    this.selectedDep = null; this.selectedProv = null; this.selectedDist = null;
  }

  private _loadDepartments(cb?: () => void): void {
    this.loadingDeps = true;
    this.ubigeoService.getDepartments().subscribe({
      next: deps => { this.departments = deps; this.loadingDeps = false; cb?.(); },
      error: ()  => { this.loadingDeps = false; },
    });
  }

  onDepChange(): void {
    this.selectedProv = null; this.selectedDist = null;
    this.provinces = []; this.districts = [];
    if (!this.selectedDep) return;
    this.loadingProvs = true;
    this.ubigeoService.getProvinces(this.selectedDep.code).subscribe({
      next: data => { this.provinces = data; this.loadingProvs = false; },
      error: ()  => { this.loadingProvs = false; },
    });
  }

  onProvChange(): void {
    this.selectedDist = null; this.districts = [];
    if (!this.selectedDep || !this.selectedProv) return;
    this.loadingDists = true;
    this.ubigeoService.getDistricts(this.selectedDep.code, this.selectedProv.code).subscribe({
      next: data => { this.districts = data; this.loadingDists = false; },
      error: ()  => { this.loadingDists = false; },
    });
  }

  starLabel(rating: number | null): string {
    if (!rating) return '—';
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  reload(): void { this.loadHotels(); }
}
