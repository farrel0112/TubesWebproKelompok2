<?php

namespace App\Providers;

use App\Models\Bill;
use Illuminate\Support\ServiceProvider;
use App\Observers\BillObserver;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Bill::observe(BillObserver::class);
    }
}
