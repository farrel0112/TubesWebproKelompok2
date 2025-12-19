<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; }
        .header { text-align: center; margin-bottom: 20px; }
        .logo { width: 80px; }
        .info-table, .detail-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .detail-table th, .detail-table td {
            border: 1px solid #000; padding: 6px;
        }
        .right { text-align: right; }
        .signature { margin-top: 40px; text-align: right; }
        .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #777; }
    </style>
</head>

<body>

<div class="header">

    @php
        $logo = public_path('logo.jpg');
        $userName = $customer?->user?->name ?? '-';

        $fullAddress = collect([
            $customer?->address,
            $customer?->city,
            $customer?->province,
            $customer?->postal_code ? '(' . $customer->postal_code . ')' : null,
        ])->filter()->implode(', ');
    @endphp

    @if(file_exists($logo))
        <img src="{{ $logo }}" class="logo">
    @else
        <p><strong>LOGO TIDAK DITEMUKAN</strong></p>
    @endif

    <h2>PERUMDA TIRTA SUGI LAENDE</h2>
    <h3>INVOICE PEMAKAIAN AIR</h3>
    <p>No. Invoice: <strong>{{ $bill->invoice_no }}</strong></p>
</div>

<h4>Data Pelanggan</h4>
<table class="info-table">
    <tr>
        <td>Nama Pelanggan</td>
        <td>: {{ $userName }}</td>
    </tr>
    <tr>
        <td>Alamat</td>
        <td>: {{ $fullAddress ?: '-' }}</td>
    </tr>
    <tr>
        <td>Periode</td>
        <td>: {{ $bill->period }}</td>
    </tr>
</table>


<h4>Rincian Pemakaian</h4>
<table class="detail-table">
    <tr>
        <th>Usage (m³)</th>
        <th>Tarif</th>
        <th>Biaya Pakai</th>
        <th>Biaya Admin</th>
        <th>Total Tagihan</th>
    </tr>
    <tr>
        <td>{{ number_format($bill->usage_m3, 2) }}</td>
        <td>Rp 2.500 / m³</td>
        <td>Rp {{ number_format($bill->charge, 0, ',', '.') }}</td>
        <td>Rp {{ number_format($bill->admin_fee, 0, ',', '.') }}</td>
        <td><strong>Rp {{ number_format($bill->total, 0, ',', '.') }}</strong></td>
    </tr>
</table>

<h4>Status Pembayaran</h4>

@php
  $paidAt = $paidPayment?->paid_at;
@endphp

<p>
  Status: <strong>{{ strtoupper($bill->status) }}</strong><br>

  @if ($paidAt)
    Tanggal Pembayaran:
    <strong>{{ \Carbon\Carbon::parse($paidAt)->format('d M Y H:i') }}</strong>
  @else
    Tanggal Pembayaran: <strong>-</strong>
  @endif
</p>

<div class="signature">
    <p>Muna, {{ date('d M Y') }}</p>
    <br><br>
    <p><strong>Direktur PDAM</strong></p>
</div>

<div class="footer">
    <p>Invoice ini diterbitkan otomatis oleh sistem PDAM. Tidak perlu tanda tangan basah.</p>
</div>

</body>
</html>
