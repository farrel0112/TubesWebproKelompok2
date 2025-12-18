<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureRolePegawai
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        if (!$user || $user->role !== 'pegawai') {
            return response()->json(['message' => 'Forbidden (pegawai only)'], 403);
        }
        return $next($request);
    }
}
