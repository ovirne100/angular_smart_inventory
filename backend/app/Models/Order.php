<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'inventory_id',
        'supplier_id',
        'quantity',
        'alert_id',
        'user_id', // IMPORTANTE: Debe estar en fillable
        'supplier_email',
        'status',
    ];

    protected $casts = [
        'product_id' => 'integer',
        'inventory_id' => 'integer',
        'supplier_id' => 'integer',
        'quantity' => 'integer',
        'alert_id' => 'integer',
        'user_id' => 'integer',
    ];

    /**
     * Relación con Product
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Relación con User
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relación con Supplier
     */
    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    /**
     * Relación con Alert
     */
    public function alert()
    {
        return $this->belongsTo(Alert::class);
    }

    /**
     * Relación con Inventory
     */
    public function inventory()
    {
        return $this->belongsTo(Inventory::class);
    }
}

<<<<<<< HEAD
=======





>>>>>>> ede7a69 (mejorando la aplicacion en general)



