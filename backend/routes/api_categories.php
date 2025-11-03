<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CategoryController;

/*
|--------------------------------------------------------------------------
| API Routes para Categorías
|--------------------------------------------------------------------------
*/

// Rutas para categorías
Route::prefix('categories')->group(function () {
    // Obtener todas las categorías
    Route::get('/', [CategoryController::class, 'index']);

    // Crear una nueva categoría (debe ir antes de /{id} para evitar conflictos)
    Route::post('/', [CategoryController::class, 'store']);

    // Inicializar categorías desde el frontend
    Route::post('/init', [CategoryController::class, 'init']);

    // Sincronizar categorías
    Route::post('/sync', [CategoryController::class, 'sync']);

    // Verificar estado de sincronización
    Route::get('/status/check', [CategoryController::class, 'status']);

    // Obtener una categoría específica (debe ir al final para evitar conflictos)
    Route::get('/{id}', [CategoryController::class, 'show']);
});

// Ruta de prueba para verificar que el backend funciona
Route::get('/test', function () {
    return response()->json([
        'message' => 'Backend funcionando correctamente',
        'timestamp' => now(),
        'version' => '1.0.0',
        'categories_endpoint' => '/api/categories'
    ]);
});
