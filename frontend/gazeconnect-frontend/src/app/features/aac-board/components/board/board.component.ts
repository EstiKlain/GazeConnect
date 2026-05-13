// board.component.ts
import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';

import { BoardActions } from '../../../../store/board/board.actions';
import { selectVisibleButtons, selectLayout, selectLoading, selectError } from '../../../../store/board/board.selectors';
import { AacButtonComponent } from '../aac-button/aac-button.component';
import { ButtonDto } from '../../../../shared/models/board.dto.model';
import { TtsService } from '../../../../shared/services/tts.service';
import { map } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
 import { selectScanningActive, selectActiveIndex }                        from '../../../../store/scanning/scanning.reducer';
import { ContactsComponent }              from '../contacts/contacts.component';
// userId זמני לפיתוח — יוחלף ב-AuthService בשלב 4
const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';

@Component({
  selector: 'gc-board',
  standalone: true,
  imports: [CommonModule, AsyncPipe, AacButtonComponent, ContactsComponent ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl:'./board.component.html' ,
  styleUrl: './board.component.scss',
})
export class BoardComponent implements OnInit {
  private store = inject(Store);
  private tts   = inject(TtsService);

  buttons$ = this.store.select(selectVisibleButtons);
  layout$  = this.store.select(selectLayout);
  loading$ = this.store.select(selectLoading);
  error$   = this.store.select(selectError);
  isScanningActive$ = this.store.select(selectScanningActive);
  activeIndex$      = this.store.select(selectActiveIndex);

  ngOnInit(): void {
    this.store.dispatch(BoardActions.loadBoard({ userId: DEV_USER_ID }));
  }

  //להרצה רק של אנגולר בלי backend
//   ngOnInit(): void {
//   // Mock data לפיתוח — למחוק אחרי שה-backend עולה
//   this.store.dispatch(BoardActions.loadBoardSuccess({
//     board: {
//       id: '1', userId: DEV_USER_ID, name: 'לוח ראשי',
//       layout: JSON.stringify({ columns: 3, maxButtons: 6, buttonSize: 'large' }),
//       buttons: [
//         { id: '1', boardId: '1', text: 'אמא', category: 'person', icon: null, ttsText: 'אמא', isContextual: true, personId: null, createdAt: '' },
//         { id: '2', boardId: '1', text: 'מים', category: 'need', icon: null, ttsText: 'מים', isContextual: false, personId: null, createdAt: '' },
//         { id: '3', boardId: '1', text: 'אוכל', category: 'need', icon: null, ttsText: 'אוכל', isContextual: false, personId: null, createdAt: '' },
//         { id: '4', boardId: '1', text: 'כן', category: 'response', icon: null, ttsText: 'כן', isContextual: false, personId: null, createdAt: '' },
//         { id: '5', boardId: '1', text: 'לא', category: 'response', icon: null, ttsText: 'לא', isContextual: false, personId: null, createdAt: '' },
//         { id: '6', boardId: '1', text: 'עזרה', category: 'need', icon: null, ttsText: 'עזרה', isContextual: false, personId: null, createdAt: '' },
//       ],
//       createdAt: '', updatedAt: ''
//     }
//   }));
// }

  onButtonClick(button: ButtonDto): void {
    // 1. TTS מיידי — לא מחכה לתגובת השרת
    this.tts.speakButton(button.text, button.ttsText);

    // 2. dispatch לstore → effect שולח לשרת
    this.store.dispatch(BoardActions.buttonPressed({
      buttonId: button.id,
      userId:   DEV_USER_ID,
    }));
  }

  retry(): void {
    this.store.dispatch(BoardActions.loadBoard({ userId: DEV_USER_ID }));
  }
}