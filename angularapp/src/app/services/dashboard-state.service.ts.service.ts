import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardStateService {

  private rotationSource = new BehaviorSubject<number>(0);
  private viewSource = new BehaviorSubject<string>('home');

  currentRotation$ = this.rotationSource.asObservable();
  activeView$ = this.viewSource.asObservable();

  setView(view: string, rotation: number): void {
    this.viewSource.next(view);
    this.rotationSource.next(rotation);
  }
}