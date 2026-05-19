import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserSummary {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  role: string;
  authProvider: string;
  active: boolean;
  emailVerified: boolean;
  createdAt: string;
}

export interface CreateUserRequest {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  role: 'ADMIN' | 'HOTEL_MANAGER';
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly api = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  listUsers(): Observable<UserSummary[]> {
    return this.http.get<UserSummary[]>(`${this.api}/users`);
  }

  createUser(req: CreateUserRequest): Observable<UserSummary> {
    return this.http.post<UserSummary>(`${this.api}/users`, req);
  }
}
