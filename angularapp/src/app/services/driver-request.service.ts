import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { DriverRequest } from '../models/driver-request.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DriverRequestService {

  public apiUrl = `${environment.apiURL}/api`;

  /*
   * Emits when any request changes (create, update, delete, approve).
   * Used for instant refresh within the SAME app session.
   */
  private requestsChanged = new Subject<void>();
  requestsChanged$ = this.requestsChanged.asObservable();

  constructor(private http: HttpClient) { }

  notifyRequestsChanged(): void {
    this.requestsChanged.next();
  }

  // No Bearer header. The interceptor sends the HttpOnly cookie automatically.

  addDriverRequest(driverRequest: DriverRequest): Observable<DriverRequest> {
    return this.http.post<DriverRequest>(`${this.apiUrl}/driverRequest`, driverRequest);
  }

  getAllDriverRequests(): Observable<DriverRequest[]> {
    return this.http.get<DriverRequest[]>(`${this.apiUrl}/driverRequest`);
  }

  getDriverRequestById(driverRequestId: number): Observable<DriverRequest> {
    return this.http.get<DriverRequest>(`${this.apiUrl}/driverRequest/${driverRequestId}`);
  }

  getDriverRequestsByUserId(userId: number): Observable<DriverRequest[]> {
    return this.http.get<DriverRequest[]>(`${this.apiUrl}/driverRequest/user/${userId}`);
  }

  getDriverRequestsByDriverId(driverId: number): Observable<DriverRequest[]> {
    return this.http.get<DriverRequest[]>(`${this.apiUrl}/driverRequest/driver/${driverId}`);
  }

  updateDriverRequest(
    driverRequestId: number,
    driverRequest: DriverRequest
  ): Observable<DriverRequest> {
    return this.http.put<DriverRequest>(
      `${this.apiUrl}/driverRequest/${driverRequestId}`,
      driverRequest
    );
  }

  deleteDriverRequest(driverRequestId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/driverRequest/${driverRequestId}`);
  }
}
