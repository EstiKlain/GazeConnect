// features/aac-board/components/contacts/contacts.component.ts
//
// מה הקומפוננט הזה עושה:
// 1. "בחדר עכשיו" — popup אוטומטי כשמגיע PersonDetected חדש
//    מוצג למשך 4 שניות (או עד לחיצה) — כרטיס עם שם ו-avatar
//
// 2. רשימת כל אנשי קשר — נטענת מ-User Profile Service (HTTP)
//    מוצגת כגריד של כפתורים (כמו לוח ה-AAC)
//    לחיצה על כפתור → TTS מדבר את השם
//
// מקור הנתונים:
//   "בחדר עכשיו" ← PersonsState (store, מגיע מ-SignalR)
//   "כל אנשי קשר" ← HTTP GET /contacts (User Profile Service :5004)

import {
  Component, OnInit, OnDestroy, inject,
  ChangeDetectionStrategy, signal
} from '@angular/core';
import { AsyncPipe, NgClass } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { Subscription, distinctUntilChanged, map } from 'rxjs';

import { selectDetectedPersons, DetectedPerson } from '../../../../store/persons/persons.reducer';
import { ContactDto } from '../../../../shared/models/contact.model';
import { TtsService } from '../../../../shared/services/tts.service';
import { API_URLS } from '../../../../shared/config/api-urls';

// userId זמני — יוחלף ב-AuthService בשלב 4
const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';

// כמה שניות ה-popup נשאר פתוח אחרי שלא מזוהה שוב
const POPUP_DURATION_MS = 8000;

@Component({
  selector: 'gc-contacts  ',
  standalone: true,
  imports: [AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contacts.component.html',
  styleUrl: './contacts.component.scss',
})
export class ContactsComponent implements OnInit, OnDestroy {
  private store  = inject(Store);
  private http   = inject(HttpClient);
  private tts    = inject(TtsService);

  // ── "בחדר עכשיו" — מגיע מהstore ─────────────────────────
  detectedPersons$ = this.store.select(selectDetectedPersons);

  // ── כל אנשי הקשר — נטענים מהשרת ─────────────────────────
  allContacts = signal<ContactDto[]>([]);
  loadingContacts = signal(true);
  loadError = signal<string | null>(null);

  // ── Popup — כשנכנס אדם חדש ───────────────────────────────
  popupPerson = signal<DetectedPerson | null>(null);
  private popupTimer?: ReturnType<typeof setTimeout>;
  private sub?: Subscription;

  ngOnInit(): void {
    // טען רשימת אנשי קשר מהשרת
    this.loadContacts();

    // האזן לשינויים ב-detected persons → הצג popup לאחרון שנוסף
    this.sub = this.store.select(selectDetectedPersons).pipe(
      // רק כשמספר האנשים גדל (הגיע אדם חדש)
      map(persons => persons[persons.length - 1]),
      distinctUntilChanged((a, b) => a?.personId === b?.personId)
    ).subscribe(latestPerson => {
      if (!latestPerson) return;
      this.showPopup(latestPerson);
    });
  }

  // ── טעינת אנשי קשר מה-UPS ────────────────────────────────
  private loadContacts(): void {
    this.http.get<ContactDto[]>(
      `${API_URLS.userProfile}/contacts/${DEV_USER_ID}`
    ).subscribe({
      next: contacts => {
        this.allContacts.set(contacts);
        this.loadingContacts.set(false);
      },
      error: () => {
        // בפיתוח — אפשר שהשרת עוד לא רץ
        this.loadError.set('לא ניתן לטעון אנשי קשר');
        this.loadingContacts.set(false);
      }
    });
  }

  // ── Popup ─────────────────────────────────────────────────
  private showPopup(person: DetectedPerson): void {
    clearTimeout(this.popupTimer);
    this.popupPerson.set(person);
    // TTS — מקריא את השם אוטומטית כשמישהו נכנס
    // this.tts.speak(person.name);
    // סוגר אחרי POPUP_DURATION_MS
    this.popupTimer = setTimeout(() => {
      this.popupPerson.set(null);
    }, POPUP_DURATION_MS);
  }

  closePopup(): void {
    clearTimeout(this.popupTimer);
    this.popupPerson.set(null);
  }

  // ── לחיצה על כפתור איש קשר → TTS ─────────────────────────
  speakContact(contact: ContactDto): void {
    this.tts.speak(contact.name);
  }

  // ── לחיצה על כפתור "נוכח בחדר" ───────────────────────────
  speakPerson(person: DetectedPerson): void {
    this.tts.speak(person.name);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    clearTimeout(this.popupTimer);
  }
}