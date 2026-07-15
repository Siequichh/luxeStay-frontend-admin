import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BookingResponse } from './booking.service';

@Injectable({ providedIn: 'root' })
export class CheckinService {
  private base = `${environment.apiUrl}/manager`;

  constructor(private http: HttpClient) {}

  preview(token: string): Observable<BookingResponse> {
    return this.http.get<BookingResponse>(`${this.base}/checkin/${token}`);
  }

  previewByRef(referenceCode: string): Observable<BookingResponse> {
    return this.http.get<BookingResponse>(`${this.base}/checkin/by-ref/${referenceCode}`);
  }

  confirm(token: string): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(`${this.base}/checkin`, { token });
  }
}
