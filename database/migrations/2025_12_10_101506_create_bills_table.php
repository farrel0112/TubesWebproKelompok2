<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bills', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('customer_id');
            $table->char('period', 6);
            $table->decimal('usage_m3', 10, 3)->default(0.000);
            $table->decimal('charge', 12, 2)->default(0.00);
            $table->decimal('admin_fee', 12, 2)->default(0.00);
            // kolom generated: charge + admin_fee
            $table->decimal('total', 12, 2)->storedAs('charge + admin_fee');
            $table->enum('status', ['draft', 'unpaid', 'paid', 'overdue'])->default('draft');
            $table->date('due_date')->nullable();
            $table->string('invoice_no', 50)->unique();
            $table->timestamps();

            $table->unique(['customer_id', 'period'], 'uq_bill_period');
            $table->index('status', 'idx_bills_status');

            $table->foreign('customer_id')
                  ->references('id')->on('customers')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bills');
    }
};
