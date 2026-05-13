import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AacButtonComponent } from './aac-button.component';

describe('AacButtonComponent', () => {
  let component: AacButtonComponent;
  let fixture: ComponentFixture<AacButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AacButtonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AacButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
