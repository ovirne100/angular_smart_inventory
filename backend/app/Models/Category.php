<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        'id',
        'name',
        'created_at',
        'updated_at'
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relación con productos
    public function products()
    {
        return $this->hasMany(Product::class, 'category_id');
    }

    // Scope para buscar por nombre
    public function scopeByName($query, $name)
    {
        return $query->where('name', 'like', '%' . $name . '%');
    }

    // Método para obtener categorías con conteo de productos
    public static function withProductCount()
    {
        return self::withCount('products')->orderBy('id')->get();
    }
}
