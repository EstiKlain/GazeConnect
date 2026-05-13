import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GazeOverlayComponent } from './gaze-overlay.component';

describe('GazeOverlayComponent', () => {
  let component: GazeOverlayComponent;
  let fixture: ComponentFixture<GazeOverlayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GazeOverlayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GazeOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
