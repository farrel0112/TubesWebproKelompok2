<?php

namespace App\Http\Controllers;

use App\Models\Meter;
use Illuminate\Http\Request;

class MeterController extends Controller
{
    public function index()
    {
        $meters = Meter::with('customer')->get();

        return response()->json([
            'message' => 'Daftar meter air',
            'data' => $meters
        ]);
    }

    public function show($id)
    {
        $meter = Meter::with(['customer', 'readings'])->find($id);

        if (!$meter) {
            return response()->json(['message' => 'Meter tidak ditemukan'], 404);
        }

        return response()->json([
            'message' => 'Detail meter air',
            'data' => $meter
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'serial_no' => 'required|string|max:100|unique:meters,serial_no',
            'install_date' => 'required|date',
        ]);

        $meter = Meter::create($request->all());

        return response()->json([
            'message' => 'Meter berhasil ditambahkan',
            'data' => $meter
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $meter = Meter::find($id);

        if (!$meter) {
            return response()->json(['message' => 'Meter tidak ditemukan'], 404);
        }

        $request->validate([
            'customer_id' => 'exists:customers,id',
            'serial_no' => 'string|max:100|unique:meters,serial_no,' . $id,
            'install_date' => 'date',
        ]);

        $meter->update($request->all());

        return response()->json([
            'message' => 'Meter berhasil diperbarui',
            'data' => $meter
        ]);
    }

    public function destroy($id)
    {
        $meter = Meter::find($id);

        if (!$meter) {
            return response()->json(['message' => 'Meter tidak ditemukan'], 404);
        }

        $meter->delete();

        return response()->json(['message' => 'Meter berhasil dihapus']);
    }
}
