import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.prod';
export interface ChatMessageRequest {
  message: string;
}

export interface ChatMessageResponse {
  reply: string;
}

@Injectable({
  providedIn: 'root',
})
export class ChatbotService {
  private readonly API_URL = environment.apiUrl + '/chat';

  constructor(private http: HttpClient) {}

  sendMessage(message: string): Observable<ChatMessageResponse> {
    const request: ChatMessageRequest = { message };
    return this.http.post<ChatMessageResponse>(this.API_URL, request);
  }
}

