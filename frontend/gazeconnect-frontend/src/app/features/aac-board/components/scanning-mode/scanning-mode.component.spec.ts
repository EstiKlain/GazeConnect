import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScanningModeComponent } from './scanning-mode.component';

describe('ScanningModeComponent', () => {
  let component: ScanningModeComponent;
  let fixture: ComponentFixture<ScanningModeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScanningModeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScanningModeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
