import { Injectable, inject, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import * as signalR from '@microsoft/signalr';

import { LogButtonPressRequest } from '../../../shared/models/board-requests.model';
import { BoardDto, ButtonDto } from '../../../shared/models/board.dto.model';
import { BoardActions } from '../../../store/board/board.actions';
import { API_URLS } from '../../../shared/config/api-urls';



@Injectable({ providedIn: 'root' })
export class AacBoardService implements OnDestroy {
  private http = inject(HttpClient);
  private store = inject(Store);

  private hubConnection: signalR.HubConnection;

  constructor() {
    const SIGNALR_HUB = `${API_URLS.aacBoard}/hubs/board`;
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(SIGNALR_HUB)
      .withAutomaticReconnect()
      .build();

    this.registerSignalREvents();
    this.startHub();
  }

  // ── HTTP calls ────────────────────────────────────────────

  getActiveBoard(userId: string): Observable<BoardDto> {
    return this.http.get<BoardDto>(`${API_URLS.aacBoard}/boards/${userId}/active`);
  }

  pressButton(buttonId: string, userId: string): Observable<void> {
    const body: LogButtonPressRequest = { userId, context: '{}' };
    return this.http.post<void>(
      `${API_URLS.aacBoard}/boards/buttons/${buttonId}/press`,
      body
    );
  }

  // ── SignalR ───────────────────────────────────────────────

  private async startHub(): Promise<void> {
    try {
      await this.hubConnection.start();
      console.log('AAC Board SignalR connected');
    } catch (err) {
      console.warn('AAC Board SignalR connection failed (Hub not yet implemented on server):', err);
      // לא זורקים שגיאה — הHub עדיין לא ממומש בשרת
    }
  }

  private registerSignalREvents(): void {
    // השרת ישלח "BoardUpdated" כשלוח משתנה
    this.hubConnection.on('BoardUpdated', (board: BoardDto) => {
      this.store.dispatch(BoardActions.boardUpdatedViaSignalR({ board }));
    });

    // השרת ישלח "ButtonAdded" כשכפתור contextual נוסף (SmartBundle)
    this.hubConnection.on('ButtonAdded', (button: ButtonDto) => {
      this.store.dispatch(BoardActions.buttonAddedViaSignalR({ button }));
    });
  }

  ngOnDestroy(): void {
    this.hubConnection.stop();
  }
}