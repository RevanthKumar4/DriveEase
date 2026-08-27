import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-error',
  templateUrl: './error.component.html',
  styleUrls: ['./error.component.css']
})
export class ErrorComponent implements OnInit, OnDestroy {

  isDarkMode: boolean = true;

  private themeSub?: Subscription;

  constructor(private theme: ThemeService) { }

  ngOnInit(): void {
    this.themeSub = this.theme.isDarkMode$.subscribe(value => {
      this.isDarkMode = value;
    });
  }

  ngOnDestroy(): void {
    this.themeSub?.unsubscribe();
  }
}