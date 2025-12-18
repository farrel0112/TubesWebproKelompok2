<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Complaint;
use App\Models\Customer;

class ComplaintController extends Controller
{
    public function storeEmergency(Request $request)
    {
        $validated = $request->validate([
            'message' => 'required|string|min:5|max:2000',
        ]);

        $user = auth('sanctum')->user(); // bisa null (guest)
        $customerId = null;

        if ($user) {
            $cust = Customer::where('user_id', $user->id)->first();
            $customerId = $cust?->id;
        }

        $c = Complaint::create([
            'user_id'     => $user?->id,
            'customer_id' => $customerId,
            'type'        => 'emergency',
            'message'     => $validated['message'],
            'status'      => 'new',
            'priority'    => 'emergency',
            'source'      => 'web',
            'ip_address'  => $request->ip(),
            'user_agent'  => substr((string)$request->userAgent(), 0, 255),
        ]);

        return response()->json([
            'message' => 'OK',
            'data' => $c,
        ], 201);
    }

    // GET /api/complaints (pegawai/admin)
    public function index(Request $request)
    {
        $q = $request->query('q');
        $status = $request->query('status');
        $type = $request->query('type'); // emergency/cs

        $rows = Complaint::with(['user','customer.user'])
            ->when($q, fn($qq) => $qq->where('message', 'like', "%$q%"))
            ->when($status, fn($qq) => $qq->where('status', $status))
            ->when($type, fn($qq) => $qq->where('type', $type))
            ->orderByDesc('id')
            ->get();

        return response()->json(['data' => $rows]);
    }

    // PUT /api/complaints/{id}
    public function updateStatus(Request $request, Complaint $complaint)
    {
        $validated = $request->validate([
            'status' => 'required|in:new,in_progress,resolved,rejected',
        ]);

        $complaint->update(['status' => $validated['status']]);

        return response()->json(['message' => 'OK', 'data' => $complaint]);
    }
}
