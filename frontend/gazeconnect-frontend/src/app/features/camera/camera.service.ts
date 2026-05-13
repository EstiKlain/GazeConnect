// features/camera/camera.service.ts
// אחראי על:
// 1. שליחת frames מהמצלמה → CameraHub (/hubs/frame)
// 2. קבלת FaceDetected events ← CameraHub (/hubs/camera)
//
// שני חיבורים נפרדים — כי שני Hubs שונים בשרת.
// זה לא מפתיע — AacBoardService עושה אותו דבר עם /hubs/board.

import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import * as signalR from '@microsoft/signalr';
import { FaceDetectionResultDto } from '../../shared/models/face-detection.model';

import { API_URLS } from '../../shared/config/api-urls';

@Injectable({ providedIn: 'root' })
export class CameraService implements OnDestroy {

  // ── Hub לשליחת frames ────────────────────────────────────
  private frameHub: signalR.HubConnection;

  // ── Hub לקבלת זיהוי פנים ────────────────────────────────
  private cameraHub: signalR.HubConnection;

  // ── Stream של תוצאות זיהוי — PersonsEffects מאזין לזה ──
  // Subject פנימי — לא חשוף החוצה ישירות
  private faceDetected$ = new Subject<FaceDetectionResultDto>();
  readonly faceEvents$ = this.faceDetected$.asObservable();

  constructor() {
    this.frameHub = new signalR.HubConnectionBuilder()
      .withUrl(`${API_URLS.cameraHub}/hubs/frame`)
      .withAutomaticReconnect()
      .build();

    this.cameraHub = new signalR.HubConnectionBuilder()
      .withUrl(`${API_URLS.cameraHub}/hubs/camera`)
      .withAutomaticReconnect()
      .build();

    this.registerCameraEvents();
    this.startHubs();
  }

  // ── התחלת המצלמה + שליחת frames ─────────────────────────
  async startCamera(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    const video = document.createElement('video');
    video.srcObject = stream;
    await video.play();

    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;

    // שולח frame כל 100ms (10fps) — מספיק לזיהוי פנים
    setInterval(() => {
      canvas.getContext('2d')!.drawImage(video, 0, 0);
      const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      this.frameHub.invoke('SendFrame', base64).catch(() => {
        // שרת לא זמין — לא נזרוק שגיאה
      });
    }, 100);
  }

  // ── רישום לאירועי זיהוי פנים ─────────────────────────────
  private registerCameraEvents(): void {
    // FaceDetected מגיע מ-CameraSignalRHub כשPython מזהה פנים
    this.cameraHub.on('FaceDetected', (result: FaceDetectionResultDto) => {
      this.faceDetected$.next(result);
    });
  }

  private async startHubs(): Promise<void> {
    try {
      await this.frameHub.start();
    } catch {
      console.warn('Frame hub connection failed');
    }
    try {
      await this.cameraHub.start();
    } catch {
      console.warn('Camera hub connection failed');
    }
  }

  ngOnDestroy(): void {
    this.frameHub.stop();
    this.cameraHub.stop();
  }
}