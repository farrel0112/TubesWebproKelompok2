<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    protected $table = 'customers';

    protected $fillable = [
        'user_id',
        'customer_no',
        'address',
        'province','city',
        'postal_code',
        'nik',
        'status'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function meters()
    {
        return $this->hasMany(Meter::class);
    }

    public function bills()
    {
        return $this->hasMany(Bill::class);
    }
}