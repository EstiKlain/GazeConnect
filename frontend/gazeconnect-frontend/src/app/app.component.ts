import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CameraService } from './features/camera/camera.service';
import { EyeTrackingService } from './shared/services/eye-tracking.service';
import { GazeOverlayComponent } from './features/aac-board/components/gaze-overlay/gaze-overlay.component';
import { ScanningModeComponent } from './features/aac-board/components/scanning-mode/scanning-mode.component';
import { CalibrationService } from './shared/services/calibration.service';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, GazeOverlayComponent, ScanningModeComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'gazeconnect-frontend';

  private cameraService = inject(CameraService);
  private eyeTracking = inject(EyeTrackingService);
  private calibrationService = inject(CalibrationService);
  async ngOnInit(): Promise<void> {
    await this.calibrationService.loadFromServer(); // ← טוען כיול קודם
    await this.cameraService.startCamera();// מתחיל את שירות המצלמה ברגע שהאפליקציה עולה
    this.eyeTracking.start();// מתחיל את שירות מעקב העיניים ברגע שהמצלמה פעילה

  }
}