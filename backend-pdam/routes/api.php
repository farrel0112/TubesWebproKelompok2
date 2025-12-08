<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\BillController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\MeterController;
use App\Http\Controllers\MeterReadingController;
use App\Http\Controllers\PaymentController;


Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

Route::get('/branches',        [BranchController::class, 'index']);
Route::get('/branches/{id}',   [BranchController::class, 'show']);


Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout',  [AuthController::class, 'logout']);
    Route::get('/profile',  [AuthController::class, 'profile']);

    Route::get('/bills', [BillController::class, 'index']);
    Route::get('/bills/{id}', [BillController::class, 'show']);

    Route::get('/customers', [CustomerController::class, 'index']);
    Route::get('/customers/{id}', [CustomerController::class, 'show']);
    Route::post('/customers', [CustomerController::class, 'store']);
    Route::put('/customers/{id}', [CustomerController::class, 'update']);
    Route::delete('/customers/{id}', [CustomerController::class, 'destroy']);

    Route::get('/meters', [MeterController::class, 'index']);
    Route::get('/meters/{id}', [MeterController::class, 'show']);
    Route::post('/meters', [MeterController::class, 'store']);
    Route::put('/meters/{id}', [MeterController::class, 'update']);
    Route::delete('/meters/{id}', [MeterController::class, 'destroy']);

    Route::get('/meter-readings', [MeterReadingController::class, 'index']);
    Route::get('/meter-readings/{id}', [MeterReadingController::class, 'show']);
    Route::post('/meter-readings', [MeterReadingController::class, 'store']);
    Route::put('/meter-readings/{id}', [MeterReadingController::class, 'update']);
    Route::delete('/meter-readings/{id}', [MeterReadingController::class, 'destroy']);

    Route::get('/bills', [BillController::class, 'index']);
    Route::get('/bills/{id}', [BillController::class, 'show']);
    Route::post('/bills/generate', [BillController::class, 'generate']);
    Route::put('/bills/{id}', [BillController::class, 'update']);
    Route::delete('/bills/{id}', [BillController::class, 'destroy']);
    Route::get('/bills/{id}/invoice', [BillController::class, 'invoice']);

    Route::get('/payments', [PaymentController::class, 'index']);
    Route::get('/payments/{id}', [PaymentController::class, 'show']);
    Route::post('/payments', [PaymentController::class, 'store']);
    Route::delete('/payments/{id}', [PaymentController::class, 'destroy']);
});
