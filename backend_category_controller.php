<?php
// Métodos para agregar a tu CategoryController

class CategoryController extends Controller
{
    /**
     * Inicializar categorías desde el frontend
     */
    public function init(Request $request)
    {
        $categories = $request->input('categories', []);

        $inserted = 0;
        $updated = 0;

        foreach ($categories as $categoryData) {
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
        }

        return response()->json([
            'message' => 'Categorías procesadas exitosamente',
            'inserted' => $inserted,
            'updated' => $updated,
            'total' => count($categories)
        ]);
    }

    /**
     * Obtener todas las categorías
     */
    public function index()
    {
        $categories = Category::orderBy('id')->get();
        return response()->json($categories);
    }

    /**
     * Sincronizar categorías
     */
    public function sync(Request $request)
    {
        $frontendCategories = $request->input('categories', []);

        // Obtener categorías existentes
        $existingCategories = Category::pluck('id')->toArray();

        // Insertar nuevas categorías
        $newCategories = array_filter($frontendCategories, function($cat) use ($existingCategories) {
            return !in_array($cat['id'], $existingCategories);
        });

        if (!empty($newCategories)) {
            Category::insert($newCategories);
        }

        return response()->json([
            'message' => 'Categorías sincronizadas',
            'new_categories' => count($newCategories)
        ]);
    }
}
