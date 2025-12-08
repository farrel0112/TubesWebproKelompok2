<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Meter extends Model
{
    use HasFactory;

    protected $table = 'meters';

    protected $fillable = [
        'customer_id',
        'serial_no',
        'install_date',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function meterReadings()
    {
        return $this->hasMany(MeterReading::class);
    }
}
