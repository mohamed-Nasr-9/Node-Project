import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment.prod';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Resetpasswordservice {
  private apiUrl = `${environment.apiUrl}/auth/reset-password`;
  
  constructor(private http: HttpClient) {}
  
  resetPassword(token: string, password: string): Observable<any> {
    // Send token in URL path and password in body (matching backend route: /reset-password/:token)
    return this.http.post(`${this.apiUrl}/${token}`, { password });
  }
}

