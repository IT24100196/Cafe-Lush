from datetime import datetime, time, timedelta
from decimal import Decimal
from unittest.mock import patch

from django.test import TestCase
from django.template.loader import render_to_string
from django.utils import timezone
from rest_framework.test import APIClient

from authentication.models import Role, User
from meals.delivery import correct_delivery_address, get_delivery_address_candidates
from meals.models import Bill, MealOrder, MealType, Student
from meals.serializers import MealOrderSerializer
from pos.models import Category, Item, WeeklyMealPlan


class DeliveryAddressCorrectionTests(TestCase):
    def test_common_jaffna_address_typos_are_corrected_for_geocoding(self):
        address = 'university of jaffna, Thirunalveli , jaffna'

        self.assertEqual(
            correct_delivery_address(address),
            'University of Jaffna, Thirunelveli, Jaffna',
        )

        candidates = get_delivery_address_candidates(address)
        self.assertIn('University of Jaffna, Thirunelveli, Jaffna', candidates)
        self.assertIn('University of Jaffna, Thirunelveli, Jaffna, Sri Lanka', candidates)


class MenuItemCheckoutTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        student_role, _ = Role.objects.get_or_create(name=Role.STUDENT)
        cashier_role, _ = Role.objects.get_or_create(name=Role.CASHIER)
        self.user = User.objects.create_user(
            username='studentuser',
            password='StudentPass123!',
            role=student_role,
            email='student@example.com',
        )
        self.student = Student.objects.create(
            user=self.user,
            student_code='STU-1001',
            full_name='Student Example',
            contact='0771234567',
        )
        self.cashier = User.objects.create_user(
            username='cashieruser',
            password='CashierPass123!',
            role=cashier_role,
            email='cashier@example.com',
        )
        category = Category.objects.create(name='Meals')
        self.item_one = Item.objects.create(
            category=category,
            name='Chicken Kottu',
            price='850.00',
            is_available=True,
        )
        self.item_two = Item.objects.create(
            category=category,
            name='Egg Appam',
            price='200.00',
            is_available=True,
        )
        self.client.force_authenticate(user=self.user)
        self.tomorrow = timezone.localdate() + timedelta(days=1)

    def _local_datetime_at(self, hour, minute=0):
        return timezone.make_aware(
            datetime.combine(timezone.localdate(), time(hour, minute)),
            timezone.get_current_timezone(),
        )

    def test_item_delivery_requires_phone_number(self):
        response = self.client.post('/api/meals/orders/batch/', {
            'orders': [
                {
                    'order_type': 'item',
                    'item': self.item_one.id,
                    'quantity': 2,
                    'delivery_type': 'delivery',
                    'address_line_1': 'No 1, Main Street',
                    'city_area': 'Jaffna',
                },
            ],
        }, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertEqual(MealOrder.objects.count(), 0)
        self.assertIn('phone_number', response.data)

    def test_single_menu_item_order_rejects_before_opening_time(self):
        with patch('meals.views.timezone.now', return_value=self._local_datetime_at(3, 59)):
            response = self.client.post('/api/meals/orders/', {
                'order_type': 'item',
                'item': self.item_one.id,
                'quantity': 1,
                'delivery_type': 'takeaway',
                'phone_number': '0771234567',
            }, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertEqual(MealOrder.objects.count(), 0)
        self.assertEqual(
            str(response.data['detail']),
            'Menu item orders are available from 4:00 AM to 11:30 PM.',
        )

    def test_batch_menu_item_order_rejects_after_last_order_time(self):
        with patch('meals.views.timezone.now', return_value=self._local_datetime_at(23, 31)):
            response = self.client.post('/api/meals/orders/batch/', {
                'orders': [
                    {
                        'order_type': 'item',
                        'item': self.item_one.id,
                        'quantity': 1,
                        'delivery_type': 'takeaway',
                        'phone_number': '0771234567',
                    },
                ],
            }, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertEqual(MealOrder.objects.count(), 0)
        self.assertEqual(
            str(response.data['detail']),
            'Menu item orders are available from 4:00 AM to 11:30 PM.',
        )

    def test_cashier_can_complete_confirmed_order(self):
        order = MealOrder.objects.create(
            student=self.student,
            item=self.item_one,
            order_type='item',
            order_date=timezone.localdate(),
            delivery_type='takeaway',
            quantity=1,
            phone_number='0771234567',
            status='confirmed',
        )
        self.client.force_authenticate(user=self.cashier)

        response = self.client.patch(f'/api/meals/orders/{order.id}/status/', {'status': 'completed'}, format='json')

        self.assertEqual(response.status_code, 200)
        order.refresh_from_db()
        self.assertEqual(order.status, 'completed')

    def test_cashier_cannot_complete_pending_order(self):
        order = MealOrder.objects.create(
            student=self.student,
            item=self.item_one,
            order_type='item',
            order_date=timezone.localdate(),
            delivery_type='takeaway',
            quantity=1,
            phone_number='0771234567',
            status='pending',
        )
        self.client.force_authenticate(user=self.cashier)

        response = self.client.patch(f'/api/meals/orders/{order.id}/status/', {'status': 'completed'}, format='json')

        self.assertEqual(response.status_code, 400)
        order.refresh_from_db()
        self.assertEqual(order.status, 'pending')
        self.assertEqual(str(response.data['detail']), 'Only confirmed orders can be completed.')

    def test_package_order_rejects_dates_more_than_three_days_ahead(self):
        dinner, _ = MealType.objects.get_or_create(name='Dinner', defaults={'cutoff_time': '23:00'})
        too_late = timezone.localdate() + timedelta(days=4)

        response = self.client.post('/api/meals/orders/', {
            'order_type': 'package',
            'meal_type': dinner.id,
            'preference': 'veg',
            'order_date': str(too_late),
            'delivery_type': 'takeaway',
            'quantity': 1,
            'phone_number': '0771234567',
        }, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertEqual(MealOrder.objects.count(), 0)
        self.assertEqual(
            str(response.data['detail']),
            'Meal packages can only be ordered from today up to 3 days ahead.',
        )

    def test_package_pickup_time_uses_fixed_meal_time_for_delivery_and_takeaway(self):
        breakfast, _ = MealType.objects.get_or_create(name='Breakfast', defaults={'cutoff_time': '08:00'})
        dinner, _ = MealType.objects.get_or_create(name='Dinner', defaults={'cutoff_time': '23:00'})

        breakfast_order = MealOrder(
            student=self.student,
            meal_type=breakfast,
            order_type='package',
            order_date=self.tomorrow,
            delivery_type='delivery',
            quantity=1,
            phone_number='0771234567',
        )
        dinner_order = MealOrder(
            student=self.student,
            meal_type=dinner,
            order_type='package',
            order_date=self.tomorrow,
            delivery_type='takeaway',
            quantity=1,
            phone_number='0771234567',
        )

        self.assertEqual(MealOrderSerializer(breakfast_order).data['pickup_time'], '07:30 AM')
        self.assertEqual(MealOrderSerializer(dinner_order).data['pickup_time'], '07:00 PM')

    def test_batch_package_order_rejects_dates_more_than_three_days_ahead(self):
        dinner, _ = MealType.objects.get_or_create(name='Dinner', defaults={'cutoff_time': '23:00'})
        too_late = timezone.localdate() + timedelta(days=4)

        response = self.client.post('/api/meals/orders/batch/', {
            'orders': [
                {
                    'order_type': 'package',
                    'meal_type': dinner.id,
                    'preference': 'veg',
                    'order_date': str(too_late),
                    'delivery_type': 'takeaway',
                    'quantity': 1,
                    'phone_number': '0771234567',
                },
            ],
        }, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertEqual(MealOrder.objects.count(), 0)
        self.assertEqual(
            str(response.data['detail']),
            'Meal packages can only be ordered from today up to 3 days ahead.',
        )

    def test_student_can_cancel_pending_breakfast_package_session_before_cutoff(self):
        breakfast, _ = MealType.objects.get_or_create(name='Breakfast', defaults={'cutoff_time': '08:00'})
        session_id = 'cancel-session-1'
        package_order = MealOrder.objects.create(
            student=self.student,
            meal_type=breakfast,
            order_type='package',
            order_date=self.tomorrow,
            delivery_type='takeaway',
            quantity=1,
            phone_number='0771234567',
            session_id=session_id,
            preference='veg',
        )
        item_order = MealOrder.objects.create(
            student=self.student,
            item=self.item_one,
            order_type='item',
            order_date=self.tomorrow,
            delivery_type='takeaway',
            quantity=1,
            phone_number='0771234567',
            session_id=session_id,
        )

        with patch('meals.views.timezone.now', return_value=self._local_datetime_at(20, 59)):
            response = self.client.patch(f'/api/meals/orders/{package_order.id}/cancel/')

        self.assertEqual(response.status_code, 200)
        package_order.refresh_from_db()
        item_order.refresh_from_db()
        self.assertEqual(package_order.status, 'cancelled')
        self.assertEqual(item_order.status, 'cancelled')

    def test_student_cannot_cancel_dinner_package_after_same_day_cutoff(self):
        dinner, _ = MealType.objects.get_or_create(name='Dinner', defaults={'cutoff_time': '23:00'})
        order = MealOrder.objects.create(
            student=self.student,
            meal_type=dinner,
            order_type='package',
            order_date=timezone.localdate(),
            delivery_type='takeaway',
            quantity=1,
            phone_number='0771234567',
            preference='non-veg',
        )

        with patch('meals.views.timezone.now', return_value=self._local_datetime_at(23, 0)):
            response = self.client.patch(f'/api/meals/orders/{order.id}/cancel/')

        self.assertEqual(response.status_code, 400)
        order.refresh_from_db()
        self.assertEqual(order.status, 'pending')
        self.assertIn('Dinner package orders can be cancelled before 11:00 PM', str(response.data['detail']))

    def test_item_delivery_order_is_created_with_contact_details(self):
        with patch('meals.views.timezone.now', return_value=self._local_datetime_at(10, 0)):
            response = self.client.post('/api/meals/orders/batch/', {
                'orders': [
                    {
                        'order_type': 'item',
                        'item': self.item_one.id,
                        'quantity': 2,
                        'delivery_type': 'delivery',
                        'phone_number': '0771234567',
                        'address_line_1': 'No 1, Main Street',
                        'city_area': 'Jaffna',
                        'location_source': 'current_location',
                        'delivery_latitude': '9.697726',
                        'delivery_longitude': '80.032571',
                    },
                ],
            }, format='json')

        self.assertEqual(response.status_code, 201)
        self.assertEqual(MealOrder.objects.count(), 1)

        order = MealOrder.objects.get()
        self.assertEqual(order.order_type, 'item')
        self.assertEqual(order.delivery_type, 'delivery')
        self.assertEqual(order.phone_number, '0771234567')
        self.assertEqual(order.delivery_address, 'No 1, Main Street, Jaffna')
        self.assertEqual(order.address_line_1, 'No 1, Main Street')
        self.assertEqual(order.city_area, 'Jaffna')
        self.assertEqual(order.location_source, 'current_location')
        self.assertEqual(order.delivery_fee, Decimal('150.00'))

    def test_batch_rejects_mixed_order_methods_without_partial_save(self):
        response = self.client.post('/api/meals/orders/batch/', {
            'orders': [
                {
                    'order_type': 'item',
                    'item': self.item_one.id,
                    'quantity': 1,
                    'delivery_type': 'takeaway',
                    'phone_number': '0771234567',
                    'delivery_address': '',
                },
                {
                    'order_type': 'item',
                    'item': self.item_two.id,
                    'quantity': 1,
                    'delivery_type': 'delivery',
                    'phone_number': '0771234567',
                    'address_line_1': 'No 2, Temple Road',
                    'city_area': 'Jaffna',
                    'location_source': 'current_location',
                    'delivery_latitude': '9.697726',
                    'delivery_longitude': '80.032571',
                },
            ],
        }, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertEqual(MealOrder.objects.count(), 0)
        self.assertEqual(
            str(response.data['detail']),
            'All orders in the same checkout must use the same order method.',
        )

    def test_package_and_item_delivery_stays_fee_free(self):
        dinner, _ = MealType.objects.get_or_create(name='Dinner', defaults={'cutoff_time': '23:00'})
        WeeklyMealPlan.objects.create(
            day_of_week=self.tomorrow.weekday(),
            meal_time='dinner',
            meal_category='veg',
            dishes=['Rice', 'Curry'],
            price='300.00',
        )

        with patch('meals.views.timezone.now', return_value=self._local_datetime_at(10, 0)):
            response = self.client.post('/api/meals/orders/batch/', {
                'orders': [
                    {
                        'order_type': 'package',
                        'meal_type': dinner.id,
                        'preference': 'veg',
                        'order_date': str(self.tomorrow),
                        'delivery_type': 'delivery',
                        'quantity': 1,
                        'phone_number': '0771234567',
                        'address_line_1': 'No 5, Temple Road',
                        'address_line_2': 'Hostel Block A',
                        'city_area': 'Jaffna',
                    },
                    {
                        'order_type': 'item',
                        'item': self.item_two.id,
                        'quantity': 2,
                        'order_date': str(self.tomorrow),
                        'delivery_type': 'delivery',
                        'phone_number': '0771234567',
                        'address_line_1': 'No 5, Temple Road',
                        'address_line_2': 'Hostel Block A',
                        'city_area': 'Jaffna',
                    },
                ],
            }, format='json')

        self.assertEqual(response.status_code, 201)
        self.assertEqual(MealOrder.objects.count(), 2)
        self.assertEqual(MealOrder.objects.filter(delivery_fee=Decimal('0.00')).count(), 2)

        first_order = MealOrder.objects.order_by('id').first()
        self.client.force_authenticate(user=self.cashier)
        bill_response = self.client.post(f'/api/meals/bills/online/{first_order.id}/')

        self.assertEqual(bill_response.status_code, 201)
        bill = Bill.objects.get()
        self.assertEqual(bill.delivery_fee, Decimal('0.00'))
        self.assertEqual(bill.subtotal_amount, Decimal('700.00'))
        self.assertEqual(bill.total_amount, Decimal('700.00'))

        online_orders_response = self.client.get('/api/meals/online-orders/')
        self.assertEqual(online_orders_response.status_code, 200)
        self.assertEqual(online_orders_response.data[0]['delivery_fee'], '0.00')

    @patch('meals.views.calculate_delivery_quote')
    def test_menu_item_address_delivery_fee_is_added_to_bill(self, mock_calculate_delivery_quote):
        mock_calculate_delivery_quote.return_value = {
            'delivery_fee': Decimal('200.00'),
            'distance_km': Decimal('4.00'),
            'label': 'LKR 200',
            'latitude': Decimal('9.700000'),
            'longitude': Decimal('80.040000'),
            'location_source': 'address',
        }

        with patch('meals.views.timezone.now', return_value=self._local_datetime_at(10, 0)):
            response = self.client.post('/api/meals/orders/batch/', {
                'orders': [
                    {
                        'order_type': 'item',
                        'item': self.item_one.id,
                        'quantity': 2,
                        'delivery_type': 'delivery',
                        'phone_number': '0771234567',
                        'address_line_1': 'No 25, Palaly Road',
                        'address_line_2': 'Student Hostel',
                        'city_area': 'Jaffna',
                        'location_source': 'address',
                    },
                ],
            }, format='json')

        self.assertEqual(response.status_code, 201)
        order = MealOrder.objects.get()
        self.assertEqual(order.delivery_fee, Decimal('200.00'))
        self.assertEqual(order.delivery_address, 'No 25, Palaly Road, Student Hostel, Jaffna')

        self.client.force_authenticate(user=self.cashier)
        bill_response = self.client.post(f'/api/meals/bills/online/{order.id}/')

        self.assertEqual(bill_response.status_code, 201)
        bill = Bill.objects.get()
        self.assertEqual(bill.subtotal_amount, Decimal('1700.00'))
        self.assertEqual(bill.delivery_fee, Decimal('200.00'))
        self.assertEqual(bill.total_amount, Decimal('1900.00'))

        online_orders_response = self.client.get('/api/meals/online-orders/')
        self.assertEqual(online_orders_response.status_code, 200)
        self.assertEqual(online_orders_response.data[0]['delivery_fee'], '200.00')

        html = render_to_string('meals/bill_email.html', {'bill': bill, 'logo_cid': 'bill-logo-cid'})
        self.assertIn('No 25, Palaly Road, Student Hostel, Jaffna', html)
        self.assertIn('Delivery Fee', html)
        self.assertIn('Subtotal', html)
        self.assertIn('Rs.200.00', html)
        self.assertIn('Rs.1700.00', html)
        self.assertIn('Rs.1900.00', html)
