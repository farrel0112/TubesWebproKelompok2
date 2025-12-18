<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\BillController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\MeterController;
use App\Http\Controllers\MeterReadingController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AdminPaymentController;
use App\Http\Controllers\ComplaintController;
use App\Http\Controllers\MeterStatusController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

Route::get('/branches',      [BranchController::class, 'index']);
Route::get('/branches/{id}', [BranchController::class, 'show']);

Route::post('/payments/callback', [PaymentController::class, 'callback']);
Route::get('/payments/status/{orderId}', [PaymentController::class, 'status']);
Route::post('/complaints/emergency', [ComplaintController::class, 'storeEmergency']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);

    Route::get('/me/payment-history', [BillController::class, 'myPaymentHistory']);

    // Pelanggan: cek tagihan berdasarkan periode
    Route::get('/tagihan', [BillController::class, 'filterByPeriode']);

    // Pelanggan: lihat tagihan miliknya (index/show/invoice)
    Route::get('/bills',              [BillController::class, 'index']);
    Route::get('/bills/{id}',         [BillController::class, 'show']);
    Route::get('/bills/{id}/invoice', [BillController::class, 'invoice']);

    // Pelanggan: cek status meter & kubikasi (read only)
    Route::get('/meter-readings',      [MeterReadingController::class, 'index']);
    Route::get('/meter-readings/{id}', [MeterReadingController::class, 'show']);
    Route::get('/meter-status/{customerNo}', [MeterStatusController::class, 'show']);

    // Pelanggan: pembayaran online + riwayat transaksi
    Route::get('/payments',      [PaymentController::class, 'index']);
    Route::get('/payments/{id}', [PaymentController::class, 'show']);
    Route::post('/payments',     [PaymentController::class, 'store']);
    Route::post('/payments/snap-token/{bill}',[PaymentController::class, 'snapToken']);
});

Route::middleware(['auth:sanctum', 'pegawai'])->group(function () {
    Route::get('/admin/dashboard', [AdminDashboardController::class, 'summary']);

    // Manajemen pelanggan (CRUD)
    Route::get('/customers',         [CustomerController::class, 'index']);
    Route::get('/customers/{id}',    [CustomerController::class, 'show']);
    Route::post('/customers',        [CustomerController::class, 'store']);
    Route::put('/customers/{id}',    [CustomerController::class, 'update']);
    Route::delete('/customers/{id}', [CustomerController::class, 'destroy']);

    // Manajemen meter (CRUD)
    Route::get('/meters',         [MeterController::class, 'index']);
    Route::get('/meters/{id}',    [MeterController::class, 'show']);
    Route::post('/meters',        [MeterController::class, 'store']);
    Route::put('/meters/{id}',    [MeterController::class, 'update']);
    Route::delete('/meters/{id}', [MeterController::class, 'destroy']);

    // Input/ubah/hapus meter reading (pegawai)
    Route::post('/meter-readings',        [MeterReadingController::class, 'store']);
    Route::put('/meter-readings/{id}',    [MeterReadingController::class, 'update']);
    Route::delete('/meter-readings/{id}', [MeterReadingController::class, 'destroy']);

    // Generate & update tagihan (pegawai)
    Route::post('/bills/generate', [BillController::class, 'generate']);
    Route::put('/bills/{id}',      [BillController::class, 'update']);
    Route::delete('/bills/{id}',   [BillController::class, 'destroy']);
    Route::post('/bills/{bill}/mark-paid', [BillController::class, 'markPaidOffline']);

    // Admin payment list
    Route::get('/admin/payments', [AdminPaymentController::class, 'index']);

    // Hapus payment (pegawai)
    Route::delete('/payments/{id}', [PaymentController::class, 'destroy']);

    // Pegawai: update status pengaduan + hapus (opsional)
    Route::get('/complaints', [ComplaintController::class, 'index']);
    Route::put('/complaints/{complaint}', [ComplaintController::class, 'updateStatus']);
});
