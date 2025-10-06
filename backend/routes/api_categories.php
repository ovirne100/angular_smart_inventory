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

    // Obtener una categoría específica
    Route::get('/{id}', [CategoryController::class, 'show']);

    // Inicializar categorías desde el frontend
    Route::post('/init', [CategoryController::class, 'init']);

    // Sincronizar categorías
    Route::post('/sync', [CategoryController::class, 'sync']);

    // Verificar estado de sincronización
    Route::get('/status/check', [CategoryController::class, 'status']);
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
