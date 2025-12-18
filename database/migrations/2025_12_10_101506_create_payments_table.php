<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('bill_id');
            $table->enum('method', ['qris', 'va', 'cash']);
            $table->string('provider_tx_id', 100)->nullable()->unique();
            $table->decimal('amount', 12, 2);
            $table->dateTime('paid_at')->nullable();
            $table->enum('status', ['pending', 'settled', 'failed'])->default('pending');
            $table->timestamps();

            $table->index('status', 'idx_payments_status');

            $table->foreign('bill_id')
                  ->references('id')->on('bills')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
