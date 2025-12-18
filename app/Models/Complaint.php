<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Complaint extends Model
{
    protected $fillable = [
        'user_id','customer_id','type','message','status','priority',
        'source','ip_address','user_agent'
    ];

    public function user(){ return $this->belongsTo(User::class); }
    public function customer(){ return $this->belongsTo(Customer::class); }
}

