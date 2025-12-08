<?php

namespace App\Http\Controllers;

use App\Models\Bill;
use App\Models\MeterReading;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class BillController extends Controller
{
    public function index()
    {
        $bills = Bill::with(['customer'])->get();

        return response()->json([
            'message' => 'Daftar tagihan',
            'data'    => $bills
        ]);
    }

    public function show($id)
    {
        $bill = Bill::with(['customer', 'payments'])->find($id);

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
        $bill = Bill::with(['customer', 'payments'])->find($id);

        if (!$bill) {
            return response()->json(['message' => 'Tagihan tidak ditemukan'], 404);
        }

        $data = [
            'title'       => 'Invoice Tagihan PDAM',
            'bill'        => $bill,
            'customer'    => $bill->customer,
            'payments'    => $bill->payments,
        ];

        $pdf = Pdf::loadView('invoice', $data)->setPaper('A4');

        return $pdf->download("invoice_{$bill->invoice_no}.pdf");
    }
}