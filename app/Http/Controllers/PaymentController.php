<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Bill;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Midtrans\Transaction;
use Midtrans\Config;
use Midtrans\Snap;

class PaymentController extends Controller
{
    public function index()
    {
        $payments = Payment::with('bill')->get();

        return response()->json([
            'message' => 'Daftar pembayaran',
            'data' => $payments
        ]);
    }

    public function show($id)
    {
        $payment = Payment::with('bill')->find($id);

        if (!$payment) {
            return response()->json(['message' => 'Pembayaran tidak ditemukan'], 404);
        }

        return response()->json([
            'message' => 'Detail pembayaran',
            'data' => $payment
        ]);
    }

    /**
     * Pembayaran manual/simulasi (sudah ada di project kamu)
     * Tetap dipertahankan agar fitur existing tidak rusak.
     */
    public function store(Request $request)
    {
        $request->validate([
            'bill_id' => 'required|exists:bills,id',
            'method' => 'required|string',
            'provider_tx_id' => 'required|string',
        ]);

        $bill = Bill::find($request->bill_id);

        if (!$bill) {
            return response()->json(['message' => 'Tagihan tidak ditemukan'], 404);
        }

        if ($bill->status !== 'unpaid') {
            return response()->json(['message' => 'Tagihan sudah dibayar atau tidak valid'], 422);
        }

        $amount = $bill->total;

        $payment = Payment::create([
            'bill_id' => $bill->id,
            'method' => $request->method,
            'provider_tx_id' => $request->provider_tx_id,
            'amount' => $amount,
            'paid_at' => now(),
            'status' => 'settled',
        ]);

        $bill->update([
            'status' => 'paid'
        ]);

        return response()->json([
            'message' => 'Pembayaran berhasil diproses',
            'data' => $payment
        ], 201);
    }

    public function destroy($id)
    {
        $payment = Payment::find($id);

        if (!$payment) {
            return response()->json(['message' => 'Pembayaran tidak ditemukan'], 404);
        }

        $payment->delete();

        return response()->json(['message' => 'Pembayaran berhasil dihapus']);
    }

    // ============================================================
    // ✅ (1) MIDTRANS: GET SNAP TOKEN (SANDBOX)
    // ============================================================
    public function snapToken(Request $request, $billId)
    {
        $bill = Bill::with('customer.user')->find($billId);

        if (!$bill) {
            return response()->json(['message' => 'Tagihan tidak ditemukan'], 404);
        }

        if ($bill->status !== 'unpaid') {
            return response()->json(['message' => 'Tagihan sudah dibayar / tidak valid'], 422);
        }

        // Midtrans config (ambil dari config/midtrans.php)
        Config::$serverKey = config('midtrans.server_key');
        Config::$isProduction = (bool) config('midtrans.is_production', false);
        Config::$isSanitized = (bool) config('midtrans.is_sanitized', true);
        Config::$is3ds = (bool) config('midtrans.is_3ds', true);

        $orderId = 'PDAM-' . $bill->id . '-' . time();
        $grossAmount = (int) round((float) $bill->total);

        $customerName = $bill->customer?->user?->name ?? 'Pelanggan';
        $customerEmail = $bill->customer?->user?->email ?? 'customer@example.com';

        $params = [
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => $grossAmount,
            ],
            'customer_details' => [
                'first_name' => $customerName,
                'email' => $customerEmail,
            ],
            'item_details' => [
                [
                    'id' => 'BILL-' . $bill->id,
                    'price' => $grossAmount,
                    'quantity' => 1,
                    'name' => 'Tagihan PDAM Periode ' . ($bill->period ?? '-'),
                ]
            ],
        ];

        $snapToken = Snap::getSnapToken($params);

        return response()->json([
            'message' => 'Snap token berhasil dibuat',
            'data' => [
                'snap_token' => $snapToken,
                'order_id' => $orderId,
                'gross_amount' => $grossAmount
            ]
        ]);
    }

    public function status($orderId)
    {
        try {
            // Midtrans config
            Config::$serverKey = config('midtrans.server_key');
            Config::$isProduction = (bool) config('midtrans.is_production', false);
            Config::$isSanitized = true;
            Config::$is3ds = true;

            if (!Config::$serverKey) {
                return response()->json([
                    'message' => 'MIDTRANS_SERVER_KEY kosong / belum kebaca dari config',
                ], 200);
            }

            // ambil billId dari order_id: PDAM-{billId}-{timestamp}
            $parts = explode('-', (string) $orderId);
            $billId = $parts[1] ?? null;

            if (!$billId || !is_numeric($billId)) {
                return response()->json(['message' => 'Bill id tidak valid'], 200);
            }

            $bill = Bill::find($billId);
            if (!$bill) {
                return response()->json(['message' => 'Tagihan tidak ditemukan'], 200);
            }

            // Midtrans status (ini yang sering throw)
            try {
                $st = Transaction::status($orderId);
            } catch (\Exception $e) {
                Log::error("MIDTRANS Transaction::status ERROR: ".$e->getMessage(), [
                    'order_id' => $orderId,
                    'bill_id' => $billId,
                ]);

                // jangan 500
                return response()->json([
                    'message' => 'Midtrans status error',
                    'data' => [
                        'transaction_status' => 'unknown',
                        'order_id' => $orderId,
                        'bill_status' => $bill->status,
                        'error' => $e->getMessage(),
                    ]
                ], 200);
            }

            $transactionStatus = $st->transaction_status ?? null;
            $paymentType = $st->payment_type ?? 'unknown';
            $grossAmount = (int) round((float)($st->gross_amount ?? 0));
            $transactionId = $st->transaction_id ?? null;
            $providerTxId = $transactionId ?: $orderId;

            if (in_array($transactionStatus, ['settlement', 'capture'])) {
                if ($bill->status === 'unpaid') {
                    $bill->update(['status' => 'paid']);
                }
                $bill->loadMissing('customer');
                if ($bill->customer && $bill->customer->status !== 'active') {
                    $bill->customer->update(['status' => 'active']);
                }
                $payment = Payment::where('order_id', $orderId)->first()
                    ?? Payment::where('provider_tx_id', $providerTxId)->first();

                if (!$payment) {
                    Payment::create([
                        'bill_id' => $bill->id,
                        'method' => 'midtrans_' . $paymentType,
                        'provider_tx_id' => $providerTxId,
                        'order_id' => $orderId,
                        'amount' => $grossAmount,
                        'paid_at' => now(),
                        'status' => 'settled',
                    ]);
                } else {
                    $payment->update([
                        'method' => 'midtrans_' . $paymentType,
                        'provider_tx_id' => $providerTxId,
                        'order_id' => $orderId,
                        'amount' => $grossAmount,
                        'status' => 'settled',
                        'paid_at' => $payment->paid_at ?? now(),
                    ]);
                }
            }

            return response()->json([
                'message' => 'OK',
                'data' => [
                    'transaction_status' => $transactionStatus,
                    'payment_type' => $paymentType,
                    'order_id' => $orderId,
                    'bill_status' => $bill->status,
                ]
            ], 200);

        } catch (\Throwable $e) {
            // ✅ ini yang bikin ENDPOINT TIDAK PERNAH 500 tanpa info
            Log::error("PAYMENT STATUS FATAL: ".$e->getMessage(), [
                'order_id' => $orderId,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Internal error di status()',
                'error' => $e->getMessage(),
            ], 200);
        }
    }

    public function callback(Request $request)
    {
        $serverKey = env('MIDTRANS_SERVER_KEY');

        $orderId = $request->input('order_id');
        $statusCode = $request->input('status_code');
        $grossAmount = $request->input('gross_amount');
        $signatureKey = $request->input('signature_key');

        // Validasi signature
        $expectedSignature = hash('sha512', ($orderId ?? '') . ($statusCode ?? '') . ($grossAmount ?? '') . $serverKey);

        if (($signatureKey ?? '') !== $expectedSignature) {
            return response()->json(['message' => 'Invalid signature'], 403);
        }

        $transactionStatus = $request->input('transaction_status'); // settlement, pending, cancel, deny, expire
        $paymentType = $request->input('payment_type'); // bank_transfer, qris, gopay, dll
        $grossAmountFloat = (float) ($grossAmount ?? 0);

        // order_id format: PDAM-{billId}-{timestamp}
        $parts = explode('-', (string)$orderId);
        $billId = $parts[1] ?? null;

        if (!$billId || !is_numeric($billId)) {
            return response()->json(['message' => 'Bill id tidak ditemukan dari order_id'], 422);
        }

        $bill = Bill::find($billId);
        if (!$bill) {
            return response()->json(['message' => 'Tagihan tidak ditemukan'], 404);
        }

        $internalPaymentStatus = match ($transactionStatus) {
            'settlement', 'capture' => 'settled',
            'pending' => 'pending',
            'deny', 'cancel', 'expire' => 'failed',
            default => 'pending'
        };

        if (in_array($transactionStatus, ['settlement', 'capture'])) {
            if ($bill->status === 'unpaid') {
                $bill->update(['status' => 'paid']);
            }
            $bill->loadMissing('customer');
            if ($bill->customer && $bill->customer->status !== 'active') {
                $bill->customer->update(['status' => 'active']);
            }
        }

        $transactionId = $request->input('transaction_id');
        $providerTxId = $transactionId ?: $orderId;

        // ✅ cari by order_id dulu (stabil)
        $payment = Payment::where('order_id', $orderId)->first()
            ?? Payment::where('provider_tx_id', $providerTxId)->first();

        if (!$payment) {
            $payment = Payment::create([
                'bill_id' => $bill->id,
                'method' => 'midtrans_' . ($paymentType ?? 'unknown'),
                'provider_tx_id' => $providerTxId,
                'order_id' => $orderId,
                'amount' => (int) round($grossAmountFloat),
                'paid_at' => in_array($transactionStatus, ['settlement', 'capture']) ? now() : null,
                'status' => $internalPaymentStatus,
            ]);
        } else {
            $payment->update([
                'method' => 'midtrans_' . ($paymentType ?? 'unknown'),
                'provider_tx_id' => $providerTxId,
                'order_id' => $orderId,
                'amount' => (int) round($grossAmountFloat),
                'status' => $internalPaymentStatus,
                'paid_at' => in_array($transactionStatus, ['settlement', 'capture']) ? now() : $payment->paid_at,
            ]);
        }

        return response()->json(['message' => 'OK']);
    }

}
