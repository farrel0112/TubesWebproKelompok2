
### **PDAM Kabupaten Muna API Documentation**

```markdown
# PDAM API Documentation

Dokumentasi lengkap untuk semua endpoint API yang tersedia di aplikasi PDAM.

---

## Base URL
```

[http://localhost:8000]

````

---

## Authentication

Sistem ini menggunakan autentikasi berbasis token menggunakan Laravel Sanctum. Semua permintaan yang memerlukan autentikasi harus menyertakan token yang valid di header **Authorization**.

---

## Authentication Endpoints

### ## 1. Register
```http
POST /register
````

**Middleware:** guest

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123",
  "password_confirmation": "password123"
}
```

**Success Response (201):**

```json
{
  "message": "Registration successful",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com"
  }
}
```

---

### ## 2. Login

```http
POST /login
```

**Middleware:** guest

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200):**

```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com"
  },
  "token": "valid-jwt-token"
}
```

---

### ## 3. Logout

```http
POST /logout
```

**Middleware:** auth:sanctum

**Success Response (200):**

```json
{
  "message": "Logged out successfully"
}
```

---

## Profile Endpoints

### ## 1. Show Profile

```http
GET /profile
```

**Middleware:** auth:sanctum

**Success Response (200):**

```json
{
  "id": 1,
  "name": "John Doe",
  "email": "user@example.com"
}
```

---

### ## 2. Update Profile

```http
PUT /profile
```

**Middleware:** auth:sanctum

**Request Body:**

```json
{
  "name": "John Updated",
  "email": "newemail@example.com"
}
```

**Success Response (200):**

```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": 1,
    "name": "John Updated",
    "email": "newemail@example.com"
  }
}
```

---

## Bill Endpoints

### ## 1. Get All Bills

```http
GET /bills
```

**Middleware:** auth:sanctum

**Success Response (200):**

```json
{
  "bills": [
    {
      "id": 1,
      "amount": 50000,
      "due_date": "2025-12-30",
      "status": "unpaid"
    }
  ]
}
```

---

### ## 2. Get Bill by ID

```http
GET /bills/{id}
```

**Middleware:** auth:sanctum

**Success Response (200):**

```json
{
  "id": 1,
  "amount": 50000,
  "due_date": "2025-12-30",
  "status": "unpaid",
  "customer": {
    "id": 1,
    "name": "John Doe"
  }
}
```

---

### ## 3. Pay Bill

```http
POST /bills/{id}/pay
```

**Middleware:** auth:sanctum

**Request Body:**

```json
{
  "payment_method": "credit_card"
}
```

**Success Response (200):**

```json
{
  "message": "Payment successful",
  "payment": {
    "id": 1,
    "amount": 50000,
    "method": "credit_card",
    "status": "completed"
  }
}
```

---

## Meter Endpoints

### ## 1. Get Meter Status

```http
GET /meter-status/{customerNo}
```

**Middleware:** auth:sanctum

**Success Response (200):**

```json
{
  "customerNo": "12345",
  "meter_status": "active",
  "reading": 150
}
```

---

### ## 2. Get Meter Reading History

```http
GET /meter-readings
```

**Middleware:** auth:sanctum

**Success Response (200):**

```json
{
  "meter_readings": [
    {
      "id": 1,
      "reading": 150,
      "timestamp": "2025-12-21T10:00:00.000000Z"
    }
  ]
}
```

---

## Complaint Endpoints

### ## 1. Create Complaint

```http
POST /complaints/emergency
```

**Middleware:** auth:sanctum

**Request Body:**

```json
{
  "description": "Emergency complaint regarding water supply"
}
```

**Success Response (201):**

```json
{
  "message": "Complaint submitted successfully",
  "complaint": {
    "id": 1,
    "description": "Emergency complaint regarding water supply",
    "status": "pending"
  }
}
```

---

## Admin Endpoints

### ## 1. Dashboard Admin

```http
GET /admin/dashboard
```

**Middleware:** auth:sanctum, admin

**Success Response (200):**

```json
{
  "total_customers": 100,
  "total_bills": 1500,
  "total_payments": 1200
}
```

---

### ## 2. Manajemen Pelanggan

#### ## **GET** `/admin/customers`

```http
GET /admin/customers
```

**Middleware:** auth:sanctum, admin

**Success Response (200):**

```json
{
  "customers": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@example.com"
    }
  ]
}
```

#### ## **POST** `/admin/customers`

```http
POST /admin/customers
```

**Middleware:** auth:sanctum, admin

**Request Body:**

```json
{
  "name": "Jane Doe",
  "email": "jane.doe@example.com",
  "password": "password123"
}
```

**Success Response (201):**

```json
{
  "message": "Customer created successfully",
  "customer": {
    "id": 2,
    "name": "Jane Doe",
    "email": "jane.doe@example.com"
  }
}
```

#### ## **PUT** `/admin/customers/{id}`

```http
PUT /admin/customers/{id}
```

**Middleware:** auth:sanctum, admin

**Request Body:**

```json
{
  "name": "John Updated",
  "email": "newemail@example.com"
}
```

**Success Response (200):**

```json
{
  "message": "Customer updated successfully",
  "customer": {
    "id": 1,
    "name": "John Updated",
    "email": "newemail@example.com"
  }
}
```

#### ## **DELETE** `/admin/customers/{id}`

```http
DELETE /admin/customers/{id}
```

**Middleware:** auth:sanctum, admin

**Success Response (200):**

```json
{
  "message": "Customer deleted successfully"
}
```

---

### ## 3. Manajemen Meter

#### ## **GET** `/admin/meters`

```http
GET /admin/meters
```

**Middleware:** auth:sanctum, admin

**Success Response (200):**

```json
{
  "meters": [
    {
      "id": 1,
      "customer_id": 1,
      "status": "active"
    }
  ]
}
```

#### ## **POST** `/admin/meters`

```http
POST /admin/meters
```

**Middleware:** auth:sanctum, admin

**Request Body:**

```json
{
  "customer_id": 2,
  "status": "active"
}
```

**Success Response (201):**

```json
{
  "message": "Meter created successfully",
  "meter": {
    "id": 2,
    "customer_id": 2,
    "status": "active"
  }
}
```

---

### ## 4. Manajemen Tagihan

#### ## **POST** `/admin/bills/generate`

```http
POST /admin/bills/generate
```

**Middleware:** auth:sanctum, admin

**Request Body:**

```json
{
  "customer_id": 1,
  "amount": 50000,
  "due_date": "2025-12-30"
}
```

**Success Response (201):**

```json
{
  "message": "Bill generated successfully",
  "bill": {
    "id": 1,
    "amount": 50000,
    "due_date": "2025-12-30",
    "status": "unpaid"
  }
}
```

---

### ## 5. Manajemen Pembayaran

#### ## **GET** `/admin/payments`

```http
GET /admin/payments
```

**Middleware:** auth:sanctum, admin

**Success Response (200):**

```json
{
  "payments": [
    {
      "id": 1,
      "amount": 50000,
      "status": "completed",
      "method": "credit_card"
    }
  ]
}
```

---

### ## 6. Manajemen Pengaduan

#### ## **GET** `/admin/complaints`

```http
GET /admin/complaints
```

**Middleware:** auth:sanctum, admin

**Success Response (200):**

```json
{
  "complaints": [
    {
      "id": 1,
      "description": "Emergency complaint",
      "status": "pending"
    }
  ]
}

## Support

Untuk pertanyaan atau masalah terkait API, silakan buat issue di [GitHub Issues](https://github.com/farrel0112/TubesWebproKelompok2).

