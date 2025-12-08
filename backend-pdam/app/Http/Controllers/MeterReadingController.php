<?php

namespace App\Http\Controllers;

use App\Models\MeterReading;
use Illuminate\Http\Request;

class MeterReadingController extends Controller
{
    public function index()
    {
        $readings = MeterReading::with(['meter', 'staff'])->get();

        return response()->json([
            'message' => 'Daftar catatan pembacaan meter',
            'data' => $readings
        ]);
    }

    public function show($id)
    {
        $reading = MeterReading::with(['meter', 'staff'])->find($id);

        if (!$reading) {
            return response()->json(['message' => 'Data pembacaan tidak ditemukan'], 404);
        }

        return response()->json([
            'message' => 'Detail pembacaan meter',
            'data' => $reading
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'meter_id'   => 'required|exists:meters,id',
            'start_read' => 'required|numeric|min:0',
            'end_read'   => 'required|numeric|min:0|gte:start_read',
            'period'     => 'required|string|regex:/^\d{6}$/',
            'read_at'    => 'required|date',
        ]);

        $staffId = $request->user()->id;

        $reading = MeterReading::create([
            'meter_id'   => $request->meter_id,
            'start_read' => $request->start_read,
            'end_read'   => $request->end_read,
            'period'     => $request->period,
            'read_at'    => $request->read_at,
            'staff_id'   => $staffId,
        ]);

        return response()->json([
            'message' => 'Catatan pembacaan meter berhasil ditambahkan',
            'data' => $reading
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $reading = MeterReading::find($id);

        if (!$reading) {
            return response()->json(['message' => 'Data pembacaan tidak ditemukan'], 404);
        }

        $request->validate([
            'start_read' => 'numeric|min:0',
            'end_read'   => 'numeric|min:0',
            'period'     => 'string|regex:/^\d{6}$/',
            'read_at'    => 'date',
        ]);

        $start = $request->start_read ?? $reading->start_read;
        $end   = $request->end_read ?? $reading->end_read;

        if ($end < $start) {
            return response()->json([
                'message' => 'end_read harus lebih besar atau sama dengan start_read'
            ], 422);
        }

        $reading->update([
            'start_read' => $request->start_read ?? $reading->start_read,
            'end_read'   => $request->end_read ?? $reading->end_read,
            'period'     => $request->period ?? $reading->period,
            'read_at'    => $request->read_at ?? $reading->read_at,
        ]);

        return response()->json([
            'message' => 'Catatan pembacaan meter berhasil diperbarui',
            'data' => $reading
        ]);
    }

    public function destroy($id)
    {
        $reading = MeterReading::find($id);

        if (!$reading) {
            return response()->json(['message' => 'Data pembacaan tidak ditemukan'], 404);
        }

        $reading->delete();

        return response()->json([
            'message' => 'Catatan pembacaan meter berhasil dihapus'
        ]);
    }
}
