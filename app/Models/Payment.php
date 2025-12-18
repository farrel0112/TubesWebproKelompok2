<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $table = 'payments';
    protected $casts = ['paid_at' => 'datetime'];

    protected $fillable = [
        'bill_id',
        'method',
        'provider_tx_id',
        'order_id',
        'amount',
        'paid_at',
        'status',
        'confirmed_by',
        'receipt_no',
        'note',
    ];

    public function bill()
    {
        return $this->belongsTo(Bill::class);
    }
}
