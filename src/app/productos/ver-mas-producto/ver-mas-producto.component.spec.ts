import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerMasProductoComponent } from './ver-mas-producto.component';

describe('VerMasProductoComponent', () => {
  let component: VerMasProductoComponent;
  let fixture: ComponentFixture<VerMasProductoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerMasProductoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerMasProductoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
