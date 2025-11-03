<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class OrderController extends Controller
{
    /**
     * Crear una nueva orden
     */
    public function store(Request $request)
    {
        // Validar los datos recibidos
        $validator = Validator::make($request->all(), [
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'alert_id' => 'nullable|exists:alerts,id',
            'user_id' => 'required|exists:users,id',
            'inventory_id' => 'nullable|exists:inventories,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'supplier_email' => 'nullable|email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Crear la orden
            $order = Order::create([
                'product_id' => $request->product_id,
                'quantity' => $request->quantity,
                'alert_id' => $request->alert_id,
                'user_id' => $request->user_id, // IMPORTANTE: Asegurar que se asigne
                'inventory_id' => $request->inventory_id,
                'supplier_id' => $request->supplier_id,
                'supplier_email' => $request->supplier_email,
                'status' => 'pending',
            ]);

            // Si hay email del proveedor, enviar notificación
            if ($order->supplier_email) {
                try {
                    // Aquí puedes implementar el envío de email
                    // Mail::to($order->supplier_email)->send(new OrderNotification($order));
                    
                    // Por ahora solo logueamos
                    \Log::info('Email debería enviarse a: ' . $order->supplier_email, [
                        'order_id' => $order->id,
                        'product_id' => $order->product_id,
                        'quantity' => $order->quantity
                    ]);
                } catch (\Exception $e) {
                    \Log::error('Error al enviar email: ' . $e->getMessage());
                }
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Orden creada exitosamente',
                'data' => $order
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Error al crear orden: ' . $e->getMessage(), [
                'request' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Error al crear la orden',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener todas las órdenes
     */
    public function index(Request $request)
    {
        $orders = Order::with(['product', 'user', 'supplier', 'alert'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $orders
        ]);
    }

    /**
     * Obtener una orden específica
     */
    public function show($id)
    {
        $order = Order::with(['product', 'user', 'supplier', 'alert'])->find($id);

        if (!$order) {
            return response()->json([
                'status' => 'error',
                'message' => 'Orden no encontrada'
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $order
        ]);
    }
}

<<<<<<< HEAD
=======





>>>>>>> ede7a69 (mejorando la aplicacion en general)



