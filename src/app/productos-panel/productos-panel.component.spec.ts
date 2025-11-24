import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductosPanelComponent } from './productos-panel.component';

describe('ProductosPanelComponent', () => {
  let component: ProductosPanelComponent;
  let fixture: ComponentFixture<ProductosPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductosPanelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductosPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
