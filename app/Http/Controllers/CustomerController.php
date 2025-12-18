<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index()
    {
        $data = Customer::with('user')->whereHas('user', function ($q) {
            $q->where('role', 'pelanggan');
        })->get();

        return response()->json([
            'message' => 'Data customer berhasil diambil',
            'data' => $data
        ]);
    }

    public function show($id)
    {
        $customer = Customer::with(['user', 'meters', 'bills'])->find($id);

        if (!$customer) {
            return response()->json(['message' => 'Customer tidak ditemukan'], 404);
        }

        return response()->json([
            'message' => 'Detail customer',
            'data' => $customer
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'customer_no' => 'required|string|max:50|unique:customers,customer_no',
            'user_id' => 'required|exists:users,id',
            'address' => 'nullable|string',
            'status' => 'in:active,inactive'
        ]);

        $customer = Customer::create($request->all());

        return response()->json([
            'message' => 'Customer berhasil ditambahkan',
            'data' => $customer
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $customer = Customer::find($id);

        if (!$customer) {
            return response()->json(['message' => 'Customer tidak ditemukan'], 404);
        }

        $request->validate([
            'customer_no' => 'string|max:50|unique:customers,customer_no,' . $id,
            'user_id' => 'exists:users,id',
            'address' => 'nullable|string',
            'status' => 'in:active,inactive',
        ]);

        $customer->update($request->all());

        return response()->json([
            'message' => 'Customer berhasil diperbarui',
            'data' => $customer
        ]);
    }

    public function destroy($id)
    {
        $customer = Customer::find($id);

        if (!$customer) {
            return response()->json(['message' => 'Customer tidak ditemukan'], 404);
        }

        $customer->delete();

        return response()->json([
            'message' => 'Customer berhasil dihapus'
        ]);
    }
}
