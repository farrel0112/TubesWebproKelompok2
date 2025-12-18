<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\BillController;
use App\Http\Controllers\AuthController;

Route::get('/invoice/{id}', [BillController::class, 'invoice'])->name('invoice.download');

Route::get('/', function () {
    return file_get_contents(public_path('index.html'));
});