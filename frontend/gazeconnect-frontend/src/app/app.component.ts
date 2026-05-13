import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CameraService } from './features/camera/camera.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'gazeconnect-frontend';

  constructor(private cameraService: CameraService) {}

  async ngOnInit(): Promise<void> {
    await this.cameraService.startCamera();
  }
}