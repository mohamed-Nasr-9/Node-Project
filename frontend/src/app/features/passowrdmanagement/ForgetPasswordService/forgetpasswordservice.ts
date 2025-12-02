import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment.prod';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class Forgetpasswordservice {
  private apiUrl = `${environment.apiUrl}/auth/forgot-password`;
  constructor(private http:HttpClient){}
  forgotPassword(email:string): Observable<any>{
    return this.http.post(this.apiUrl, { email });
  }
}
