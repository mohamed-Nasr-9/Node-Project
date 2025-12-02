import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment.prod';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Restoreaccountservice {
  private apiUrl = `${environment.apiUrl}/profile`;

  constructor(private http: HttpClient) {}

  requestRestoreAccount(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/request-restore`, { email });
  }

  restoreAccount(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/restore/${token}`);
  }
}

