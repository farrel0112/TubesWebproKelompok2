<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use Illuminate\Http\Request;

class BranchController extends Controller
{
    public function index()
    {
        $branches = Branch::all();

        return response()->json([
            'message' => 'Daftar kantor PDAM',
            'data' => $branches
        ]);
    }

    public function show($id)
    {
        $branch = Branch::find($id);

        if (!$branch) {
            return response()->json([
                'message' => 'Kantor tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'message' => 'Detail kantor PDAM',
            'data' => $branch
        ]);
    }
}

