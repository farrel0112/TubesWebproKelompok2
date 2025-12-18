<?php

namespace App\Http\Controllers;
use App\Models\Customer;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user()->load('customer');

        return response()->json($user);
    }

    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name'        => 'sometimes|string|max:100',
            'phone'       => 'sometimes|nullable|string|max:20',
            'email'       => 'sometimes|email|max:255',
            'address'     => 'sometimes|nullable|string',
            'province'    => 'sometimes|nullable|string|max:100',
            'city'        => 'sometimes|nullable|string|max:100',
            'postal_code' => 'sometimes|nullable|string|max:20',
            'nik'         => 'sometimes|nullable|string|max:32',
        ]);

        // update user
        $user->fill([
            'name'  => $validated['name']  ?? $user->name,
            'phone' => $validated['phone'] ?? $user->phone,
            'email' => $validated['email'] ?? $user->email,
        ])->save();

        // update customer
        $customer = $user->customer;
        if ($customer) {
            $customer->fill([
                'address'     => $validated['address']     ?? $customer->address,
                'province'    => $validated['province']    ?? $customer->province,
                'city'        => $validated['city']        ?? $customer->city,
                'postal_code' => $validated['postal_code'] ?? $customer->postal_code,
                'nik'         => $validated['nik']         ?? $customer->nik,
            ])->save();
        }

        return response()->json([
            'message' => 'Profil berhasil diperbarui',
            'user'    => $user->load('customer'),
        ]);
    }

}
