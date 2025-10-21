// Script para probar la sincronización de categorías
// Ejecutar con: node test_categories_sync.js

const axios = require('axios');

const API_BASE = 'http://127.0.0.1:8000/api';

const categories = [
  { id: 1, name: 'Electrónicos' },
  { id: 2, name: 'Ropa y Accesorios' },
  { id: 3, name: 'Hogar y Jardín' },
  { id: 4, name: 'Deportes y Fitness' },
  { id: 5, name: 'Libros y Medios' },
  { id: 6, name: 'Salud y Belleza' },
  { id: 7, name: 'Juguetes y Juegos' },
  { id: 8, name: 'Automotriz' },
  { id: 9, name: 'Alimentación' },
  { id: 10, name: 'Oficina y Escolar' },
  { id: 11, name: 'Tecnología' },
  { id: 12, name: 'Muebles' },
  { id: 13, name: 'Herramientas' },
  { id: 14, name: 'Jardinería' },
  { id: 15, name: 'Cocina' },
  { id: 16, name: 'Baño' },
  { id: 17, name: 'Dormitorio' },
  { id: 18, name: 'Salón' },
  { id: 19, name: 'Iluminación' },
  { id: 20, name: 'Decoración' },
  { id: 21, name: 'Textiles' },
  { id: 22, name: 'Alfombras' },
  { id: 23, name: 'Cortinas' },
  { id: 24, name: 'Electrodomésticos' },
  { id: 25, name: 'Climatización' },
  { id: 26, name: 'Seguridad' },
  { id: 27, name: 'Limpieza' },
  { id: 28, name: 'Organización' },
  { id: 29, name: 'Bricolaje' },
  { id: 30, name: 'Ferretería' }
];

async function testBackend() {
  console.log('🧪 Probando backend de categorías...\n');

  try {
    // 1. Probar que el backend funciona
    console.log('1️⃣ Probando conexión con el backend...');
    const testResponse = await axios.get(`${API_BASE}/test`);
    console.log('✅ Backend funcionando:', testResponse.data.message);

    // 2. Verificar estado actual
    console.log('\n2️⃣ Verificando estado de categorías...');
    const statusResponse = await axios.get(`${API_BASE}/categories/status/check`);
    console.log('📊 Estado actual:', statusResponse.data.data);

    // 3. Inicializar categorías
    console.log('\n3️⃣ Inicializando categorías...');
    const initResponse = await axios.post(`${API_BASE}/categories/init`, {
      categories: categories
    });
    console.log('✅ Categorías inicializadas:', initResponse.data.data);

    // 4. Verificar categorías creadas
    console.log('\n4️⃣ Verificando categorías creadas...');
    const categoriesResponse = await axios.get(`${API_BASE}/categories`);
    console.log(`📋 Total de categorías: ${categoriesResponse.data.total}`);
    console.log('🔍 Primeras 5 categorías:');
    categoriesResponse.data.data.slice(0, 5).forEach(cat => {
      console.log(`   - ID: ${cat.id}, Nombre: ${cat.name}`);
    });

    // 5. Probar sincronización
    console.log('\n5️⃣ Probando sincronización...');
    const syncResponse = await axios.post(`${API_BASE}/categories/sync`, {
      categories: categories
    });
    console.log('🔄 Sincronización:', syncResponse.data.data);

    console.log('\n🎉 ¡Todas las pruebas pasaron exitosamente!');
    console.log('✅ El backend está listo para sincronizar con Angular');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.response?.data || error.message);

    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Asegúrate de que el backend esté ejecutándose:');
      console.log('   php artisan serve');
    }
  }
}

testBackend();
