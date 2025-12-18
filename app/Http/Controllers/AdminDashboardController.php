<?php

namespace App\Http\Controllers;

use App\Models\Bill;
use App\Models\Customer;
use App\Models\MeterReading;
use App\Models\Complaint;

class AdminDashboardController extends Controller
{
    public function summary()
    {
        $totalCustomers = Customer::whereHas('user', function ($q) {
            $q->where('role', 'pelanggan');
        })->count();

        $activeCustomers = Customer::where('status', 'active')
            ->whereHas('user', function ($q) {
                $q->where('role', 'pelanggan');
            })->count();

        $month = now()->format('Ym');
        $readingsThisMonth = MeterReading::where('period', $month)->count();

        $billsThisMonth = Bill::where('period', $month)->count();
        $unpaidBills = Bill::where('status', 'unpaid')->count();
        $overdueBills = Bill::where('status', 'overdue')->count();
        $paidBills = Bill::where('status', 'paid')->count();

        $openComplaints = class_exists(Complaint::class)
            ? Complaint::whereIn('status', ['new','in_progress', 'rejected', 'resolved'])->count()
            : 0;

        return response()->json([
            'data' => [
                'total_customers' => $totalCustomers,
                'active_customers' => $activeCustomers,
                'readings_this_month' => $readingsThisMonth,
                'bills_this_month' => $billsThisMonth,
                'bills_unpaid' => $unpaidBills,
                'bills_overdue' => $overdueBills,
                'bills_paid' => $paidBills,
                'open_complaints' => $openComplaints,
                'period' => $month,
            ]
        ]);
    }
}
