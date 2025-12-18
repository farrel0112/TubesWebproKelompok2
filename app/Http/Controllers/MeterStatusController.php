<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Meter;
use App\Models\MeterReading;
use Illuminate\Http\Request;

class MeterStatusController extends Controller
{
    public function show(Request $request, string $customerNo)
    {
        $user = auth()->user();

        // cari customer berdasarkan nomor pelanggan
        $customer = Customer::with('user')
            ->where('customer_no', $customerNo) // <-- kalau nama kolom beda, ganti di sini
            ->first();

        if (!$customer) {
            return response()->json(['message' => 'Data pelanggan tidak ditemukan'], 404);
        }

        // (opsional tapi recommended) pelanggan hanya boleh cek data miliknya sendiri
        if ($user->role === 'pelanggan' && (int)$customer->user_id !== (int)$user->id) {
            return response()->json(['message' => 'Tidak diizinkan'], 403);
        }

        // ambil meter milik customer (ambil yang terbaru)
        $meter = Meter::where('customer_id', $customer->id)
            ->orderByDesc('install_date')
            ->first();

        if (!$meter) {
            // pelanggan ada, tapi meter belum didaftarkan
            return response()->json([
                'data' => [
                    'nama' => $customer->user?->name ?? '-',
                    'nomor' => $customerNo,
                    'alamat' => $this->formatAddress($customer),
                    'readings' => (object)[],
                ]
            ], 200);
        }

        // ambil semua pembacaan meter untuk meter tsb
        $readings = MeterReading::where('meter_id', $meter->id)
            ->orderBy('period')
            ->get();

        // bentuk seperti: readings['2025-03'] = { angka, kubik }
        $map = [];
        foreach ($readings as $r) {
            $period = $this->periodToYYYYDashMM($r->period); // support '202503' atau '2025-03'
            $end = (int) ($r->end_read ?? 0);
            $start = (int) ($r->start_read ?? 0);

            $map[$period] = [
                'angka' => $end,
                'kubik' => max(0, $end - $start),
            ];
        }

        return response()->json([
            'data' => [
                'nama' => $customer->user?->name ?? '-',
                'nomor' => $customerNo,
                'alamat' => $this->formatAddress($customer),
                'readings' => $map,
            ]
        ], 200);
    }

    private function periodToYYYYDashMM($period): string
    {
        $p = (string)$period;
        // kalau "202503" -> "2025-03"
        if (preg_match('/^\d{6}$/', $p)) {
            return substr($p, 0, 4) . '-' . substr($p, 4, 2);
        }
        // kalau sudah "2025-03"
        if (preg_match('/^\d{4}-\d{2}$/', $p)) {
            return $p;
        }
        // fallback
        return $p;
    }

    private function formatAddress($c): string
    {
        $parts = array_filter([
            $c->address ?? null,
            $c->city ?? null,
            $c->province ?? null,
            !empty($c->postal_code) ? '(' . $c->postal_code . ')' : null,
        ]);
        return $parts ? implode(', ', $parts) : '-';
    }
}
