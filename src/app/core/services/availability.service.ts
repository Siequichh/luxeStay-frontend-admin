import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// ── Modelos (contratos de ManagerAvailabilityController / ManagerRoomController) ──

export interface RoomAdmin {
  id:            number;
  hotelId:       number;
  hotelName:     string;
  roomTypeId:    number;
  roomTypeName:  string;
  roomNumber:    string;
  floor:         number;
  status:        string;
  statusDisplay: string;
  active:        boolean;
  notes:         string | null;
}

export interface AvailabilityDay {
  id?:           number;
  date:          string;      // yyyy-MM-dd
  available:     boolean;
  blockedReason: string;
}

export interface VelocityBlock {
  id:         number;
  blockDate:  string;
  startTime:  string;
  endTime:    string;
  status:     string;
  priceBlock: number;
}

export interface SeasonalPricing {
  id:              number;
  name:            string;
  startDate:       string;
  endDate:         string;
  priceMultiplier: number;
  active:          boolean;
}

@Injectable({ providedIn: 'root' })
export class AvailabilityService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/manager`;

  // ── Habitaciones físicas del hotel ────────────────────────────────────────
  listRooms(hotelId: number): Observable<RoomAdmin[]> {
    return this.http.get<RoomAdmin[]>(`${this.base}/hotels/${hotelId}/rooms`);
  }

  // ── Disponibilidad diaria ─────────────────────────────────────────────────
  getAvailability(roomId: number, from: string, to: string): Observable<AvailabilityDay[]> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<AvailabilityDay[]>(`${this.base}/rooms/${roomId}/availability`, { params });
  }

  setAvailability(roomId: number, entries: AvailabilityDay[]): Observable<void> {
    return this.http.put<void>(`${this.base}/rooms/${roomId}/availability`, entries);
  }

  // ── Bloques Luxe Velocity ─────────────────────────────────────────────────
  getVelocityBlocks(roomId: number, date: string): Observable<VelocityBlock[]> {
    const params = new HttpParams().set('date', date);
    return this.http.get<VelocityBlock[]>(`${this.base}/rooms/${roomId}/velocity-blocks`, { params });
  }

  createVelocityBlock(roomId: number, req: { blockDate: string; startTime: string; endTime: string; priceBlock: number }): Observable<unknown> {
    return this.http.post(`${this.base}/rooms/${roomId}/velocity-blocks`, req);
  }

  deleteVelocityBlock(blockId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/velocity-blocks/${blockId}`);
  }

  // ── Precios de temporada ──────────────────────────────────────────────────
  getSeasonalPricing(roomTypeId: number): Observable<SeasonalPricing[]> {
    return this.http.get<SeasonalPricing[]>(`${this.base}/room-types/${roomTypeId}/seasonal-pricing`);
  }

  createSeasonalPricing(roomTypeId: number, req: { name: string; startDate: string; endDate: string; priceMultiplier: number }): Observable<unknown> {
    return this.http.post(`${this.base}/room-types/${roomTypeId}/seasonal-pricing`, req);
  }

  updateSeasonalPricing(id: number, req: { name: string; startDate: string; endDate: string; priceMultiplier: number }): Observable<unknown> {
    return this.http.put(`${this.base}/seasonal-pricing/${id}`, req);
  }

  deleteSeasonalPricing(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/seasonal-pricing/${id}`);
  }
}
