<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $table = 'payments';

    protected $fillable = [
        'bill_id',
        'method',
        'provider_tx_id',
        'amount',
        'paid_at',
        'status',
    ];

    public function bill()
    {
        return $this->belongsTo(Bill::class);
    }
}
