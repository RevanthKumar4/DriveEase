import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Feedback } from '../models/feedback.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {

  public apiUrl = `${environment.apiURL}/api`;

  constructor(private http: HttpClient) { }



  sendFeedback(feedback: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/feedback`, feedback);
  }

  getAllFeedbacksByUserId(userId: number): Observable<Feedback[]> {
    return this.http.get<Feedback[]>(`${this.apiUrl}/feedback/user/${userId}`);
  }

  getFeedbacks(): Observable<Feedback[]> {
    return this.http.get<Feedback[]>(`${this.apiUrl}/feedback`);
  }

  getFeedbackById(feedbackId: number): Observable<Feedback> {
    return this.http.get<Feedback>(`${this.apiUrl}/feedback/${feedbackId}`);
  }

  deleteFeedback(feedbackId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/feedback/${feedbackId}`);
  }
}