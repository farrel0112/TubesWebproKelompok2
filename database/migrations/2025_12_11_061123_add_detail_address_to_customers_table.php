<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->string('province', 100)->nullable()->after('address');
            $table->string('city', 100)->nullable()->after('province');
            $table->string('postal_code', 20)->nullable()->after('city');
            $table->string('nik', 32)->nullable()->after('postal_code');
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['province', 'city', 'postal_code', 'nik']);
        });
    }
};
