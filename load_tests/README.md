# Load Testing

This folder contains Locust scenarios for testing how the API behaves when many
students and cashiers use the system at the same time.

Run these tests against a local or staging server first. Do not run write-heavy
tests against production unless you are intentionally generating test orders and
test bills.

## Install

From the project root:

```powershell
.\venv\Scripts\python.exe -m pip install -r requirements-load.txt
```

## Start The Backend

In one terminal:

```powershell
.\venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000
```

## Configure Test Users

Use real existing test accounts, or create temporary local load-test accounts.

To create temporary load-test accounts:

```powershell
.\venv\Scripts\python.exe load_tests\manage_load_users.py create
```

To remove them after testing:

```powershell
.\venv\Scripts\python.exe load_tests\manage_load_users.py cleanup
```

You can provide one account or a comma-separated pool.

```powershell
$env:LOCUST_STUDENT_USERS="student1:password1,student2:password2"
$env:LOCUST_CASHIER_USERS="cashier1:password1"
```

Temporary account pool created by the helper:

```powershell
$env:LOCUST_STUDENT_USERS="load_student_1:LoadTestPass123!,load_student_2:LoadTestPass123!,load_student_3:LoadTestPass123!"
$env:LOCUST_CASHIER_USERS="load_cashier_1:LoadTestPass123!"
```

If you only have one test account:

```powershell
$env:LOCUST_STUDENT_USERNAME="Kitlar"
$env:LOCUST_STUDENT_PASSWORD="your-password"
$env:LOCUST_CASHIER_USERNAME="dashvan"
$env:LOCUST_CASHIER_PASSWORD="your-password"
```

## Safe Read-Only Test

This is the recommended first test. It logs users in and repeatedly loads menu,
orders, notifications, online orders, POS data, and bill history.

```powershell
.\venv\Scripts\locust.exe -f load_tests\locustfile.py --host http://127.0.0.1:8000
```

Then open:

```text
http://localhost:8089
```

Start small:

```text
Users: 20
Spawn rate: 2
```

Then increase gradually:

```text
Users: 50
Spawn rate: 5
```

## Headless Read-Only Test

```powershell
.\venv\Scripts\locust.exe -f load_tests\locustfile.py --host http://127.0.0.1:8000 --users 50 --spawn-rate 5 --run-time 5m --headless --html load_tests\load-report.html
```

## Write Test

This creates real menu item orders and walk-in bills. Use only test accounts and
a test database.

```powershell
$env:LOCUST_ENABLE_WRITES="1"
.\venv\Scripts\locust.exe -f load_tests\locustfile.py --host http://127.0.0.1:8000 --users 20 --spawn-rate 2 --run-time 2m --headless --html load_tests\write-load-report.html
```

Menu item order writes may be rejected outside shop ordering hours. That is
expected and is counted as a successful business-rule response when the API says
orders are available from 4:00 AM.

## Useful Classes

You can run only one user type if needed:

```powershell
.\venv\Scripts\locust.exe -f load_tests\locustfile.py --host http://127.0.0.1:8000 StudentPortalUser
```

```powershell
.\venv\Scripts\locust.exe -f load_tests\locustfile.py --host http://127.0.0.1:8000 CashierPortalUser
```

```powershell
.\venv\Scripts\locust.exe -f load_tests\locustfile.py --host http://127.0.0.1:8000 NegativeSecurityUser
```

## What To Watch

- Requests per second: how much traffic the API handles.
- Failure rate: keep it near `0%` for read-only tests.
- 95th percentile response time: should stay comfortable under load.
- Duplicate bills/order references: should never happen.
- Database errors or lock timeouts: should not appear in the Django terminal.
- Cashier online orders page: should remain usable while tests run.

## Environment Variables

- `LOCUST_API_PREFIX`: defaults to `/api`.
- `LOCUST_STUDENT_USERS`: comma-separated `username:password` pairs.
- `LOCUST_CASHIER_USERS`: comma-separated `username:password` pairs.
- `LOCUST_STUDENT_USERNAME` / `LOCUST_STUDENT_PASSWORD`: single student fallback.
- `LOCUST_CASHIER_USERNAME` / `LOCUST_CASHIER_PASSWORD`: single cashier fallback.
- `LOCUST_ENABLE_WRITES`: set to `1` to create test orders and walk-in bills.
- `LOCUST_HISTORY_DATE`: date for cashier bill history checks, defaults to today.
- `LOCUST_TEST_PHONE`: phone number used for test orders.
- `LOCUST_TEST_PICKUP_NOTE`: pickup note used for test orders.
