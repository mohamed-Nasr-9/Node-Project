import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment.prod';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Profileservice {
  private apiUrl = `${environment.apiUrl}/profile`;
  private apiUrll = `${environment.apiUrl}/auth`;

  constructor(
    private http: HttpClient
  ) {}

  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/getprofile`);
  }

  updateProfile(updateData: { FirstName?: string; LastName?: string; email?: string }): Observable<any> {
    return this.http.patch(`${this.apiUrl}/updateprofile`, updateData);
  }

  deleteAccount(password: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/deleteprofile`, {
      body: { password }
    });
  }

  addAddress(addressData: {
    label?: string;
    fullName?: string;
    phone?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    isDefault?: boolean;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/addaddress`, addressData);
  }

  updateAddress(addressData: {
    addressId?: string;
    addressIndex?: number;
    label?: string;
    fullName?: string;
    phone?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    isDefault?: boolean;
  }): Observable<any> {
    return this.http.patch(`${this.apiUrl}/updateaddress`, addressData);
  }

  deleteAddress(addressData: {
    addressId?: string;
    addressIndex?: number;
  }): Observable<any> {
    return this.http.delete(`${this.apiUrl}/deleteaddress`, {
      body: addressData
    });
  }

  changePassword(passwordData: {
    old_password: string;
    new_password: string;
    confirm_password: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrll}/change-password`, passwordData);
  }

  getUserOrders(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/orders`);
  }
}
