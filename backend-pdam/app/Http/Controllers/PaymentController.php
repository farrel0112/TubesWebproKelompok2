<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Bill;
use Illuminate\Http\Request;

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
}
