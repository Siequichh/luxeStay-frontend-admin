import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface HotelResponse {
  id:             number;
  name:           string;
  description:    string;
  address:        string;
  // Ubicación (ubigeo)
  ubigeoId:       number;
  reniecCode:     string;
  departmentCode: string;
  departmentName: string;
  provinceCode:   string;
  provinceName:   string;
  districtName:   string;
  // Gestor
  managerId:      number | null;
  managerName:    string | null;
  // Resto
  timezone:       string;
  starRating:     number | null;
  latitude:       number | null;
  longitude:      number | null;
  active:         boolean;
  roomTypeCount:  number;
  roomCount:      number;
}

export interface UpdateHotelRequest {
  name?:        string;
  description?: string;
  address?:     string;
  reniecCode?:  string;
  starRating?:  number;
  latitude?:    number | null;
  longitude?:   number | null;
}

export interface CreateHotelRequest {
  name:        string;
  description: string;
  address:     string;
  reniecCode:  string;
  starRating?: number;
  latitude?:   number | null;
  longitude?:  number | null;
  timezone?:   string;
}

@Injectable({ providedIn: 'root' })
export class HotelService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin/hotels`;

  getAll(): Observable<HotelResponse[]> {
    return this.http.get<HotelResponse[]>(this.base);
  }

  getById(id: number): Observable<HotelResponse> {
    return this.http.get<HotelResponse>(`${this.base}/${id}`);
  }

  getMyHotels(): Observable<HotelResponse[]> {
    return this.http.get<HotelResponse[]>(`${environment.apiUrl}/manager/hotels`);
  }

  assignManager(hotelId: number, userId: number): Observable<HotelResponse> {
    return this.http.patch<HotelResponse>(`${this.base}/${hotelId}/manager/${userId}`, {});
  }

  removeManager(hotelId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${hotelId}/manager`);
  }

  updateHotel(id: number, req: UpdateHotelRequest): Observable<HotelResponse> {
    return this.http.put<HotelResponse>(`${this.base}/${id}`, req);
  }

  updateMyHotel(id: number, req: UpdateHotelRequest): Observable<HotelResponse> {
    return this.http.put<HotelResponse>(`${environment.apiUrl}/manager/hotels/${id}`, req);
  }

  create(req: CreateHotelRequest): Observable<HotelResponse> {
    return this.http.post<HotelResponse>(this.base, req);
  }

  deactivate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
