import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ImageService {
  private http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/manager/images`;

  /** Sube un archivo al backend que lo almacena en Cloudinary. Retorna la URL segura. */
  upload(file: File): Observable<string> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ url: string }>(this.endpoint, form).pipe(map(r => r.url));
  }
}
