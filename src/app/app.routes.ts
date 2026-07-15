import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'oauth2/callback',
    loadComponent: () =>
      import('./features/auth/oauth2-callback/oauth2-callback.component').then(m => m.OAuth2CallbackComponent)
  },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'bookings',
        loadComponent: () =>
          import('./features/bookings/bookings.component').then(m => m.BookingsComponent)
      },
      {
        path: 'rooms',
        loadComponent: () =>
          import('./features/rooms/rooms.component').then(m => m.RoomsComponent)
      },
      {
        path: 'users',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/users/users.component').then(m => m.UsersComponent)
      },
      {
        path: 'hotels',
        loadComponent: () =>
          import('./features/hotels/hotels.component').then(m => m.HotelsComponent)
      },
      {
        path: 'room-types',
        loadComponent: () =>
          import('./features/room-types/room-types.component').then(m => m.RoomTypesComponent)
      },
      {
        path: 'checkin',
        loadComponent: () =>
          import('./features/checkin/checkin.component').then(m => m.CheckinComponent)
      },
      {
        path: 'pricing',
        loadComponent: () =>
          import('./features/pricing/pricing.component').then(m => m.PricingComponent)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
