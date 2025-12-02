import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.prod';
@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private readonly API_URL = environment.apiUrl + '/upload';

  constructor(private http: HttpClient) {}

  uploadImage(bookId: string, file: File): Observable<any> {
    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    console.log('Uploading image:', {
      bookId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size
    });

    const formData = new FormData();
    formData.append('image', file, file.name);
    
    // Verify FormData contents
    console.log('FormData entries:');
    for (const pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }
    
    // Don't set Content-Type header - let browser set it with boundary
    return this.http.post(`${this.API_URL}/image/${bookId}`, formData, {
      reportProgress: false
    });
  }

  uploadPdf(bookId: string, file: File): Observable<any> {
    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file type
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      throw new Error('File must be a PDF');
    }

    console.log('Uploading PDF:', {
      bookId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size
    });

    const formData = new FormData();
    formData.append('book', file, file.name);
    
    // Verify FormData contents
    console.log('FormData entries:');
    for (const pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }
    
    // Don't set Content-Type header - let browser set it with boundary
    return this.http.post(`${this.API_URL}/book/${bookId}`, formData, {
      reportProgress: false
    });
  }
}

