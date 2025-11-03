<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\OrderController;

/*
|--------------------------------------------------------------------------
| API Routes para Órdenes
|--------------------------------------------------------------------------
*/

// Rutas para órdenes (con autenticación)
Route::prefix('orders')->middleware('auth:sanctum')->group(function () {
    // Crear una nueva orden
    Route::post('/', [OrderController::class, 'store']);
    
    // Obtener todas las órdenes
    Route::get('/', [OrderController::class, 'index']);
    
    // Obtener una orden específica
    Route::get('/{id}', [OrderController::class, 'show']);
});

<<<<<<< HEAD
=======





>>>>>>> ede7a69 (mejorando la aplicacion en general)



