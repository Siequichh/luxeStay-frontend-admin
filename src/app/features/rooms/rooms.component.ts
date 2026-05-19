import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { environment } from '../../../environments/environment';

interface RoomAvailability {
  id: number;
  roomNumber: string;
  floor: number;
  hotelName: string;
  roomTypeName: string;
  category: string;
  basePriceNight: number;
  maxGuests: number;
  allowsVelocity: boolean;
}

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    TagModule,
    ButtonModule,
    InputNumberModule,
    DatePickerModule,
  ],
  templateUrl: './rooms.component.html',
  styleUrl: './rooms.component.scss',
})
export class RoomsComponent implements OnInit {
  private http = inject(HttpClient);

  rooms: RoomAvailability[] = [];
  loading = false;
  searched = false;

  todayDate    = new Date();
  checkInDate  = new Date();
  checkOutDate = this.addDays(new Date(), 1);
  minCheckOut  = this.addDays(new Date(), 1);
  guests = 1;

  ngOnInit(): void {
    this.search();
  }

  onCheckInChange(): void {
    const minOut = this.addDays(this.checkInDate, 1);
    if (this.checkOutDate <= this.checkInDate) {
      this.checkOutDate = minOut;
    }
    this.minCheckOut = minOut;
  }

  search(): void {
    this.loading  = true;
    this.searched = true;
    const params = new HttpParams()
      .set('checkIn',  this.formatDate(this.checkInDate))
      .set('checkOut', this.formatDate(this.checkOutDate))
      .set('guests',   this.guests);

    this.http.get<RoomAvailability[]>(`${environment.apiUrl}/rooms`, { params }).subscribe({
      next: data => { this.rooms = data; this.loading = false; },
      error: ()   => { this.rooms = [];  this.loading = false; },
    });
  }

  categoryLabel(cat: string): string {
    const map: Record<string, string> = {
      INDIVIDUAL:  'Individual',
      DOBLE:       'Doble',
      MATRIMONIAL: 'Matrimonial',
      TRIPLE:      'Triple',
      FAMILIAR:    'Familiar',
    };
    return map[cat] ?? cat;
  }

  private formatDate(d: Date): string {
    const y   = d.getFullYear();
    const m   = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }
}
