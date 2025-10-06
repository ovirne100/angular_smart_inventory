<?php
// Endpoint para inicializar categorías
// Ejemplo para PHP/Laravel

// Función para inicializar categorías
function initializeCategories() {
    $categories = [
        ['id' => 1, 'name' => 'Electrónicos'],
        ['id' => 2, 'name' => 'Ropa y Accesorios'],
        ['id' => 3, 'name' => 'Hogar y Jardín'],
        ['id' => 4, 'name' => 'Deportes y Fitness'],
        ['id' => 5, 'name' => 'Libros y Medios'],
        ['id' => 6, 'name' => 'Salud y Belleza'],
        ['id' => 7, 'name' => 'Juguetes y Juegos'],
        ['id' => 8, 'name' => 'Automotriz'],
        ['id' => 9, 'name' => 'Alimentación'],
        ['id' => 10, 'name' => 'Oficina y Escolar'],
        ['id' => 11, 'name' => 'Tecnología'],
        ['id' => 12, 'name' => 'Muebles'],
        ['id' => 13, 'name' => 'Herramientas'],
        ['id' => 14, 'name' => 'Jardinería'],
        ['id' => 15, 'name' => 'Cocina'],
        ['id' => 16, 'name' => 'Baño'],
        ['id' => 17, 'name' => 'Dormitorio'],
        ['id' => 18, 'name' => 'Salón'],
        ['id' => 19, 'name' => 'Iluminación'],
        ['id' => 20, 'name' => 'Decoración'],
        ['id' => 21, 'name' => 'Textiles'],
        ['id' => 22, 'name' => 'Alfombras'],
        ['id' => 23, 'name' => 'Cortinas'],
        ['id' => 24, 'name' => 'Electrodomésticos'],
        ['id' => 25, 'name' => 'Climatización'],
        ['id' => 26, 'name' => 'Seguridad'],
        ['id' => 27, 'name' => 'Limpieza'],
        ['id' => 28, 'name' => 'Organización'],
        ['id' => 29, 'name' => 'Bricolaje'],
        ['id' => 30, 'name' => 'Ferretería']
    ];

    foreach ($categories as $category) {
        // Verificar si la categoría ya existe
        $existing = DB::table('categories')->where('id', $category['id'])->first();

        if (!$existing) {
            DB::table('categories')->insert([
                'id' => $category['id'],
                'name' => $category['name'],
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }
    }

    return response()->json(['message' => 'Categorías inicializadas correctamente']);
}

// Ruta: POST /api/init-categories
