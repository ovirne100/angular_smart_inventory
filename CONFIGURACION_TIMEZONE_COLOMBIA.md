# 🕐 Configuración de Timezone Colombia - Guía Completa

## ✅ Backend (Laravel) - YA CONFIGURADO

### Cambios Aplicados:
1. **config/app.php**:
   ```php
   'timezone' => env('APP_TIMEZONE', 'America/Bogota'),
   ```

2. **.env**:
   ```
   APP_TIMEZONE=America/Bogota
   ```

### Verificación:
```bash
php artisan tinker
>>> echo now()->format('Y-m-d H:i:s');
# Debería mostrar hora de Colombia (UTC-5)
```

---

## 🔧 Frontend (Angular) - CONFIGURACIÓN

### 1. Pipe Creado: `colombia-date.pipe.ts`
Ya se creó automáticamente en `src/app/pipes/colombia-date.pipe.ts`

### 2. Cómo Usar el Pipe en Templates HTML:

#### Reemplaza esto:
```html
{{ fecha | date:'dd/MM/yyyy HH:mm' }}
```

#### Por esto:
```html
{{ fecha | colombiaDate }}
```

#### Formatos Disponibles:
```html
<!-- Fecha y hora completa (default) -->
{{ fecha | colombiaDate }}  
→ 21/11/2025 15:30:45

<!-- Solo fecha -->
{{ fecha | colombiaDate:'date' }}
→ 21/11/2025

<!-- Solo hora -->
{{ fecha | colombiaDate:'time' }}
→ 15:30:45

<!-- Fecha y hora sin segundos -->
{{ fecha | colombiaDate:'datetime-short' }}
→ 21/11/2025 15:30
```

---

## 📝 Archivos que Necesitan Actualización

### Componentes Principales a Actualizar:

#### 1. **Entradas** (`entrada.component.html`)
Buscar y reemplazar:
- `{{ entrada.created_at | date:'dd/MM/yyyy HH:mm' }}`
- Por: `{{ entrada.created_at | colombiaDate:'datetime-short' }}`

#### 2. **Salidas** (`salida.component.html`)
- Igual que entradas

#### 3. **Informes** (`informes.component.html`)
- Todas las fechas en las tablas

#### 4. **Alertas** (`alertas.component.html`)
Ya está usando:
```html
{{ alerta.date | date:'dd/MM/yyyy HH:mm' }}
```
Cambiar por:
```html
{{ alerta.date | colombiaDate:'datetime-short' }}
```

#### 5. **Productos** (ver-mas, actualizar, etc.)
- Fechas de creación y actualización

---

## 🚀 Pasos de Implementación

### Paso 1: Importar el Pipe en Cada Componente

En cada archivo `.ts` donde uses fechas:

```typescript
import { ColombiaDatePipe } from '../../../pipes/colombia-date.pipe';

@Component({
  selector: 'app-mi-componente',
  standalone: true,
  imports: [
    CommonModule,
    ColombiaDatePipe  // ← Agregar aquí
  ],
  // ...
})
```

### Paso 2: Actualizar Templates HTML

Buscar en **TODOS** los archivos `.html`:
- `| date:'dd/MM/yyyy HH:mm'`
- `| date:'dd/MM/yyyy'`
- `| date:'short'`
- `| date:'medium'`

Y reemplazar por el pipe de Colombia correspondiente.

---

## 🔍 Componentes Críticos (Lista de Verificación)

### ✅ Ya Verificados:
- [x] Laravel timezone configurado
- [x] Pipe Colombia creado
- [x] Utilidades timezone creadas

### 📋 Por Actualizar:
- [ ] `entrada.component.html` y `.ts`
- [ ] `salida.component.html` y `.ts`
- [ ] `informes.component.html` y `.ts`
- [ ] `alertas.component.html` (línea 57)
- [ ] `productos.component.html`
- [ ] `ver-mas-producto.component.html`
- [ ] `actualizar-producto.component.html`
- [ ] `proveedores.component.html`
- [ ] `product-suppliers.component.html`
- [ ] `inicio.component.html` (si tiene fechas)

---

## 🧪 Cómo Probar

### 1. Backend (Laravel):
```bash
php artisan tinker
>>> now()->format('Y-m-d H:i:s')
# Debe mostrar: "2025-11-21 11:38:58" (hora Colombia)
```

### 2. Frontend (Angular):
```typescript
import { getCurrentColombiaTime } from './utils/timezone';

console.log('Hora Colombia:', getCurrentColombiaTime());
// Debe mostrar la hora actual de Colombia
```

### 3. Probar Entradas/Salidas:
1. Crear una entrada de inventario
2. Verificar que la hora mostrada coincida con tu hora actual de Colombia
3. Hacer una salida
4. Verificar hora en informes

---

## 📌 Ejemplo de Actualización Completa

### ANTES:
```typescript
// entrada.component.ts
import { CommonModule } from '@angular/common';

@Component({
  imports: [CommonModule]
})
export class EntradaComponent {}
```

```html
<!-- entrada.component.html -->
<td>{{ entrada.created_at | date:'dd/MM/yyyy HH:mm' }}</td>
```

### DESPUÉS:
```typescript
// entrada.component.ts
import { CommonModule } from '@angular/common';
import { ColombiaDatePipe } from '../../../pipes/colombia-date.pipe';

@Component({
  imports: [CommonModule, ColombiaDatePipe]
})
export class EntradaComponent {}
```

```html
<!-- entrada.component.html -->
<td>{{ entrada.created_at | colombiaDate:'datetime-short' }}</td>
```

---

## 🎯 Comandos Útiles

### Buscar todos los archivos con fechas:
```bash
# Windows PowerShell
cd C:\xampp\htdocs\ANGULAR-PROYECTO\proyecto
Get-ChildItem -Recurse -Include *.html | Select-String "| date:" | Select-Object Path, LineNumber, Line
```

### Verificar timezone Laravel:
```bash
cd C:\xampp\htdocs\LARAVEL-PROYECTO\project
php artisan tinker --execute="echo config('app.timezone');"
```

---

## ✅ Resultado Final

Después de aplicar todos los cambios:
- ✅ Laravel guarda fechas en hora de Colombia
- ✅ Angular muestra fechas en hora de Colombia
- ✅ Entradas, salidas e informes muestran hora correcta
- ✅ Alertas muestran hora correcta
- ✅ Toda la aplicación usa zona horaria consistente

---

## 📞 Soporte

Si necesitas ayuda, verifica:
1. Laravel: `php artisan config:clear`
2. Angular: Reiniciar servidor `npm start`
3. Limpiar caché del navegador


