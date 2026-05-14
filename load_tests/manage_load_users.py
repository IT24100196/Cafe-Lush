import os
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "hotel_pos_backend.settings")

import django  # noqa: E402

django.setup()

from django.db import connection  # noqa: E402
from authentication.models import Role, User  # noqa: E402
from meals.models import Student  # noqa: E402


PASSWORD = os.getenv("LOAD_TEST_PASSWORD", "LoadTestPass123!")
STUDENT_USERS = ["load_student_1", "load_student_2", "load_student_3"]
CASHIER_USERS = ["load_cashier_1"]
TEMP_USERNAMES = STUDENT_USERS + CASHIER_USERS


def create_users():
    student_role, _ = Role.objects.get_or_create(name=Role.STUDENT)
    cashier_role, _ = Role.objects.get_or_create(name=Role.CASHIER)

    for index, username in enumerate(STUDENT_USERS, start=1):
        user, _ = User.objects.get_or_create(
            username=username,
            defaults={"role": student_role, "email": f"{username}@load.test"},
        )
        user.role = student_role
        user.email = f"{username}@load.test"
        user.is_active = True
        user.set_password(PASSWORD)
        user.save()

        Student.objects.update_or_create(
            student_code=f"LOAD-STUDENT-{index}",
            defaults={
                "full_name": f"Load Student {index}",
                "contact": "0771234567",
                "user": user,
            },
        )

    for username in CASHIER_USERS:
        user, _ = User.objects.get_or_create(
            username=username,
            defaults={"role": cashier_role, "email": f"{username}@load.test"},
        )
        user.role = cashier_role
        user.email = f"{username}@load.test"
        user.is_active = True
        user.set_password(PASSWORD)
        user.save()

    print("Created load-test users.")
    print(f"Password: {PASSWORD}")
    print("Student pool:", ",".join(f"{username}:{PASSWORD}" for username in STUDENT_USERS))
    print("Cashier pool:", ",".join(f"{username}:{PASSWORD}" for username in CASHIER_USERS))


def cleanup_users():
    tables = set(connection.introspection.table_names())
    with connection.cursor() as cursor:
        if "students" in tables:
            cursor.execute("DELETE FROM students WHERE student_code LIKE %s", ["LOAD-STUDENT-%"])

        cursor.execute("SELECT id FROM users WHERE username = ANY(%s)", [TEMP_USERNAMES])
        user_ids = [row[0] for row in cursor.fetchall()]
        if not user_ids:
            print("No load-test users found.")
            return

        if "token_blacklist_blacklistedtoken" in tables and "token_blacklist_outstandingtoken" in tables:
            cursor.execute(
                """
                DELETE FROM token_blacklist_blacklistedtoken
                WHERE token_id = ANY(
                    SELECT id FROM token_blacklist_outstandingtoken
                    WHERE user_id = ANY(%s)
                )
                """,
                [user_ids],
            )

        if "token_blacklist_outstandingtoken" in tables:
            cursor.execute("DELETE FROM token_blacklist_outstandingtoken WHERE user_id = ANY(%s)", [user_ids])

        for table in ["users_groups", "users_user_permissions"]:
            if table in tables:
                cursor.execute(f"DELETE FROM {table} WHERE user_id = ANY(%s)", [user_ids])

        cursor.execute("DELETE FROM users WHERE id = ANY(%s)", [user_ids])

    print("Removed load-test users.")


if __name__ == "__main__":
    action = sys.argv[1] if len(sys.argv) > 1 else ""
    if action == "create":
        create_users()
    elif action == "cleanup":
        cleanup_users()
    else:
        print("Usage: python load_tests/manage_load_users.py [create|cleanup]")
        sys.exit(2)
