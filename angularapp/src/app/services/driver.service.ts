import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { Driver } from '../models/driver.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DriverService {

  public apiUrl = `${environment.apiURL}/api`;

  /*
   * Emits whenever a driver is added, updated, or deleted.
   * Any component in the SAME app session can subscribe and reload
   * immediately without a page refresh.
   */
  private driversChanged = new Subject<void>();
  driversChanged$ = this.driversChanged.asObservable();

  constructor(private http: HttpClient) { }

  /*
   * Call this after a successful add/update/delete so all
   * subscribed listing components refresh instantly.
   */
  notifyDriversChanged(): void {
    this.driversChanged.next();
  }

  getAllDrivers(): Observable<Driver[]> {
    return this.http.get<Driver[]>(`${this.apiUrl}/driver`);
  }

  getDriverById(driverId: number): Observable<Driver> {
    return this.http.get<Driver>(`${this.apiUrl}/driver/${driverId}`);
  }

  addDriver(driver: Driver): Observable<Driver> {
    return this.http.post<Driver>(`${this.apiUrl}/driver`, driver);
  }

  updateDriver(driverId: number, driver: Driver): Observable<Driver> {
    return this.http.put<Driver>(`${this.apiUrl}/driver/${driverId}`, driver);
  }

  deleteDriver(driverId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/driver/${driverId}`);
  }
}