import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GetAllOrdersResponse, SingleOrderResponse } from '../ordersTypes';
import { environment } from '../../../../../environments/environment.prod';



const BASE = `${environment.apiUrl}/orders/admin`;

@Injectable({
  providedIn: 'root',
})
export class OrderService {

    constructor(private http: HttpClient) {}
    
    // headers (بديل interseptors)
    private headers(): HttpHeaders {
    const token = localStorage.getItem('token') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MGJjN2YyMmFhMmNmYTZkNTE1NjFlOCIsIkZpcnN0TmFtZSI6Ik11aGFtbWVkIiwiTGFzdE5hbWUiOiJBbGkiLCJlbWFpbCI6Im11YWxseXl5QGdtYWlsLmNvbSIsImFkZHJlc3NlcyI6W3sibGFiZWwiOiJIb21lIiwiZnVsbE5hbWUiOiJNdWhhbW1lZCBBbGkiLCJwaG9uZSI6IjAxMjI5NTUzNDk5IiwibGluZTEiOiIxNyBNaXNyIExlbCBUYSdtZWVyIEJsZGdzICwgM3JkIFpvbmUiLCJsaW5lMiI6IiIsImNpdHkiOiJTaGVyYXRvbiIsInN0YXRlIjoiQ2Fpcm8iLCJjb3VudHJ5IjoiRWd5cHQiLCJwb3N0YWxDb2RlIjoiMTE3OTkiLCJpc0RlZmF1bHQiOnRydWUsIl9pZCI6IjY5MGUyNWU4Y2U1ZWFkMzUwNmU0MThmZSJ9XSwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzYzMjU2NjUxLCJleHAiOjE3NjMyNjAyNTF9.FIOe-2upsuXZvuy2LfdgsZMMMqiSyHjojC8e4g65CyE'; 
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
    }

  getAll(){
     const headers = this.headers()
    .set('Cache-Control', 'no-cache')
    .set('Pragma', 'no-cache');
     const params = new HttpParams().set('t', Date.now().toString()); // bust cache

     return this.http.get<GetAllOrdersResponse>(`${BASE}`, { headers, params }); 
  }
  cancel(id: string){
     return this.http.post<SingleOrderResponse>(`${BASE}/${id}/cancel`,    {}, { headers: this.headers() }); 
  }
  markPaid(id: string){ return this.http.post<SingleOrderResponse>(`${BASE}/${id}/paid`,      {}, { headers: this.headers() }); 
  }
  markShipped(id: string){
     return this.http.post<SingleOrderResponse>(`${BASE}/${id}/shipped`,   {}, { headers: this.headers() }); 
  }
  markDelivered(id: string){
     return this.http.post<SingleOrderResponse>(`${BASE}/${id}/delivered`, {}, { headers: this.headers() }); 
  }

}
