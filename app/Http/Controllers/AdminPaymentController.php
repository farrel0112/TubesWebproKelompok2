<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use Illuminate\Http\Request;

class AdminPaymentController extends Controller
{
    public function index(Request $request)
    {
        // 🔒 pastikan hanya admin/pegawai
        $role = auth()->user()->role ?? null;
        if (!in_array($role, ['admin', 'pegawai'])) {
            abort(403, 'Akses ditolak.');
        }

        // filter opsional
        $validated = $request->validate([
            'status' => 'nullable|string',   // settled/pending/failed
            'method' => 'nullable|string',   // midtrans_qris/offline_kantor/dll
            'q'      => 'nullable|string',   // cari nama / invoice / order_id
            'period' => 'nullable|string',   // YYYYMM (di bills.period)
            'per_page' => 'nullable|integer|min:1|max:200',
        ]);

        $perPage = $validated['per_page'] ?? 50;

        $query = Payment::query()
            ->with([
                'bill.customer.user',   // supaya bisa tampil nama pelanggan
            ]);

        if (!empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        if (!empty($validated['method'])) {
            $query->where('method', $validated['method']);
        }

        if (!empty($validated['period'])) {
            $query->whereHas('bill', function ($q) use ($validated) {
                $q->where('period', $validated['period']);
            });
        }

        if (!empty($validated['q'])) {
            $kw = trim($validated['q']);
            $query->where(function ($w) use ($kw) {
                $w->where('order_id', 'like', "%{$kw}%")
                  ->orWhere('provider_tx_id', 'like', "%{$kw}%")
                  ->orWhereHas('bill', function ($b) use ($kw) {
                      $b->where('invoice_no', 'like', "%{$kw}%")
                        ->orWhere('period', 'like', "%{$kw}%")
                        ->orWhereHas('customer', function ($c) use ($kw) {
                            $c->where('customer_no', 'like', "%{$kw}%")
                              ->orWhereHas('user', function ($u) use ($kw) {
                                  $u->where('name', 'like', "%{$kw}%")
                                    ->orWhere('email', 'like', "%{$kw}%");
                              });
                        });
                  });
            });
        }

        $payments = $query
            ->orderByDesc('paid_at')
            ->orderByDesc('id')
            ->paginate($perPage);

        return response()->json([
            'message' => 'OK',
            'data' => $payments,
        ]);
    }
}
