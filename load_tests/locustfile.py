import os
import random
from datetime import date

from locust import HttpUser, between, task
from locust.exception import StopUser


API_PREFIX = os.getenv("LOCUST_API_PREFIX", "/api")
ENABLE_WRITES = os.getenv("LOCUST_ENABLE_WRITES", "0").strip().lower() in {"1", "true", "yes", "on"}
TEST_PHONE = os.getenv("LOCUST_TEST_PHONE", "0771234567")
TEST_PICKUP_NOTE = os.getenv("LOCUST_TEST_PICKUP_NOTE", "Load test pickup")


def _credential_pool(pool_env, username_env, password_env):
    raw_pool = os.getenv(pool_env, "").strip()
    credentials = []

    if raw_pool:
        for entry in raw_pool.split(","):
            if ":" not in entry:
                continue
            username, password = entry.split(":", 1)
            username = username.strip()
            password = password.strip()
            if username and password:
                credentials.append((username, password))

    username = os.getenv(username_env, "").strip()
    password = os.getenv(password_env, "").strip()
    if username and password:
        credentials.append((username, password))

    return credentials


def _today_key():
    return date.today().isoformat()


class AuthenticatedApiUser(HttpUser):
    abstract = True
    wait_time = between(1, 4)
    credentials_env = ""
    username_env = ""
    password_env = ""

    def on_start(self):
        credentials = _credential_pool(self.credentials_env, self.username_env, self.password_env)
        if not credentials:
            raise StopUser(
                f"Missing credentials. Set {self.credentials_env} or "
                f"{self.username_env}/{self.password_env}."
            )

        username, password = random.choice(credentials)
        with self.client.post(
            f"{API_PREFIX}/auth/login/",
            json={"username": username, "password": password},
            name="/api/auth/login/",
            catch_response=True,
        ) as response:
            if response.status_code != 200:
                response.failure(f"login failed for {username}: {response.text[:200]}")
                raise StopUser()

            data = response.json()
            access = data.get("access")
            if not access:
                response.failure("login response did not include an access token")
                raise StopUser()

            response.success()
            self.headers = {"Authorization": f"Bearer {access}"}
            self.username = username

    def get_auth(self, path, **kwargs):
        return self.client.get(path, headers=self.headers, **kwargs)

    def post_auth(self, path, **kwargs):
        return self.client.post(path, headers=self.headers, **kwargs)


class StudentPortalUser(AuthenticatedApiUser):
    weight = 4
    credentials_env = "LOCUST_STUDENT_USERS"
    username_env = "LOCUST_STUDENT_USERNAME"
    password_env = "LOCUST_STUDENT_PASSWORD"

    def on_start(self):
        super().on_start()
        self.cached_items = []
        self.refresh_items()

    def refresh_items(self):
        response = self.get_auth(f"{API_PREFIX}/meals/student-items/", name="/api/meals/student-items/")
        if response.status_code == 200:
            self.cached_items = response.json()

    @task(5)
    def browse_menu_items(self):
        self.refresh_items()

    @task(3)
    def browse_meal_packages(self):
        self.get_auth(f"{API_PREFIX}/meals/types/", name="/api/meals/types/")
        self.get_auth(f"{API_PREFIX}/pos/weekly-meal-plan/", name="/api/pos/weekly-meal-plan/")

    @task(3)
    def view_orders_and_notifications(self):
        self.get_auth(f"{API_PREFIX}/meals/orders/", name="/api/meals/orders/")
        self.get_auth(f"{API_PREFIX}/meals/notifications/", name="/api/meals/notifications/")

    @task(1)
    def place_menu_item_order(self):
        if not ENABLE_WRITES:
            return

        if not self.cached_items:
            self.refresh_items()
        if not self.cached_items:
            return

        item = random.choice(self.cached_items)
        payload = {
            "order_type": "item",
            "item": item["id"],
            "quantity": random.randint(1, 3),
            "delivery_type": "takeaway",
            "phone_number": TEST_PHONE,
            "delivery_address": TEST_PICKUP_NOTE,
        }

        with self.post_auth(
            f"{API_PREFIX}/meals/orders/",
            json=payload,
            name="/api/meals/orders/ [student item order]",
            catch_response=True,
        ) as response:
            if response.status_code in {200, 201}:
                response.success()
                return

            if response.status_code == 400 and "available from 4:00 AM" in response.text:
                response.success()
                return

            response.failure(response.text[:300])


class CashierPortalUser(AuthenticatedApiUser):
    weight = 1
    credentials_env = "LOCUST_CASHIER_USERS"
    username_env = "LOCUST_CASHIER_USERNAME"
    password_env = "LOCUST_CASHIER_PASSWORD"

    def on_start(self):
        super().on_start()
        self.cached_items = []
        self.refresh_pos_items()

    def refresh_pos_items(self):
        response = self.get_auth(f"{API_PREFIX}/pos/items/", name="/api/pos/items/")
        if response.status_code == 200:
            self.cached_items = response.json()

    @task(5)
    def monitor_online_orders(self):
        self.get_auth(f"{API_PREFIX}/meals/online-orders/", name="/api/meals/online-orders/")

    @task(3)
    def view_bill_history(self):
        params = {"date": os.getenv("LOCUST_HISTORY_DATE", _today_key())}
        self.get_auth(f"{API_PREFIX}/pos/orders/", params=params, name="/api/pos/orders/")
        self.get_auth(f"{API_PREFIX}/pos/orders/summary/", params=params, name="/api/pos/orders/summary/")
        self.get_auth(f"{API_PREFIX}/meals/bills/walk-in/list/", name="/api/meals/bills/walk-in/list/")

    @task(2)
    def browse_pos_data(self):
        self.get_auth(f"{API_PREFIX}/pos/categories/", name="/api/pos/categories/")
        self.refresh_pos_items()

    @task(1)
    def create_walk_in_bill(self):
        if not ENABLE_WRITES:
            return

        if not self.cached_items:
            self.refresh_pos_items()
        if not self.cached_items:
            return

        item = random.choice(self.cached_items)
        payload = {
            "customer_name": f"Load Test {random.randint(1000, 9999)}",
            "items": [
                {
                    "name": item["name"],
                    "quantity": random.randint(1, 2),
                    "unit_price": str(item["price"]),
                }
            ],
        }
        self.post_auth(f"{API_PREFIX}/meals/bills/walk-in/", json=payload, name="/api/meals/bills/walk-in/")


class NegativeSecurityUser(HttpUser):
    weight = 1
    wait_time = between(2, 6)

    @task(2)
    def protected_endpoint_requires_login(self):
        with self.client.get(
            f"{API_PREFIX}/meals/orders/",
            name="/api/meals/orders/ [unauthenticated]",
            catch_response=True,
        ) as response:
            if response.status_code in {401, 403}:
                response.success()
            else:
                response.failure(f"expected 401/403, got {response.status_code}")

    @task(1)
    def invalid_login_is_rejected(self):
        with self.client.post(
            f"{API_PREFIX}/auth/login/",
            json={"username": "not-a-real-user", "password": "wrong-password"},
            name="/api/auth/login/ [invalid credentials]",
            catch_response=True,
        ) as response:
            if response.status_code in {400, 401}:
                response.success()
            else:
                response.failure(f"expected invalid login rejection, got {response.status_code}")
