<?php

namespace App\Observers;

use App\Models\Bill;

class BillObserver
{
    public function updated(Bill $bill): void
    {
        // Kalau status bill baru saja berubah menjadi paid
        if ($bill->wasChanged('status') && $bill->status === 'paid') {
            if ($bill->customer) {
                // ubah status customer jadi active (tanpa tergantung fillable)
                $bill->customer->forceFill(['status' => 'active'])->save();
            }
        }
    }
}
