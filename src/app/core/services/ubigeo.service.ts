import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DepartmentOption {
  code: string;
  name: string;
}

export interface ProvinceOption {
  code: string;
  name: string;
}

export interface UbigeoItem {
  id: number;
  reniecCode: string;
  departmentCode: string;
  departmentName: string;
  provinceCode: string;
  provinceName: string;
  districtCode: string;
  districtName: string;
  country: string;
}

@Injectable({ providedIn: 'root' })
export class UbigeoService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/ubigeo`;

  getDepartments(): Observable<DepartmentOption[]> {
    return this.http.get<DepartmentOption[]>(`${this.base}/departments`);
  }

  getProvinces(depCode: string): Observable<ProvinceOption[]> {
    const params = new HttpParams().set('dep', depCode);
    return this.http.get<ProvinceOption[]>(`${this.base}/provinces`, { params });
  }

  getDistricts(depCode: string, provCode: string): Observable<UbigeoItem[]> {
    const params = new HttpParams().set('dep', depCode).set('prov', provCode);
    return this.http.get<UbigeoItem[]>(`${this.base}/districts`, { params });
  }

  search(query: string): Observable<UbigeoItem[]> {
    const params = new HttpParams().set('name', query);
    return this.http.get<UbigeoItem[]>(`${this.base}/search`, { params });
  }
}
