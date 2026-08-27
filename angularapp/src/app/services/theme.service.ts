import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  private readonly storageKey = 'driveu-theme';
  private readonly darkThemeName = 'dark';
  private readonly lightThemeName = 'warm-stone';

  private darkMode = new BehaviorSubject<boolean>(
    this.getInitialTheme()
  );

  isDarkMode$ = this.darkMode.asObservable();

  get isDarkMode(): boolean {
    return this.darkMode.value;
  }

  toggle(): void {
    const nextMode = !this.darkMode.value;

    this.darkMode.next(nextMode);

    localStorage.setItem(
      this.storageKey,
      nextMode
        ? this.darkThemeName
        : this.lightThemeName
    );
  }

  private getInitialTheme(): boolean {
    const savedTheme = localStorage.getItem(this.storageKey);

    if (savedTheme === this.lightThemeName || savedTheme === 'light') {
      return false;
    }

    return true;
  }
}