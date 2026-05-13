import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CameraService } from './features/camera/camera.service';
import { GazeOverlayComponent }   from './features/aac-board/components/gaze-overlay/gaze-overlay.component';
import { ScanningModeComponent }  from './features/aac-board/components/scanning-mode/scanning-mode.component';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, GazeOverlayComponent, ScanningModeComponent],
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