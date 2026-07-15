import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RoomResponse {
  id: number;
  roomNumber: string;
  floor: number;
  hotelName: string;
  roomTypeName: string;
  category: string;
  basePriceNight: number;
  basePriceHour: number;
  maxGuests: number;
  isActive: boolean;
  allowsVelocity: boolean;
}

export interface RoomAdminResponse {
  id: number;
  hotelId: number;
  hotelName: string;
  roomTypeId: number;
  roomTypeName: string;
  roomNumber: string;
  floor: number;
  status: string;
  statusDisplay: string;
  active: boolean;
  notes: string | null;
}

export interface RoomAdminRequest {
  roomNumber: string;
  floor: number;
  roomTypeId: number;
  status: string;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class RoomService {
  private http = inject(HttpClient);
  private base        = `${environment.apiUrl}/rooms`;
  private managerBase = `${environment.apiUrl}/manager`;

  getRoom(id: number): Observable<RoomResponse> {
    return this.http.get<RoomResponse>(`${this.base}/${id}`);
  }

  listByHotel(hotelId: number): Observable<RoomAdminResponse[]> {
    return this.http.get<RoomAdminResponse[]>(`${this.managerBase}/hotels/${hotelId}/rooms`);
  }

  createRoom(hotelId: number, req: RoomAdminRequest): Observable<RoomAdminResponse> {
    return this.http.post<RoomAdminResponse>(`${this.managerBase}/hotels/${hotelId}/rooms`, req);
  }

  updateRoom(id: number, req: RoomAdminRequest): Observable<RoomAdminResponse> {
    return this.http.put<RoomAdminResponse>(`${this.managerBase}/rooms/${id}`, req);
  }

  deactivateRoom(id: number): Observable<void> {
    return this.http.delete<void>(`${this.managerBase}/rooms/${id}`);
  }
}
