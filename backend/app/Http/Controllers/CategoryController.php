<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Category;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class CategoryController extends Controller
{
    /**
     * Inicializar categorías desde el frontend
     * POST /api/categories/init
     */
    public function init(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'categories' => 'required|array',
                'categories.*.id' => 'required|integer',
                'categories.*.name' => 'required|string|max:255'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Datos de categorías inválidos',
                    'errors' => $validator->errors()
                ], 400);
            }

            $categories = $request->input('categories', []);
            $inserted = 0;
            $updated = 0;
            $errors = [];

            DB::beginTransaction();

            foreach ($categories as $categoryData) {
                try {
                    $category = Category::updateOrCreate(
                        ['id' => $categoryData['id']],
                        [
                            'name' => $categoryData['name'],
                            'created_at' => now(),
                            'updated_at' => now()
                        ]
                    );

                    if ($category->wasRecentlyCreated) {
                        $inserted++;
                    } else {
                        $updated++;
                    }
                } catch (\Exception $e) {
                    $errors[] = "Error procesando categoría ID {$categoryData['id']}: " . $e->getMessage();
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Categorías procesadas exitosamente',
                'data' => [
                    'inserted' => $inserted,
                    'updated' => $updated,
                    'total' => count($categories),
                    'errors' => $errors
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error interno del servidor',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener todas las categorías
     * GET /api/categories
     */
    public function index()
    {
        try {
            $categories = Category::orderBy('id')->get();
            
            return response()->json([
                'success' => true,
                'data' => $categories,
                'total' => $categories->count()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error obteniendo categorías',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear una nueva categoría
     * POST /api/categories
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255|unique:categories,name'
            ], [
                'name.required' => 'El nombre de la categoría es obligatorio',
                'name.unique' => 'Ya existe una categoría con ese nombre',
                'name.max' => 'El nombre de la categoría no puede exceder 255 caracteres'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            $category = Category::create([
                'name' => $request->input('name'),
                'created_at' => now(),
                'updated_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Categoría creada exitosamente',
                'data' => $category
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear la categoría',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Sincronizar categorías
     * POST /api/categories/sync
     */
    public function sync(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'categories' => 'required|array',
                'categories.*.id' => 'required|integer',
                'categories.*.name' => 'required|string|max:255'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Datos de categorías inválidos',
                    'errors' => $validator->errors()
                ], 400);
            }

            $frontendCategories = $request->input('categories', []);
            
            // Obtener categorías existentes
            $existingCategories = Category::pluck('id')->toArray();
            
            // Filtrar nuevas categorías
            $newCategories = array_filter($frontendCategories, function($cat) use ($existingCategories) {
                return !in_array($cat['id'], $existingCategories);
            });

            $inserted = 0;
            if (!empty($newCategories)) {
                foreach ($newCategories as $categoryData) {
                    Category::create([
                        'id' => $categoryData['id'],
                        'name' => $categoryData['name'],
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                    $inserted++;
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Categorías sincronizadas exitosamente',
                'data' => [
                    'new_categories' => $inserted,
                    'total_frontend' => count($frontendCategories),
                    'total_existing' => count($existingCategories)
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error sincronizando categorías',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener una categoría específica
     * GET /api/categories/{id}
     */
    public function show($id)
    {
        try {
            $category = Category::findOrFail($id);
            
            return response()->json([
                'success' => true,
                'data' => $category
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Categoría no encontrada',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Verificar estado de sincronización
     * GET /api/categories/status
     */
    public function status()
    {
        try {
            $totalCategories = Category::count();
            $frontendCategories = 30; // Número de categorías en el frontend
            
            return response()->json([
                'success' => true,
                'data' => [
                    'backend_categories' => $totalCategories,
                    'frontend_categories' => $frontendCategories,
                    'synchronized' => $totalCategories >= $frontendCategories,
                    'missing' => max(0, $frontendCategories - $totalCategories)
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error verificando estado',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
