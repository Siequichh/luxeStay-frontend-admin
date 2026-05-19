import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-oauth2-callback',
  standalone: true,
  template: `
    <div style="display:flex;align-items:center;justify-content:center;min-height:100vh">
      <span style="font-size:1rem;color:var(--text-color-secondary)">Iniciando sesión…</span>
    </div>
  `,
})
export class OAuth2CallbackComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;

    const error        = params.get('error');
    const accessToken  = params.get('token');
    const refreshToken = params.get('refreshToken');
    const fullName     = params.get('fullName') ?? '';
    const email        = params.get('email')    ?? '';
    const role         = params.get('role')     ?? '';

    if (error) {
      this.router.navigate(['/login'], { queryParams: { oauthError: error } });
      return;
    }

    if (!accessToken || !refreshToken) {
      this.router.navigate(['/login']);
      return;
    }

    if (role !== 'ADMIN' && role !== 'HOTEL_MANAGER') {
      this.router.navigate(['/login'], {
        queryParams: { oauthError: 'Acceso denegado. Este panel es exclusivo para administradores y gestores.' }
      });
      return;
    }

    this.auth.saveOAuthSession({ accessToken, refreshToken, email, fullName, role });
    this.router.navigate(['/dashboard']);
  }
}
