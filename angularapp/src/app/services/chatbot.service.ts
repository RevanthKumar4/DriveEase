import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatbotRequest {
  message: string;
}

export interface ChatbotResponse {
  response: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {

  private readonly apiUrl =
    'https://ide-fffaafaaedfafebebbadfcfdab.premiumproject.examly.io/proxy/8080/api/chatbot/ask';

  constructor(private http: HttpClient) {
  }

  askQuestion(message: string): Observable<ChatbotResponse> {
    const requestBody: ChatbotRequest = {
      message: message.trim()
    };

    return this.http.post<ChatbotResponse>(
      this.apiUrl,
      requestBody
    );
  }
}