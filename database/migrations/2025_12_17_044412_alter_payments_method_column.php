<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->string('method', 50)->change();
        });
    }

    public function down(): void
    {
        // kalau sebelumnya enum, kamu bisa balikin sesuai kondisi awalmu.
        // contoh:
        // $table->enum('method', ['cash','transfer','qris'])->change();
    }
};
