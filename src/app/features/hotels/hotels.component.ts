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
import { MessageService } from 'primeng/api';
import { AuthService } from '../../core/services/auth.service';
import { HotelService, HotelResponse, UpdateHotelRequest } from '../../core/services/hotel.service';
import { UbigeoService, DepartmentOption, ProvinceOption, UbigeoItem } from '../../core/services/ubigeo.service';

@Component({
  selector: 'app-hotels',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    TableModule, TagModule, ButtonModule,
    DialogModule, InputTextModule, TextareaModule, InputNumberModule,
    SelectModule, TooltipModule, MessageModule, ToastModule, ProgressSpinnerModule,
  ],
  providers: [MessageService],
  templateUrl: './hotels.component.html',
  styleUrl: './hotels.component.scss',
})
export class HotelsComponent implements OnInit {

  private auth          = inject(AuthService);
  private hotelService  = inject(HotelService);
  private ubigeoService = inject(UbigeoService);
  private msgService    = inject(MessageService);

  hotels: HotelResponse[] = [];
  loading  = true;
  apiError = false;

  // ── Edit dialog ────────────────────────────────────────────
  editDialogVisible = false;
  editingHotel: HotelResponse | null = null;
  saving    = false;
  editError = '';

  editForm = {
    name:        '',
    description: '',
    address:     '',
    starRating:  null as number | null,
  };

  // ── Ubigeo cascading state ─────────────────────────────────
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

  ngOnInit(): void {
    this.loadHotels();
  }

  loadHotels(): void {
    this.loading  = true;
    this.apiError = false;
    const request$ = this.isAdmin()
      ? this.hotelService.getAll()
      : this.hotelService.getMyHotels();

    request$.subscribe({
      next:  data => { this.hotels = data; this.loading = false; },
      error: ()   => { this.apiError = true; this.loading = false; },
    });
  }

  // ── Edit ──────────────────────────────────────────────────

  openEdit(hotel: HotelResponse): void {
    this.editingHotel = hotel;
    this.editForm = {
      name:        hotel.name,
      description: hotel.description,
      address:     hotel.address,
      starRating:  hotel.starRating,
    };
    this.editError = '';

    // Reset ubigeo state
    this.provinces   = [];
    this.districts   = [];
    this.selectedDep = null;
    this.selectedProv = null;
    this.selectedDist = null;

    // Load departments then pre-populate
    this.loadingDeps = true;
    this.ubigeoService.getDepartments().subscribe({
      next: (deps) => {
        this.departments = deps;
        this.loadingDeps = false;

        // Pre-select current department
        const dep = deps.find(d => d.code === hotel.departmentCode);
        if (dep) {
          this.selectedDep = dep;
          this.loadingProvs = true;
          this.ubigeoService.getProvinces(dep.code).subscribe({
            next: (provs) => {
              this.provinces    = provs;
              this.loadingProvs = false;

              // Pre-select current province
              const prov = provs.find(p => p.code === hotel.provinceCode);
              if (prov) {
                this.selectedProv = prov;
                this.loadingDists = true;
                this.ubigeoService.getDistricts(dep.code, prov.code).subscribe({
                  next: (dists) => {
                    this.districts    = dists;
                    this.loadingDists = false;

                    // Pre-select current district
                    const dist = dists.find(d => d.reniecCode === hotel.reniecCode);
                    if (dist) this.selectedDist = dist;
                  },
                  error: () => { this.loadingDists = false; },
                });
              }
            },
            error: () => { this.loadingProvs = false; },
          });
        }
      },
      error: () => { this.loadingDeps = false; },
    });

    this.editDialogVisible = true;
  }

  onDepChange(): void {
    this.selectedProv = null;
    this.selectedDist = null;
    this.provinces    = [];
    this.districts    = [];
    if (!this.selectedDep) return;

    this.loadingProvs = true;
    this.ubigeoService.getProvinces(this.selectedDep.code).subscribe({
      next: (data) => { this.provinces = data; this.loadingProvs = false; },
      error: ()    => { this.loadingProvs = false; },
    });
  }

  onProvChange(): void {
    this.selectedDist = null;
    this.districts    = [];
    if (!this.selectedDep || !this.selectedProv) return;

    this.loadingDists = true;
    this.ubigeoService.getDistricts(this.selectedDep.code, this.selectedProv.code).subscribe({
      next: (data) => { this.districts = data; this.loadingDists = false; },
      error: ()    => { this.loadingDists = false; },
    });
  }

  closeEdit(): void {
    this.editDialogVisible = false;
    this.editingHotel = null;
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
    };

    const save$ = this.isAdmin()
      ? this.hotelService.updateHotel(this.editingHotel.id, req)
      : this.hotelService.updateMyHotel(this.editingHotel.id, req);

    save$.subscribe({
      next: (updated) => {
        const idx = this.hotels.findIndex(h => h.id === updated.id);
        if (idx >= 0) this.hotels = [
          ...this.hotels.slice(0, idx),
          updated,
          ...this.hotels.slice(idx + 1),
        ];
        this.saving = false;
        this.editDialogVisible = false;
        this.editingHotel = null;
        this.msgService.add({ severity: 'success', summary: 'Guardado', detail: 'Hotel actualizado correctamente' });
      },
      error: (err) => {
        this.editError = err.error?.message ?? 'Error al guardar los cambios';
        this.saving = false;
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────

  starLabel(rating: number | null): string {
    if (!rating) return '—';
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  reload(): void {
    this.loadHotels();
  }
}
