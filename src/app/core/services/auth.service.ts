import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface JwtResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  email: string;
  fullName: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = `${environment.apiUrl}/auth`;

  isLoggedIn = signal<boolean>(this.hasValidToken());
  currentUser = signal<Partial<JwtResponse> | null>(this.loadUser());

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: LoginRequest): Observable<JwtResponse> {
    return this.http.post<JwtResponse>(`${this.api}/login`, credentials).pipe(
      tap(res => this.saveSession(res))
    );
  }

  saveOAuthSession(data: { accessToken: string; refreshToken: string; email: string; fullName: string; role: string }): void {
    this.saveSession({
      accessToken:  data.accessToken,
      refreshToken: data.refreshToken,
      tokenType:    'Bearer',
      email:        data.email,
      fullName:     data.fullName,
      role:         data.role,
    });
  }

  logout(): void {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      this.http.post(`${this.api}/logout`, { refreshToken }).subscribe();
    }
    this.clearSession();
    this.router.navigate(['/login']);
  }

  get accessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  private saveSession(res: JwtResponse): void {
    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('refreshToken', res.refreshToken);
    localStorage.setItem('user', JSON.stringify({
      email: res.email,
      fullName: res.fullName,
      role: res.role
    }));
    this.isLoggedIn.set(true);
    this.currentUser.set(res);
  }

  private clearSession(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    this.isLoggedIn.set(false);
    this.currentUser.set(null);
  }

  private hasValidToken(): boolean {
    return !!localStorage.getItem('accessToken');
  }

  private loadUser(): Partial<JwtResponse> | null {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  }
}
