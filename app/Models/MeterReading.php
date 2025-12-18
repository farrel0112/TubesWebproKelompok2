<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MeterReading extends Model
{
    use HasFactory;

    protected $table = 'meter_readings';

    protected $fillable = [
        'meter_id',
        'period',
        'start_read',
        'end_read',
        'read_at',
        'staff_id'
    ];

    public function meter()
    {
        return $this->belongsTo(Meter::class);
    }

    public function staff()
    {
        return $this->belongsTo(User::class, 'staff_id');
    }
}
