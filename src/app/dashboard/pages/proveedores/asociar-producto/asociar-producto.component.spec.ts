import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsociarProductoComponent } from './asociar-producto.component';

describe('AsociarProductoComponent', () => {
  let component: AsociarProductoComponent;
  let fixture: ComponentFixture<AsociarProductoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsociarProductoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AsociarProductoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
