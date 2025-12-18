<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('meter_readings', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('meter_id');
            $table->char('period', 6);
            $table->decimal('start_read', 10, 3)->default(0.000);
            $table->decimal('end_read', 10, 3)->default(0.000);
            // kolom generated (sama seperti di SQL: end_read - start_read)
            $table->decimal('usage_m3', 10, 3)->storedAs('end_read - start_read');
            $table->dateTime('read_at')->nullable();
            $table->unsignedBigInteger('staff_id')->nullable();
            $table->timestamps();

            $table->unique(['meter_id', 'period'], 'uq_meter_period');

            $table->foreign('meter_id')
                  ->references('id')->on('meters')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');

            $table->foreign('staff_id')
                  ->references('id')->on('users')
                  ->onDelete('set null')
                  ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('meter_readings');
    }
};
