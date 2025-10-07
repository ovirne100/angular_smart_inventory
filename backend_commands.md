# Comandos para implementar el backend de categorías

## 1. Ejecutar migración
```bash
php artisan migrate
```

## 2. Ejecutar seeder
```bash
php artisan db:seed --class=CategorySeeder
```

## 3. Agregar rutas a routes/api.php
Agregar estas líneas al archivo `routes/api.php`:

```php
// Rutas para categorías
Route::prefix('categories')->group(function () {
    Route::get('/', [CategoryController::class, 'index']);
    Route::get('/{id}', [CategoryController::class, 'show']);
    Route::post('/init', [CategoryController::class, 'init']);
    Route::post('/sync', [CategoryController::class, 'sync']);
    Route::get('/status/check', [CategoryController::class, 'status']);
});
```

## 4. Probar endpoints
```bash
# Probar que el backend funciona
curl http://127.0.0.1:8000/api/test

# Obtener todas las categorías
curl http://127.0.0.1:8000/api/categories

# Verificar estado de sincronización
curl http://127.0.0.1:8000/api/categories/status/check
```

## 5. Verificar en la base de datos
```sql
SELECT * FROM categories ORDER BY id;
```

## 6. Si necesitas limpiar y empezar de nuevo
```bash
php artisan migrate:rollback
php artisan migrate
php artisan db:seed --class=CategorySeeder
```
