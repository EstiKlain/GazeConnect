// board.component.ts
import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { RouterLink } from '@angular/router';
import { BoardActions } from '../../../../store/board/board.actions';
import { selectVisibleButtons, selectLayout, selectLoading, selectError } from '../../../../store/board/board.selectors';
import { AacButtonComponent } from '../aac-button/aac-button.component';
import { ButtonDto } from '../../../../shared/models/board.dto.model';
import { TtsService } from '../../../../shared/services/tts.service';
import { selectScanningActive, selectActiveIndex } from '../../../../store/scanning/scanning.reducer';
import { ContactsComponent } from '../contacts/contacts.component';
// userId זמני לפיתוח — יוחלף ב-AuthService בשלב 4
const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';

@Component({
  selector: 'gc-board',
  standalone: true,
  imports: [CommonModule, AsyncPipe, AacButtonComponent, ContactsComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss',
})
export class BoardComponent implements OnInit {
  private store = inject(Store);
  private tts = inject(TtsService);

  buttons$ = this.store.select(selectVisibleButtons);
  layout$ = this.store.select(selectLayout);
  loading$ = this.store.select(selectLoading);
  error$ = this.store.select(selectError);
  isScanningActive$ = this.store.select(selectScanningActive);
  activeIndex$ = this.store.select(selectActiveIndex);
  sentence = '';


  // ngOnInit(): void {
  //   this.store.dispatch(BoardActions.loadBoard({ userId: DEV_USER_ID }));
  // }

  //להרצה רק של אנגולר בלי backend
  ngOnInit(): void {
    this.store.dispatch(BoardActions.loadBoardSuccess({
      board: {
        id: '1', userId: DEV_USER_ID, name: 'לוח ראשי',
        layout: JSON.stringify({ columns: 6, maxButtons: 30, buttonSize: 'large' }),
        buttons: [
          // שורת קטגוריות
          { id: 'c1', boardId: '1', text: 'פעלים', category: 'verb', icon: 'https://static.arasaac.org/pictograms/6385/6385_300.png', ttsText: 'פעלים', isContextual: false, personId: null, createdAt: '' },
          { id: 'c2', boardId: '1', text: 'שמות עצם', category: 'noun', icon: 'https://static.arasaac.org/pictograms/2709/2709_300.png', ttsText: 'שמות עצם', isContextual: false, personId: null, createdAt: '' },
          { id: 'c3', boardId: '1', text: 'אנשים', category: 'person', icon: 'https://static.arasaac.org/pictograms/8418/8418_300.png', ttsText: 'אנשים', isContextual: false, personId: null, createdAt: '' },
          { id: 'c4', boardId: '1', text: 'רגשות', category: 'verb', icon: 'https://static.arasaac.org/pictograms/5787/5787_300.png', ttsText: 'רגשות', isContextual: false, personId: null, createdAt: '' },
          { id: 'c5', boardId: '1', text: 'מקומות', category: 'noun', icon: 'https://static.arasaac.org/pictograms/6564/6564_300.png', ttsText: 'מקומות', isContextual: false, personId: null, createdAt: '' },
          { id: 'c6', boardId: '1', text: 'עוד', category: 'misc', icon: 'https://static.arasaac.org/pictograms/7288/7288_300.png', ttsText: 'עוד', isContextual: false, personId: null, createdAt: '' },
          // שורה 1
          { id: 'b1', boardId: '1', text: 'ללכת', category: 'verb', icon: 'https://static.arasaac.org/pictograms/6385/6385_300.png', ttsText: 'ללכת', isContextual: false, personId: null, createdAt: '' },
          { id: 'b2', boardId: '1', text: 'לאכול', category: 'verb', icon: 'https://static.arasaac.org/pictograms/27646/27646_300.png', ttsText: 'לאכול', isContextual: false, personId: null, createdAt: '' },
          { id: 'b3', boardId: '1', text: 'לשתות', category: 'verb', icon: 'https://static.arasaac.org/pictograms/28398/28398_300.png', ttsText: 'לשתות', isContextual: false, personId: null, createdAt: '' },
          { id: 'b4', boardId: '1', text: 'לישון', category: 'verb', icon: 'https://static.arasaac.org/pictograms/6645/6645_300.png', ttsText: 'לישון', isContextual: false, personId: null, createdAt: '' },
          { id: 'b5', boardId: '1', text: 'לשחק', category: 'verb', icon: 'https://static.arasaac.org/pictograms/6456/6456_300.png', ttsText: 'לשחק', isContextual: false, personId: null, createdAt: '' },
          { id: 'b6', boardId: '1', text: 'לעזור', category: 'verb', icon: 'https://static.arasaac.org/pictograms/6635/6635_300.png', ttsText: 'לעזור', isContextual: false, personId: null, createdAt: '' },
          // שורה 2
          { id: 'b7', boardId: '1', text: 'מים', category: 'noun', icon: 'https://static.arasaac.org/pictograms/2709/2709_300.png', ttsText: 'מים', isContextual: false, personId: null, createdAt: '' },
          { id: 'b8', boardId: '1', text: 'אוכל', category: 'noun', icon: 'https://static.arasaac.org/pictograms/6343/6343_300.png', ttsText: 'אוכל', isContextual: false, personId: null, createdAt: '' },
          { id: 'b9', boardId: '1', text: 'בית', category: 'noun', icon: 'https://static.arasaac.org/pictograms/6564/6564_300.png', ttsText: 'בית', isContextual: false, personId: null, createdAt: '' },
          { id: 'b10', boardId: '1', text: 'בית ספר', category: 'noun', icon: 'https://static.arasaac.org/pictograms/6439/6439_300.png', ttsText: 'בית ספר', isContextual: false, personId: null, createdAt: '' },
          { id: 'b11', boardId: '1', text: 'כדור', category: 'noun', icon: 'https://static.arasaac.org/pictograms/6456/6456_300.png', ttsText: 'כדור', isContextual: false, personId: null, createdAt: '' },
          { id: 'b12', boardId: '1', text: 'ספר', category: 'noun', icon: 'https://static.arasaac.org/pictograms/6439/6439_300.png', ttsText: 'ספר', isContextual: false, personId: null, createdAt: '' },
          // שורה 3 — אנשים
          { id: 'b13', boardId: '1', text: 'אמא', category: 'person', icon: 'https://static.arasaac.org/pictograms/8418/8418_300.png', ttsText: 'אמא', isContextual: true, personId: null, createdAt: '' },
          { id: 'b14', boardId: '1', text: 'אבא', category: 'person', icon: 'https://static.arasaac.org/pictograms/8417/8417_300.png', ttsText: 'אבא', isContextual: true, personId: null, createdAt: '' },
          { id: 'b15', boardId: '1', text: 'מורה', category: 'person', icon: 'https://static.arasaac.org/pictograms/6635/6635_300.png', ttsText: 'מורה', isContextual: false, personId: null, createdAt: '' },
          { id: 'b16', boardId: '1', text: 'חבר', category: 'person', icon: 'https://static.arasaac.org/pictograms/8418/8418_300.png', ttsText: 'חבר', isContextual: false, personId: null, createdAt: '' },
          { id: 'b17', boardId: '1', text: 'אני', category: 'person', icon: 'https://static.arasaac.org/pictograms/5787/5787_300.png', ttsText: 'אני', isContextual: false, personId: null, createdAt: '' },
          { id: 'b18', boardId: '1', text: 'את/ה', category: 'person', icon: 'https://static.arasaac.org/pictograms/5787/5787_300.png', ttsText: 'אתה', isContextual: false, personId: null, createdAt: '' },
          // שורה 4 — רגשות
          { id: 'b19', boardId: '1', text: 'שמח', category: 'verb', icon: 'https://static.arasaac.org/pictograms/5787/5787_300.png', ttsText: 'שמח', isContextual: false, personId: null, createdAt: '' },
          { id: 'b20', boardId: '1', text: 'עצוב', category: 'verb', icon: 'https://static.arasaac.org/pictograms/5790/5790_300.png', ttsText: 'עצוב', isContextual: false, personId: null, createdAt: '' },
          { id: 'b21', boardId: '1', text: 'כואב', category: 'verb', icon: 'https://static.arasaac.org/pictograms/6343/6343_300.png', ttsText: 'כואב', isContextual: false, personId: null, createdAt: '' },
          { id: 'b22', boardId: '1', text: 'עייף', category: 'verb', icon: 'https://static.arasaac.org/pictograms/6645/6645_300.png', ttsText: 'עייף', isContextual: false, personId: null, createdAt: '' },
          { id: 'b23', boardId: '1', text: 'כן', category: 'misc', icon: 'https://static.arasaac.org/pictograms/7288/7288_300.png', ttsText: 'כן', isContextual: false, personId: null, createdAt: '' },
          { id: 'b24', boardId: '1', text: 'לא', category: 'misc', icon: 'https://static.arasaac.org/pictograms/7288/7288_300.png', ttsText: 'לא', isContextual: false, personId: null, createdAt: '' },
        ],
        createdAt: '', updatedAt: ''
      }
    }));

  }

  onButtonClick(button: ButtonDto): void {
    // 1. TTS מיידי — לא מחכה לתגובת השרת
    this.sentence = (this.sentence + ' ' + button.text).trim();
    this.tts.speakButton(button.text, button.ttsText);

    // 2. dispatch לstore → effect שולח לשרת
    this.store.dispatch(BoardActions.buttonPressed({
      buttonId: button.id,
      userId: DEV_USER_ID,
    }));
  }

  retry(): void {
    this.store.dispatch(BoardActions.loadBoard({ userId: DEV_USER_ID }));
  }

  undo(): void {
    const words = this.sentence.trim().split(' ');
    words.pop();
    this.sentence = words.join(' ');
  }

  speak(): void {
    if (!this.sentence) return;
    const utt = new SpeechSynthesisUtterance(this.sentence);
    utt.lang = 'he-IL';
    speechSynthesis.speak(utt);
  }

}