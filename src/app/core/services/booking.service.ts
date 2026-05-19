import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BookingResponse {
  id: number;
  referenceCode: string;
  status: string;
  bookingType: string;
  checkInDate: string;
  checkOutDate: string;
  numGuests: number;
  totalAmount: number;
  currency: string;
  roomNumber: string;
  roomTypeName: string;
  hotelName: string;
  guestName: string;
  guestEmail: string;
  createdAt: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly adminApi = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  getAllBookings(page = 0, size = 20): Observable<Page<BookingResponse>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', 'createdAt,desc');
    return this.http.get<Page<BookingResponse>>(`${this.adminApi}/bookings`, { params });
  }

  getBookingById(id: number): Observable<BookingResponse> {
    return this.http.get<BookingResponse>(`${this.adminApi}/bookings/${id}`);
  }
}
