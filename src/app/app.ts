import { Component, HostListener, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  isOffline = false;

  ngOnInit(): void {
    this.isOffline = !navigator.onLine;
  }

  @HostListener('window:online')
  onOnline(): void { this.isOffline = false; }

  @HostListener('window:offline')
  onOffline(): void { this.isOffline = true; }
}
