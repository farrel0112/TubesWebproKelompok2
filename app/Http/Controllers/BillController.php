<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use App\Models\Bill;
use App\Models\Customer;
use App\Models\MeterReading;
use App\Models\Payment;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class BillController extends Controller
{
    public function index()
    {
        $bills = Bill::with(['customer.user'])->get();

        return response()->json([
            'message' => 'Daftar tagihan',
            'data'    => $bills
        ]);
    }

    public function show($id)
    {
        $bill = Bill::with(['customer.user', 'payments'])->find($id);

        if (!$bill) {
            return response()->json(['message' => 'Tagihan tidak ditemukan'], 404);
        }

        return response()->json([
            'message' => 'Detail tagihan',
            'data'    => $bill
        ]);
    }

    public function generate(Request $request)
    {
        $request->validate([
            'reading_id' => 'required|exists:meter_readings,id'
        ]);

        $reading = MeterReading::with('meter.customer')->find($request->reading_id);

        if (!$reading || !$reading->meter || !$reading->meter->customer) {
            return response()->json([
                'message' => 'Data meter atau customer tidak valid'
            ], 422);
        }

        $customer = $reading->meter->customer;

        $existing = Bill::where('customer_id', $customer->id)
                        ->where('period', $reading->period)
                        ->first();

        if ($existing) {
            return response()->json([
                'message' => 'Tagihan untuk periode ini sudah dibuat'
            ], 409);
        }

        // Hitung biaya
        $charge = $reading->usage_m3 * 2500; 
        $adminFee = 2500;

        $dueDate = now()->addDays(10)->format('Y-m-d');

        $invoiceNo = 'INV-' . $customer->id . '-' . $reading->period;

        $bill = Bill::create([
            'customer_id' => $customer->id,
            'period'      => $reading->period,
            'usage_m3'    => $reading->usage_m3,
            'charge'      => $charge,
            'admin_fee'   => $adminFee,
            'status'      => 'unpaid',
            'due_date'    => $dueDate,
            'invoice_no'  => $invoiceNo,
        ]);

        return response()->json([
            'message' => 'Tagihan berhasil dibuat',
            'data'    => $bill
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $bill = Bill::find($id);
        if (!$bill) {
            return response()->json(['message' => 'Tagihan tidak ditemukan'], 404);
        }

        $request->validate([
            'status' => 'in:draft,unpaid,paid,overdue',
            'due_date' => 'date',
        ]);

        $bill->update($request->all());

        return response()->json([
            'message' => 'Tagihan berhasil diperbarui',
            'data'    => $bill
        ]);
    }

    public function destroy($id)
    {
        $bill = Bill::find($id);
        if (!$bill) {
            return response()->json(['message' => 'Tagihan tidak ditemukan'], 404);
        }

        $bill->delete();

        return response()->json(['message' => 'Tagihan berhasil dihapus']);
    }

    public function invoice($id)
    {
        $bill = Bill::with(['customer.user', 'latestSettledPayment', 'payments'])->findOrFail($id);

        // ✅ yang dipakai untuk tanggal pembayaran (offline/online)
        $paidPayment = $bill->latestSettledPayment;

        $data = [
            'title'       => 'Invoice Tagihan PDAM',
            'bill'        => $bill,
            'customer'    => $bill->customer,
            'payments'    => $bill->payments,
            'paidPayment' => $paidPayment, // ✅ invoice.blade pakai ini
        ];

        $pdf = Pdf::loadView('invoice', $data)->setPaper('A4');
        return $pdf->download("invoice_{$bill->invoice_no}.pdf");
    }

    public function markPaidOffline(Bill $bill)
    {
        if (auth()->user()->role !== 'pegawai') {
            abort(403, 'Hanya pegawai yang boleh mengkonfirmasi pembayaran offline.');
        }

        if ($bill->status === 'paid') {
            return response()->json(['message' => 'Tagihan sudah lunas.'], 409);
        }

        $validated = request()->validate([
            'paid_at'    => 'nullable|date',
            'receipt_no' => 'nullable|string|max:100',
            'note'       => 'nullable|string|max:500',
        ]);

        $paidAt = isset($validated['paid_at'])
            ? Carbon::parse($validated['paid_at'])
            : now();

        DB::transaction(function () use ($bill, $paidAt, $validated) {

            Payment::create([
                'bill_id'        => $bill->id,
                'method'         => 'offline_kantor',          // bebas, tapi konsisten
                'provider_tx_id' => 'OFFLINE-' . now()->timestamp . '-' . $bill->id,
                'order_id'       => null,
                'amount'         => $bill->total,              // biasanya total tagihan
                'paid_at'        => $paidAt,
                'status'         => 'settled',                 // supaya jelas sukses
                'confirmed_by'   => auth()->id(),
                'receipt_no'     => $validated['receipt_no'] ?? null,
                'note'           => $validated['note'] ?? null,
            ]);

            $bill->update([
                'status' => 'paid',
            ]);
            $bill->loadMissing('customer'); 
            if ($bill->customer) {
                $bill->customer->update(['status' => 'Aktif']);
            }
        });

        return response()->json(['message' => 'Tagihan berhasil ditandai lunas (offline).']);
    }

    public function filterByPeriode(Request $request)
    {
        $request->validate([
            'periode' => ['required', 'regex:/^\d{6}$/'], // wajib format YYYYMM
        ]);

        $user = $request->user();
        $customer = $user->customer;

        if (!$customer) {
            return response()->json(['message' => 'Data pelanggan tidak ditemukan'], 404);
        }

        $bills = Bill::where('customer_id', $customer->id)
            ->where('period', $request->periode)
            ->with(['customer.user'])
            ->get();

        if ($bills->isEmpty()) {
            return response()->json([
                'message' => 'Tagihan untuk periode ini tidak ditemukan',
                'data' => []
            ], 404);
        }

        return response()->json([
            'message' => 'Tagihan ditemukan',
            'data'    => $bills
        ]);
    }

    public function myPaymentHistory(Request $request)
    {
        $user = $request->user();

        $customer = Customer::where('user_id', $user->id)->first();
        if (!$customer) {
            return response()->json([
                'message' => 'Customer tidak ditemukan untuk user ini.',
                'data' => [
                    'summary' => [
                        'period' => Carbon::now()->format('Ym'),
                        'total_tagihan' => 0,
                        'paid_count' => 0,
                        'unpaid_count' => 0
                    ],
                    'items' => [],
                ]
            ], 200);
        }

        // ✅ FIX format period
        $currentPeriod = Carbon::now()->format('Ym');

        // ✅ Ambil settled payment terbaru (offline/online) langsung dari relasi
        $bills = Bill::where('customer_id', $customer->id)
            ->with(['latestSettledPayment']) // ✅ ini kuncinya
            ->orderByDesc('period')
            ->orderByDesc('id')
            ->get();

        $getTotal = function ($bill) {
            if (isset($bill->total)) return (int) $bill->total;
            return (int) (($bill->charge ?? 0) + ($bill->admin_fee ?? 0));
        };

        $summaryTotal = $bills
            ->where('period', $currentPeriod)
            ->sum(fn($b) => $getTotal($b));

        $paidCount   = $bills->where('status', 'paid')->count();
        $unpaidCount = $bills->whereIn('status', ['unpaid', 'pending'])->count();

        $items = $bills->map(function ($bill) use ($getTotal) {
            $pay = $bill->latestSettledPayment; // ✅ offline/online sama-sama kebaca

            return [
                'bill_id'    => $bill->id,
                'invoice_no' => $bill->invoice_no,
                'period'     => $bill->period,
                'status'     => $bill->status,
                'total'      => $getTotal($bill),
                'paid_at'    => $pay?->paid_at, // ✅ ini yang JS kamu tampilkan
            ];
        });

        return response()->json([
            'message' => 'OK',
            'data' => [
                'summary' => [
                    'period'        => $currentPeriod,
                    'total_tagihan' => (int) $summaryTotal,
                    'paid_count'    => (int) $paidCount,
                    'unpaid_count'  => (int) $unpaidCount,
                ],
                'items' => $items,
            ]
        ], 200);
    }
}