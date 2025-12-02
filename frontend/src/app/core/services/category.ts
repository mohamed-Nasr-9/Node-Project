import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.prod';
@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly API_URL = environment.apiUrl + '/categories';

  constructor(private http: HttpClient) {}

  // Fetch all categories
  getCategories(): Observable<any[]> {
    return this.http.get<any[]>(this.API_URL);
  }
}
