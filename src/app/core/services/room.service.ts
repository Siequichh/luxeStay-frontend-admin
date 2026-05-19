import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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

@Injectable({ providedIn: 'root' })
export class RoomService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/rooms`;

  getRoom(id: number): Observable<RoomResponse> {
    return this.http.get<RoomResponse>(`${this.base}/${id}`);
  }
}
