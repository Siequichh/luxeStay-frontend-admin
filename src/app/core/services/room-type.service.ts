import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RoomTypeResponse {
  id:              number;
  hotelId:         number;
  hotelName:       string;
  name:            string;
  category:        string;
  categoryDisplay: string;
  description:     string;
  maxGuests:       number;
  areaSqm:         number;
  basePriceNight:  number;
  basePriceHour:   number | null;
  allowsVelocity:  boolean;
  thumbnailUrl:    string | null;
  active:          boolean;
  amenities:       string[];
  images:          string[];
  roomCount:       number;
}

export interface RoomTypeRequest {
  name:              string;
  category:          string;
  description:       string;
  maxGuests:         number;
  areaSqm:           number;
  basePriceNight:    number;
  basePriceHour?:    number;
  allowsVelocity:    boolean;
  amenityIds?:       number[];
  imageUrls?:        string[];
  primaryImageIndex?: number;
}

@Injectable({ providedIn: 'root' })
export class RoomTypeService {
  private http = inject(HttpClient);
  private readonly managerBase = `${environment.apiUrl}/manager`;

  listByHotel(hotelId: number): Observable<RoomTypeResponse[]> {
    return this.http.get<RoomTypeResponse[]>(`${this.managerBase}/hotels/${hotelId}/room-types`);
  }

  create(hotelId: number, req: RoomTypeRequest): Observable<RoomTypeResponse> {
    return this.http.post<RoomTypeResponse>(`${this.managerBase}/hotels/${hotelId}/room-types`, req);
  }

  update(id: number, req: RoomTypeRequest): Observable<RoomTypeResponse> {
    return this.http.put<RoomTypeResponse>(`${this.managerBase}/room-types/${id}`, req);
  }

  deactivate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.managerBase}/room-types/${id}`);
  }
}
