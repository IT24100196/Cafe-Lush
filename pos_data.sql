--
-- PostgreSQL database dump
--

\restrict JUBA69thgzXwliutN2HWSJQmmRn9cnA3H1m0o2GHg4OxRchnZVVILkDc3jFhx7I

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: auth_group; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: django_content_type; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.django_content_type VALUES (1, 'admin', 'logentry');
INSERT INTO public.django_content_type VALUES (2, 'auth', 'permission');
INSERT INTO public.django_content_type VALUES (3, 'auth', 'group');
INSERT INTO public.django_content_type VALUES (4, 'contenttypes', 'contenttype');
INSERT INTO public.django_content_type VALUES (5, 'sessions', 'session');
INSERT INTO public.django_content_type VALUES (6, 'token_blacklist', 'blacklistedtoken');
INSERT INTO public.django_content_type VALUES (7, 'token_blacklist', 'outstandingtoken');
INSERT INTO public.django_content_type VALUES (8, 'authentication', 'role');
INSERT INTO public.django_content_type VALUES (9, 'authentication', 'user');
INSERT INTO public.django_content_type VALUES (10, 'meals', 'mealtype');
INSERT INTO public.django_content_type VALUES (11, 'meals', 'student');
INSERT INTO public.django_content_type VALUES (12, 'meals', 'mealorder');
INSERT INTO public.django_content_type VALUES (13, 'pos', 'category');
INSERT INTO public.django_content_type VALUES (14, 'pos', 'item');
INSERT INTO public.django_content_type VALUES (15, 'pos', 'posorder');
INSERT INTO public.django_content_type VALUES (16, 'pos', 'posorderitem');
INSERT INTO public.django_content_type VALUES (17, 'events', 'event');
INSERT INTO public.django_content_type VALUES (18, 'partners', 'branch');
INSERT INTO public.django_content_type VALUES (19, 'partners', 'partnertransaction');
INSERT INTO public.django_content_type VALUES (20, 'reports', 'payment');
INSERT INTO public.django_content_type VALUES (21, 'meals', 'notification');
INSERT INTO public.django_content_type VALUES (22, 'meals', 'mealpackage');
INSERT INTO public.django_content_type VALUES (23, 'pos', 'featureditem');
INSERT INTO public.django_content_type VALUES (24, 'pos', 'weeklymealplan');
INSERT INTO public.django_content_type VALUES (25, 'meals', 'bill');
INSERT INTO public.django_content_type VALUES (26, 'reports', 'incomeoutcome');
INSERT INTO public.django_content_type VALUES (27, 'meals', 'suggestion');


--
-- Data for Name: auth_permission; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.auth_permission VALUES (1, 'Can add log entry', 1, 'add_logentry');
INSERT INTO public.auth_permission VALUES (2, 'Can change log entry', 1, 'change_logentry');
INSERT INTO public.auth_permission VALUES (3, 'Can delete log entry', 1, 'delete_logentry');
INSERT INTO public.auth_permission VALUES (4, 'Can view log entry', 1, 'view_logentry');
INSERT INTO public.auth_permission VALUES (5, 'Can add permission', 2, 'add_permission');
INSERT INTO public.auth_permission VALUES (6, 'Can change permission', 2, 'change_permission');
INSERT INTO public.auth_permission VALUES (7, 'Can delete permission', 2, 'delete_permission');
INSERT INTO public.auth_permission VALUES (8, 'Can view permission', 2, 'view_permission');
INSERT INTO public.auth_permission VALUES (9, 'Can add group', 3, 'add_group');
INSERT INTO public.auth_permission VALUES (10, 'Can change group', 3, 'change_group');
INSERT INTO public.auth_permission VALUES (11, 'Can delete group', 3, 'delete_group');
INSERT INTO public.auth_permission VALUES (12, 'Can view group', 3, 'view_group');
INSERT INTO public.auth_permission VALUES (13, 'Can add content type', 4, 'add_contenttype');
INSERT INTO public.auth_permission VALUES (14, 'Can change content type', 4, 'change_contenttype');
INSERT INTO public.auth_permission VALUES (15, 'Can delete content type', 4, 'delete_contenttype');
INSERT INTO public.auth_permission VALUES (16, 'Can view content type', 4, 'view_contenttype');
INSERT INTO public.auth_permission VALUES (17, 'Can add session', 5, 'add_session');
INSERT INTO public.auth_permission VALUES (18, 'Can change session', 5, 'change_session');
INSERT INTO public.auth_permission VALUES (19, 'Can delete session', 5, 'delete_session');
INSERT INTO public.auth_permission VALUES (20, 'Can view session', 5, 'view_session');
INSERT INTO public.auth_permission VALUES (21, 'Can add blacklisted token', 6, 'add_blacklistedtoken');
INSERT INTO public.auth_permission VALUES (22, 'Can change blacklisted token', 6, 'change_blacklistedtoken');
INSERT INTO public.auth_permission VALUES (23, 'Can delete blacklisted token', 6, 'delete_blacklistedtoken');
INSERT INTO public.auth_permission VALUES (24, 'Can view blacklisted token', 6, 'view_blacklistedtoken');
INSERT INTO public.auth_permission VALUES (25, 'Can add outstanding token', 7, 'add_outstandingtoken');
INSERT INTO public.auth_permission VALUES (26, 'Can change outstanding token', 7, 'change_outstandingtoken');
INSERT INTO public.auth_permission VALUES (27, 'Can delete outstanding token', 7, 'delete_outstandingtoken');
INSERT INTO public.auth_permission VALUES (28, 'Can view outstanding token', 7, 'view_outstandingtoken');
INSERT INTO public.auth_permission VALUES (29, 'Can add role', 8, 'add_role');
INSERT INTO public.auth_permission VALUES (30, 'Can change role', 8, 'change_role');
INSERT INTO public.auth_permission VALUES (31, 'Can delete role', 8, 'delete_role');
INSERT INTO public.auth_permission VALUES (32, 'Can view role', 8, 'view_role');
INSERT INTO public.auth_permission VALUES (33, 'Can add user', 9, 'add_user');
INSERT INTO public.auth_permission VALUES (34, 'Can change user', 9, 'change_user');
INSERT INTO public.auth_permission VALUES (35, 'Can delete user', 9, 'delete_user');
INSERT INTO public.auth_permission VALUES (36, 'Can view user', 9, 'view_user');
INSERT INTO public.auth_permission VALUES (37, 'Can add meal type', 10, 'add_mealtype');
INSERT INTO public.auth_permission VALUES (38, 'Can change meal type', 10, 'change_mealtype');
INSERT INTO public.auth_permission VALUES (39, 'Can delete meal type', 10, 'delete_mealtype');
INSERT INTO public.auth_permission VALUES (40, 'Can view meal type', 10, 'view_mealtype');
INSERT INTO public.auth_permission VALUES (41, 'Can add student', 11, 'add_student');
INSERT INTO public.auth_permission VALUES (42, 'Can change student', 11, 'change_student');
INSERT INTO public.auth_permission VALUES (43, 'Can delete student', 11, 'delete_student');
INSERT INTO public.auth_permission VALUES (44, 'Can view student', 11, 'view_student');
INSERT INTO public.auth_permission VALUES (45, 'Can add meal order', 12, 'add_mealorder');
INSERT INTO public.auth_permission VALUES (46, 'Can change meal order', 12, 'change_mealorder');
INSERT INTO public.auth_permission VALUES (47, 'Can delete meal order', 12, 'delete_mealorder');
INSERT INTO public.auth_permission VALUES (48, 'Can view meal order', 12, 'view_mealorder');
INSERT INTO public.auth_permission VALUES (49, 'Can add category', 13, 'add_category');
INSERT INTO public.auth_permission VALUES (50, 'Can change category', 13, 'change_category');
INSERT INTO public.auth_permission VALUES (51, 'Can delete category', 13, 'delete_category');
INSERT INTO public.auth_permission VALUES (52, 'Can view category', 13, 'view_category');
INSERT INTO public.auth_permission VALUES (53, 'Can add item', 14, 'add_item');
INSERT INTO public.auth_permission VALUES (54, 'Can change item', 14, 'change_item');
INSERT INTO public.auth_permission VALUES (55, 'Can delete item', 14, 'delete_item');
INSERT INTO public.auth_permission VALUES (56, 'Can view item', 14, 'view_item');
INSERT INTO public.auth_permission VALUES (57, 'Can add pos order', 15, 'add_posorder');
INSERT INTO public.auth_permission VALUES (58, 'Can change pos order', 15, 'change_posorder');
INSERT INTO public.auth_permission VALUES (59, 'Can delete pos order', 15, 'delete_posorder');
INSERT INTO public.auth_permission VALUES (60, 'Can view pos order', 15, 'view_posorder');
INSERT INTO public.auth_permission VALUES (61, 'Can add pos order item', 16, 'add_posorderitem');
INSERT INTO public.auth_permission VALUES (62, 'Can change pos order item', 16, 'change_posorderitem');
INSERT INTO public.auth_permission VALUES (63, 'Can delete pos order item', 16, 'delete_posorderitem');
INSERT INTO public.auth_permission VALUES (64, 'Can view pos order item', 16, 'view_posorderitem');
INSERT INTO public.auth_permission VALUES (65, 'Can add event', 17, 'add_event');
INSERT INTO public.auth_permission VALUES (66, 'Can change event', 17, 'change_event');
INSERT INTO public.auth_permission VALUES (67, 'Can delete event', 17, 'delete_event');
INSERT INTO public.auth_permission VALUES (68, 'Can view event', 17, 'view_event');
INSERT INTO public.auth_permission VALUES (69, 'Can add branch', 18, 'add_branch');
INSERT INTO public.auth_permission VALUES (70, 'Can change branch', 18, 'change_branch');
INSERT INTO public.auth_permission VALUES (71, 'Can delete branch', 18, 'delete_branch');
INSERT INTO public.auth_permission VALUES (72, 'Can view branch', 18, 'view_branch');
INSERT INTO public.auth_permission VALUES (73, 'Can add partner transaction', 19, 'add_partnertransaction');
INSERT INTO public.auth_permission VALUES (74, 'Can change partner transaction', 19, 'change_partnertransaction');
INSERT INTO public.auth_permission VALUES (75, 'Can delete partner transaction', 19, 'delete_partnertransaction');
INSERT INTO public.auth_permission VALUES (76, 'Can view partner transaction', 19, 'view_partnertransaction');
INSERT INTO public.auth_permission VALUES (77, 'Can add payment', 20, 'add_payment');
INSERT INTO public.auth_permission VALUES (78, 'Can change payment', 20, 'change_payment');
INSERT INTO public.auth_permission VALUES (79, 'Can delete payment', 20, 'delete_payment');
INSERT INTO public.auth_permission VALUES (80, 'Can view payment', 20, 'view_payment');
INSERT INTO public.auth_permission VALUES (81, 'Can add notification', 21, 'add_notification');
INSERT INTO public.auth_permission VALUES (82, 'Can change notification', 21, 'change_notification');
INSERT INTO public.auth_permission VALUES (83, 'Can delete notification', 21, 'delete_notification');
INSERT INTO public.auth_permission VALUES (84, 'Can view notification', 21, 'view_notification');
INSERT INTO public.auth_permission VALUES (85, 'Can add meal package', 22, 'add_mealpackage');
INSERT INTO public.auth_permission VALUES (86, 'Can change meal package', 22, 'change_mealpackage');
INSERT INTO public.auth_permission VALUES (87, 'Can delete meal package', 22, 'delete_mealpackage');
INSERT INTO public.auth_permission VALUES (88, 'Can view meal package', 22, 'view_mealpackage');
INSERT INTO public.auth_permission VALUES (89, 'Can add featured item', 23, 'add_featureditem');
INSERT INTO public.auth_permission VALUES (90, 'Can change featured item', 23, 'change_featureditem');
INSERT INTO public.auth_permission VALUES (91, 'Can delete featured item', 23, 'delete_featureditem');
INSERT INTO public.auth_permission VALUES (92, 'Can view featured item', 23, 'view_featureditem');
INSERT INTO public.auth_permission VALUES (93, 'Can add weekly meal plan', 24, 'add_weeklymealplan');
INSERT INTO public.auth_permission VALUES (94, 'Can change weekly meal plan', 24, 'change_weeklymealplan');
INSERT INTO public.auth_permission VALUES (95, 'Can delete weekly meal plan', 24, 'delete_weeklymealplan');
INSERT INTO public.auth_permission VALUES (96, 'Can view weekly meal plan', 24, 'view_weeklymealplan');
INSERT INTO public.auth_permission VALUES (97, 'Can add bill', 25, 'add_bill');
INSERT INTO public.auth_permission VALUES (98, 'Can change bill', 25, 'change_bill');
INSERT INTO public.auth_permission VALUES (99, 'Can delete bill', 25, 'delete_bill');
INSERT INTO public.auth_permission VALUES (100, 'Can view bill', 25, 'view_bill');
INSERT INTO public.auth_permission VALUES (101, 'Can add income outcome', 26, 'add_incomeoutcome');
INSERT INTO public.auth_permission VALUES (102, 'Can change income outcome', 26, 'change_incomeoutcome');
INSERT INTO public.auth_permission VALUES (103, 'Can delete income outcome', 26, 'delete_incomeoutcome');
INSERT INTO public.auth_permission VALUES (104, 'Can view income outcome', 26, 'view_incomeoutcome');
INSERT INTO public.auth_permission VALUES (105, 'Can add suggestion', 27, 'add_suggestion');
INSERT INTO public.auth_permission VALUES (106, 'Can change suggestion', 27, 'change_suggestion');
INSERT INTO public.auth_permission VALUES (107, 'Can delete suggestion', 27, 'delete_suggestion');
INSERT INTO public.auth_permission VALUES (108, 'Can view suggestion', 27, 'view_suggestion');


--
-- Data for Name: auth_group_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: authentication_role; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.authentication_role VALUES (1, 'admin');
INSERT INTO public.authentication_role VALUES (2, 'student');
INSERT INTO public.authentication_role VALUES (3, 'cashier');


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.categories VALUES (1, 'Vege Food(001A-013A)');
INSERT INTO public.categories VALUES (2, 'Veg Soup (001B - 005B)');
INSERT INTO public.categories VALUES (3, 'Non Veg Food (001C - 016C)');
INSERT INTO public.categories VALUES (4, 'Non Veg Soup( 001D - 004D)');
INSERT INTO public.categories VALUES (5, 'Sandwich (001E - 010E)');
INSERT INTO public.categories VALUES (6, 'Veg Bread Tost(001F - 010F)');
INSERT INTO public.categories VALUES (7, 'Egg Appam (001G - 004G)');
INSERT INTO public.categories VALUES (8, 'Shantha''s Special (001H - 008H)');
INSERT INTO public.categories VALUES (9, 'Shantha''s Special Saturday & Sunday (001H - 008H)');
INSERT INTO public.categories VALUES (10, 'Salads');
INSERT INTO public.categories VALUES (11, 'Light Meals');
INSERT INTO public.categories VALUES (12, 'Healthy Snacks');
INSERT INTO public.categories VALUES (13, 'Shantha''s Special Daily (001H - 008H)');


--
-- Data for Name: items; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.items VALUES (1, 'Dosa', 100.00, true, '2026-03-18 09:30:21.118674+05:30', 1, 'items/how-to-make-dosa-crispy-PipingPotCurry.jpg', '003A');
INSERT INTO public.items VALUES (2, 'Pittu', 200.00, true, '2026-03-18 15:02:04.407464+05:30', 1, 'items/pittu.JPG', '001A');
INSERT INTO public.items VALUES (3, 'String Hopper', 200.00, true, '2026-03-18 15:02:37.700103+05:30', 1, 'items/String_hopper.jpeg', '002A');
INSERT INTO public.items VALUES (4, 'Idly', 100.00, true, '2026-03-18 15:03:24.499215+05:30', 1, 'items/idly.jpg', '004A');
INSERT INTO public.items VALUES (5, 'Polrotty', 100.00, true, '2026-03-18 15:14:48.652101+05:30', 1, 'items/PolRoti.jpg', '005A');
INSERT INTO public.items VALUES (6, 'Veg Pittu Kottu', 350.00, true, '2026-03-18 15:15:34.91811+05:30', 1, 'items/Vege_pittu_kottu.webp', '006A');
INSERT INTO public.items VALUES (7, 'Veg Paneer Pittu Kottu', 450.00, true, '2026-03-18 15:19:18.746914+05:30', 1, 'items/pittu_paneer_kottu.jpg', '007A');
INSERT INTO public.items VALUES (8, 'Veg Fried Noodils', 350.00, true, '2026-03-18 15:20:52.387591+05:30', 1, 'items/Vegetable-Stir-Fried-Noodles-17.jpg', '008A');
INSERT INTO public.items VALUES (9, 'Veg Paneer Noodils', 450.00, true, '2026-03-18 15:21:33.122399+05:30', 1, 'items/paneer-hakka-noodles.webp', '009A');
INSERT INTO public.items VALUES (10, 'Veg String Hoppers Kottu', 350.00, true, '2026-03-18 15:22:25.544305+05:30', 1, 'items/String_hopper_kottu.jpg', '010A');
INSERT INTO public.items VALUES (11, 'Veg Paneer String Hoppers Kottu', 450.00, true, '2026-03-18 15:23:02.941158+05:30', 1, 'items/Paneer_string_hopper_kottu.jpg', '011A');
INSERT INTO public.items VALUES (12, 'Veg  Kottu Roti', 350.00, true, '2026-03-18 15:23:35.181635+05:30', 1, 'items/Vegetable-Kottu.webp', '012A');
INSERT INTO public.items VALUES (13, 'Veg Paneer Kottu Roti', 450.00, true, '2026-03-18 15:24:05.216934+05:30', 1, 'items/vege_paneer_kottu.jpg', '013A');
INSERT INTO public.items VALUES (14, 'Vegetable Soup', 350.00, true, '2026-03-18 15:25:07.93657+05:30', 2, 'items/Healthy-Vegetable-Soup.webp', '001B');
INSERT INTO public.items VALUES (15, 'Vegetable Noodels Soup', 350.00, true, '2026-03-18 15:25:53.847871+05:30', 2, 'items/Vegetable_Noodels_Soup.jpg', '002B');
INSERT INTO public.items VALUES (16, 'Veg Sweet corn Soup', 350.00, true, '2026-03-18 15:26:25.517523+05:30', 2, 'items/Veg_Sweet_corn_Soup.jpg', '003B');
INSERT INTO public.items VALUES (17, 'Jaffna Rasam', 100.00, true, '2026-03-18 15:26:56.083176+05:30', 2, 'items/Rasam.jpg', '004B');
INSERT INTO public.items VALUES (18, 'Jaffna Morre', 100.00, true, '2026-03-18 15:27:26.723797+05:30', 2, 'items/Morre.jpg', '005B');
INSERT INTO public.items VALUES (19, 'Egg pittu kottu', 400.00, true, '2026-03-18 15:28:10.335862+05:30', 3, 'items/Egg_pittu_kottu.jpg', '001C');
INSERT INTO public.items VALUES (21, 'Chicken Sausages pittu Kottu', 450.00, true, '2026-03-18 15:29:24.497646+05:30', 3, 'items/Chicken_Sausages_pittu_Kottu.jpg', '003C');
INSERT INTO public.items VALUES (22, 'Prawn pittu Kottu', 1000.00, true, '2026-03-18 15:30:02.288614+05:30', 3, 'items/Prawn_pittu_Kottu_oly8Dqh.jpg', '004C');
INSERT INTO public.items VALUES (20, 'Chicken pittu Kottu', 500.00, true, '2026-03-18 15:28:44.783781+05:30', 3, 'items/chicken-kottu-puttu.jpg', '002C');
INSERT INTO public.items VALUES (23, 'Egg Noodles', 400.00, true, '2026-03-18 15:31:29.771365+05:30', 3, 'items/Egg_Noodles.jpg', '005C');
INSERT INTO public.items VALUES (24, 'Chicken Noodles', 500.00, true, '2026-03-18 15:32:02.224121+05:30', 3, 'items/Chicken_Noodles.webp', '006C');
INSERT INTO public.items VALUES (25, 'Chicken  Sausages Noodles', 450.00, true, '2026-03-18 15:32:28.093857+05:30', 3, 'items/Chicken__Sausages_Noodles.webp', '007C');
INSERT INTO public.items VALUES (26, 'Prawn Noodles', 1000.00, true, '2026-03-18 15:33:02.620503+05:30', 3, 'items/Prawn_Noodles.jpg', '008C');
INSERT INTO public.items VALUES (27, 'Egg String Hoppers kottu', 400.00, true, '2026-03-18 15:33:33.42673+05:30', 3, 'items/Egg_String_Hoppers_kottu.jpg', '009C');
INSERT INTO public.items VALUES (28, 'Chicken String Hoppers Kottu', 500.00, true, '2026-03-18 15:34:09.610082+05:30', 3, 'items/Chicken_String_Hoppers_Kottu.jpg', '010C');
INSERT INTO public.items VALUES (29, 'Chicken  Sausages String Hoppers Kottu', 450.00, true, '2026-03-18 15:35:27.908351+05:30', 3, 'items/Chicken__Sausages_String_Hoppers_Kottu.jpg', '011C');
INSERT INTO public.items VALUES (30, 'Prawn String Hoppers Kottu', 1000.00, true, '2026-03-18 15:36:13.557634+05:30', 3, 'items/Prawn_String_Hoppers_Kottu.jpg', '012C');
INSERT INTO public.items VALUES (31, 'Egg  kottu Roti', 400.00, true, '2026-03-18 15:36:48.333715+05:30', 3, 'items/Egg__kottu_Roti.jpg', '013C');
INSERT INTO public.items VALUES (33, 'Chicken Sausages  Kottu Roti', 450.00, true, '2026-03-18 15:37:54.450729+05:30', 3, 'items/Chicken_Sausages__Kottu_Roti.webp', '015C');
INSERT INTO public.items VALUES (34, 'Prawn Kottu Roti', 1000.00, true, '2026-03-18 15:38:28.246732+05:30', 3, 'items/Prawn_Kottu_Roti.jpg', '014C');
INSERT INTO public.items VALUES (35, 'Egg Soup', 300.00, true, '2026-03-18 15:39:00.086746+05:30', 4, 'items/Egg_Soup.webp', '001D');
INSERT INTO public.items VALUES (36, 'Egg &Chicken Soup', 350.00, true, '2026-03-18 15:39:21.589273+05:30', 4, 'items/Egg_Chicken_Soup.webp', '002D');
INSERT INTO public.items VALUES (37, 'Chicken Corn  Soup', 400.00, true, '2026-03-18 15:39:44.869763+05:30', 4, 'items/Chicken_Corn__Soup.jpeg', '003D');
INSERT INTO public.items VALUES (38, 'Chicken Noodels Soup', 400.00, true, '2026-03-18 15:40:04.390391+05:30', 4, 'items/Chicken_Noodels_Soup.webp', '004D');
INSERT INTO public.items VALUES (39, 'Veg Sandwich', 200.00, true, '2026-03-18 15:40:42.114951+05:30', 5, 'items/Veg_Sandwich.jpg', '001E');
INSERT INTO public.items VALUES (40, 'Veg Panner Sandwich', 250.00, true, '2026-03-18 15:41:08.000866+05:30', 5, 'items/Veg_Panner_Sandwich.jpg', '002E');
INSERT INTO public.items VALUES (41, 'Egg  Sandwich', 250.00, true, '2026-03-18 15:41:31.375852+05:30', 5, 'items/Egg__Sandwich.jpg', '003E');
INSERT INTO public.items VALUES (42, 'Chicken Sandwich', 300.00, true, '2026-03-18 15:41:51.988384+05:30', 5, 'items/Chicken_Sandwich.webp', '004E');
INSERT INTO public.items VALUES (43, 'Chicken  Sausages Sandwich', 250.00, true, '2026-03-18 15:42:15.665206+05:30', 5, 'items/Chicken__Sausages_Sandwich.jpeg', '005E');
INSERT INTO public.items VALUES (44, 'Veg Sandwich with Cheese', 300.00, true, '2026-03-18 15:42:58.696833+05:30', 5, 'items/Veg_Sandwich_with_Cheese.webp', '006E');
INSERT INTO public.items VALUES (45, 'Veg Panner Sandwich with Cheese', 350.00, true, '2026-03-18 15:43:24.092713+05:30', 5, 'items/Veg_Panner_Sandwich_with_Cheese.jpg', '007E');
INSERT INTO public.items VALUES (46, 'Egg  Sandwich with Cheese', 350.00, true, '2026-03-18 15:43:55.834121+05:30', 5, 'items/Egg__Sandwich_with_Cheese.jpg', '008E');
INSERT INTO public.items VALUES (47, 'Chicken Sandwich with Cheese', 400.00, true, '2026-03-18 15:44:15.226395+05:30', 5, 'items/Chicken_Sandwich_with_Cheese.jpg', '009E');
INSERT INTO public.items VALUES (48, 'Chicken Sausages Sandwich with Cheese', 350.00, true, '2026-03-18 15:45:58.034404+05:30', 5, 'items/Chicken_Sausages_Sandwich_with_Cheese.jpg', '010E');
INSERT INTO public.items VALUES (49, 'Veg Bread Tost', 200.00, true, '2026-03-18 15:47:24.084769+05:30', 6, 'items/Veg_Bread_Tost.jpg', '001F');
INSERT INTO public.items VALUES (50, 'Veg Panner Bread Tost', 250.00, true, '2026-03-18 15:47:55.622787+05:30', 6, 'items/Veg_Panner_Bread_Tost.webp', '002F');
INSERT INTO public.items VALUES (51, 'Egg Bread Tost', 250.00, true, '2026-03-18 15:48:42.879226+05:30', 6, 'items/Egg_Bread_Tost.jpg', '003F');
INSERT INTO public.items VALUES (52, 'Chicken Bread Tost', 300.00, true, '2026-03-18 15:49:11.762733+05:30', 6, 'items/Chicken_Bread_Tost.jpg', '004F');
INSERT INTO public.items VALUES (53, 'Chicken  Sausages Bread Tost', 250.00, true, '2026-03-18 15:49:36.511164+05:30', 6, 'items/Chicken__Sausages_Bread_Tost.jpg', '005F');
INSERT INTO public.items VALUES (54, 'Veg Bread Tost  with Cheese', 250.00, true, '2026-03-18 15:50:24.190209+05:30', 6, 'items/veg-chilli-cheese-toast.jpg', '006F');
INSERT INTO public.items VALUES (55, 'Egg  Bread Tost  with Cheese', 300.00, true, '2026-03-18 15:50:54.930647+05:30', 6, 'items/Egg__Bread_Tost__with_Cheese.jpg', '007F');
INSERT INTO public.items VALUES (56, 'Chicken Bread Tost with Cheese', 350.00, true, '2026-03-18 15:51:46.833779+05:30', 6, 'items/ChickenBread_Tost__with_Cheese.jpg', '008F');
INSERT INTO public.items VALUES (57, 'Chicken Sausages Bread Tost  with Cheese', 350.00, true, '2026-03-18 15:52:26.091147+05:30', 6, 'items/Chicken_Sausages_Bread_Tost__with_Cheese.jpg', '009F');
INSERT INTO public.items VALUES (58, 'Roast paan with CoConut Sambol & Paruppu Curry', 150.00, true, '2026-03-18 15:52:59.425859+05:30', 6, 'items/Roast_paan_with_CoConut_SambolParuppu_Curry.jpg', '010F');
INSERT INTO public.items VALUES (59, 'Egg Appam With Sambol', 200.00, true, '2026-03-18 15:55:59.042569+05:30', 7, 'items/Egg_Appam_With_Sambol.jpg', '001G');
INSERT INTO public.items VALUES (60, 'Plain Appam with Sambol', 150.00, true, '2026-03-18 15:56:20.285764+05:30', 7, 'items/Plain_Appam_with_Sambol.jpg', '002G');
INSERT INTO public.items VALUES (61, 'Egg Onion Uttappam', 200.00, true, '2026-03-18 15:56:44.021671+05:30', 7, 'items/Egg_Onion_Uttappam.jpg', '003G');
INSERT INTO public.items VALUES (62, 'Egg Veg &Onion Uttappam', 250.00, true, '2026-03-18 15:57:03.201209+05:30', 7, 'items/Egg_Veg_Onion_Uttappam.webp', '004G');
INSERT INTO public.items VALUES (63, 'Jaffna Fish Curry With Dosa', 500.00, true, '2026-03-18 16:00:41.962462+05:30', 8, 'items/Jaffna_Fish_Curry_With_Dosa.jpg', '001H');
INSERT INTO public.items VALUES (64, 'Jaffna Fish Curry With Idly', 500.00, true, '2026-03-18 16:01:25.135603+05:30', 8, 'items/Fish_Curry_With_Idly.jpg', '002H');
INSERT INTO public.items VALUES (65, 'Jaffna Chicken Currty with Dosa', 500.00, true, '2026-03-18 16:02:06.837175+05:30', 8, 'items/Jaffna_Chicken_Currty_with_Dosa.webp', '003H');
INSERT INTO public.items VALUES (66, 'Jaffna Chicken Currty with Idly', 500.00, true, '2026-03-18 16:02:40.812391+05:30', 8, 'items/Jaffna_Chicken_Currty_with_Idly.jpeg', '004H');
INSERT INTO public.items VALUES (67, 'Jaffna Egg Dosa', 200.00, true, '2026-03-18 16:03:01.601054+05:30', 8, 'items/Jaffna_Egg_Dosa.png', '005H');
INSERT INTO public.items VALUES (68, 'Jaffna Bamboo Puttu With Crab Curry', 1000.00, true, '2026-03-18 16:03:30.314221+05:30', 8, 'items/Jaffna_Bamboo_Puttu_With_Crab_Curry.jpg', '007H');
INSERT INTO public.items VALUES (69, 'Jaffna Bamboo Puttu With Prawn Curry', 1000.00, true, '2026-03-18 16:04:03.211631+05:30', 8, 'items/Jaffna_Bamboo_Puttu_With_Prawn_Curry.jpg', '008H');
INSERT INTO public.items VALUES (70, 'Jaffna Veg Odiyal kool', 300.00, true, '2026-03-18 16:05:27.809833+05:30', 9, 'items/Jaffna_Veg_Odiyal_kool.jpg', '');
INSERT INTO public.items VALUES (71, 'Jaffna Non Veg Odiyal kool', 450.00, true, '2026-03-18 16:06:30.812319+05:30', 9, 'items/Jaffna_Non_Veg_Odiyal_kool.webp', '');
INSERT INTO public.items VALUES (72, 'Payasam', 250.00, true, '2026-03-18 16:06:53.773631+05:30', 13, 'items/Payasam.jpg', '');
INSERT INTO public.items VALUES (73, 'Iraasavalli', 300.00, true, '2026-03-18 16:07:47.977334+05:30', 13, 'items/Iraasavalli.jpg', '');
INSERT INTO public.items VALUES (74, 'Uluththam kali', 300.00, true, '2026-03-18 16:08:06.76114+05:30', 13, 'items/Uluththam_kali.jpg', '');
INSERT INTO public.items VALUES (75, 'Grilled Paneer Sandwich – கிரில் பனீர் சாண்ட்விச்', 0.00, true, '2026-03-18 16:09:42.529746+05:30', 5, 'items/Grilled_Paneer_Sandwich.jpg', '011E');
INSERT INTO public.items VALUES (76, 'Sprouts Salad – முளைகட்டிய பயறு சாலட்', 0.00, true, '2026-03-18 16:10:12.592554+05:30', 10, 'items/Sprouts_Salad.jpg', '');
INSERT INTO public.items VALUES (77, 'Cucumber & Carrot Salad – வெள்ளரிக்காய் & காரட் சாலட்', 0.00, true, '2026-03-18 16:10:45.817199+05:30', 10, 'items/Cucumber__Carrot_Salad.jpg', '');
INSERT INTO public.items VALUES (78, 'Veg Salad –காய்கறி சாலட்', 0.00, true, '2026-03-18 16:11:07.439385+05:30', 10, 'items/Veg_Salad.jpg', '');
INSERT INTO public.items VALUES (79, 'Fruit Salad (No Sugar) – பழச் சாலட் (சர்க்கரை இல்லாமல்)', 0.00, true, '2026-03-18 16:11:39.500662+05:30', 10, 'items/Fruit_Salad_No_Sugar.jpg', '');
INSERT INTO public.items VALUES (80, 'Brown Rice Veg Bowl – ப்ரவுன் ரைஸ் காய்கறி பௌல்', 0.00, true, '2026-03-18 16:14:12.811739+05:30', 11, 'items/Brown_Rice_Veg_Bowl.jpg', '');
INSERT INTO public.items VALUES (81, 'Quinoa Veg Bowl – குவினோவா காய்கறி பௌல்', 0.00, true, '2026-03-18 16:14:45.593496+05:30', 11, 'items/Quinoa_Veg_Bowl.jpg', '');
INSERT INTO public.items VALUES (82, 'Steamed Vegetable Bowl – ஆவியில் வேகவைத்த காய்கறி பௌல்', 0.00, true, '2026-03-18 16:15:05.233635+05:30', 11, 'items/Steamed_Vegetable_Bowl.jpg', '');
INSERT INTO public.items VALUES (83, 'Veg Clear Soup – காய்கறி கிளியர் சூப்', 0.00, true, '2026-03-18 16:15:23.527593+05:30', 11, 'items/Veg_Clear_Soup.jpg', '');
INSERT INTO public.items VALUES (84, 'Tomato Diet Soup – டயட் தக்காளி சூப்', 0.00, true, '2026-03-18 16:15:45.536897+05:30', 11, 'items/Tomato_Diet_Soup.jpg', '');
INSERT INTO public.items VALUES (85, 'Roasted Chickpeas – வறுத்த கொண்டைக்கடலை', 0.00, true, '2026-03-18 16:16:09.741707+05:30', 12, 'items/Roasted_Chickpeas.jpg', '');
INSERT INTO public.items VALUES (86, 'Boiled Corn Cup – வேகவைத்த மக்காச்சோளம்', 0.00, true, '2026-03-18 16:17:24.737708+05:30', 12, 'items/MasalaCorn_0365-2-786x1024.jpg', '');
INSERT INTO public.items VALUES (32, 'Chicken  Kottu Roti', 500.00, true, '2026-03-18 15:37:17.771666+05:30', 3, 'items/Chicken__Kottu_Roti.jpg', '014C');


--
-- Data for Name: meal_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.meal_types VALUES (1, 'Breakfast', '20:00:00');
INSERT INTO public.meal_types VALUES (2, 'Dinner', '12:00:00');


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.users VALUES (1, 'pbkdf2_sha256$600000$9xLIjdxSaUjLrTsSCvsVtK$nv4U4BaieH0peAi4eo79ZrU+oSit9Hv3vkUqQ5OfjmA=', NULL, true, 'admin', NULL, true, true, '2026-03-17 22:13:24.131643+05:30', 1);
INSERT INTO public.users VALUES (2, 'pbkdf2_sha256$600000$3Q9pafkR6c5v2jishnhkNW$sFXoYa+rZOfFRnryz8x7gDfKOhuFFEcNSE3MK8PGFnQ=', NULL, false, 'Mathusan', 'it24100268@my.sliit.lk', true, false, '2026-03-17 22:22:28.96045+05:30', 2);
INSERT INTO public.users VALUES (4, 'pbkdf2_sha256$600000$4qornZpdnClm3LSEGPcpfc$JspPd85hiDG6s2z3NB+NZPurGWpFj8ScHe7MTw2zb8k=', NULL, false, 'cashier', NULL, true, false, '2026-03-17 22:27:38.101509+05:30', 3);
INSERT INTO public.users VALUES (5, 'pbkdf2_sha256$600000$v6D1yThUwMKuWNg8XnK4V3$R+dJVjD1FeP71w/XU/yhHrrE6qmtInm1rRUWFfoa+/U=', NULL, false, 'Chudar', 'manivannanmathusan7@gmail.com', true, false, '2026-03-21 12:19:21.933747+05:30', 2);
INSERT INTO public.users VALUES (8, '!fGsygHPoNfQ77A7wDMrHcjp8cKRHAXEz9CMF9VKr', NULL, false, 'ppaviththiran815', 'ppaviththiran815@gmail.com', true, false, '2026-03-23 10:50:43.136461+05:30', 2);
INSERT INTO public.users VALUES (9, 'pbkdf2_sha256$600000$9B7iXlwU0iBQaWa2QBDOEA$7xVEW3CUZcko50e+0KzEU9RNU0UQEzbEt6U811Lhq0k=', NULL, false, 'Kitlar', 'kitlarchudar@gmail.com', true, false, '2026-04-04 13:45:54.271158+05:30', 2);


--
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.students VALUES (1, 'IT24100268', 'Mathusan manivannan', '0718813479', 2);
INSERT INTO public.students VALUES (2, 'It24100196', 'Chudar', '0718813479', 5);
INSERT INTO public.students VALUES (3, 'G-341ACCCA', 'Paviththiran Pavi', '', 8);
INSERT INTO public.students VALUES (4, 'STU-10A7C0FC', 'Kitar Chudar', '0768081026', 9);


--
-- Data for Name: meal_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.meal_orders VALUES (1, '2026-03-20', 'pending', '2026-03-19 10:01:52.682571+05:30', 2, 1, 'takeaway', 1, '', '', 'package', NULL, '', '', '');
INSERT INTO public.meal_orders VALUES (2, '2026-03-19', 'pending', '2026-03-19 10:04:35.378385+05:30', 2, 1, 'delivery', 5, 'jaffna', '', 'package', NULL, '', '', '');
INSERT INTO public.meal_orders VALUES (3, '2026-03-20', 'confirmed', '2026-03-19 10:48:35.705804+05:30', 1, 1, 'delivery', 5, 'Northern , uni', '0728813479', 'package', NULL, '', '', '');
INSERT INTO public.meal_orders VALUES (4, '2026-03-20', 'pending', '2026-03-19 11:16:16.10098+05:30', 2, 1, 'takeaway', 1, '', '', 'package', NULL, '', '', '');
INSERT INTO public.meal_orders VALUES (5, '2026-03-21', 'confirmed', '2026-03-20 07:52:58.267616+05:30', 1, 1, 'takeaway', 1, '', '', 'package', NULL, '', '', '');
INSERT INTO public.meal_orders VALUES (32, '2026-03-24', 'confirmed', '2026-03-22 23:37:23.170126+05:30', 1, 1, 'takeaway', 1, '', '', 'package', NULL, 'it24100268@my.sliit.lk', 'c2d101af-bd4f-4fdd-8968-8291a8b0d7a5', 'veg');
INSERT INTO public.meal_orders VALUES (36, '2026-03-23', 'confirmed', '2026-03-23 08:48:36.351187+05:30', NULL, 1, 'takeaway', 1, '', '', 'item', 86, 'it24100268@my.sliit.lk', 'bafc8b53-7c8e-4799-907e-92fc4de09d4b', '');
INSERT INTO public.meal_orders VALUES (35, '2026-03-23', 'confirmed', '2026-03-23 08:48:36.34617+05:30', NULL, 1, 'takeaway', 1, '', '', 'item', 85, 'it24100268@my.sliit.lk', 'bafc8b53-7c8e-4799-907e-92fc4de09d4b', '');
INSERT INTO public.meal_orders VALUES (33, '2026-03-25', 'confirmed', '2026-03-23 08:48:36.26607+05:30', 1, 1, 'takeaway', 1, '', '', 'package', NULL, 'it24100268@my.sliit.lk', 'bafc8b53-7c8e-4799-907e-92fc4de09d4b', 'non-veg');
INSERT INTO public.meal_orders VALUES (34, '2026-03-23', 'confirmed', '2026-03-23 08:48:36.339109+05:30', NULL, 1, 'takeaway', 1, '', '', 'item', 81, 'it24100268@my.sliit.lk', 'bafc8b53-7c8e-4799-907e-92fc4de09d4b', '');
INSERT INTO public.meal_orders VALUES (39, '2026-03-23', 'confirmed', '2026-03-23 11:06:55.39848+05:30', NULL, 1, 'takeaway', 1, '', '', 'item', 61, 'it24100268@my.sliit.lk', '402ab168-9dd4-4ea5-a38b-728240cc06ea', '');
INSERT INTO public.meal_orders VALUES (37, '2026-03-24', 'confirmed', '2026-03-23 11:06:55.379805+05:30', 1, 1, 'takeaway', 1, '', '', 'package', NULL, 'it24100268@my.sliit.lk', '402ab168-9dd4-4ea5-a38b-728240cc06ea', 'veg');
INSERT INTO public.meal_orders VALUES (38, '2026-03-23', 'confirmed', '2026-03-23 11:06:55.391813+05:30', NULL, 1, 'takeaway', 1, '', '', 'item', 59, 'it24100268@my.sliit.lk', '402ab168-9dd4-4ea5-a38b-728240cc06ea', '');
INSERT INTO public.meal_orders VALUES (40, '2026-03-24', 'pending', '2026-03-23 11:59:32.9741+05:30', 1, 3, 'takeaway', 1, '', '', 'package', NULL, 'ppaviththiran815@gmail.com', 'daaa96d2-02a8-4b1c-81ce-42645626a7a8', 'non-veg');
INSERT INTO public.meal_orders VALUES (41, '2026-03-23', 'pending', '2026-03-23 11:59:32.989118+05:30', NULL, 3, 'takeaway', 1, '', '', 'item', 60, 'ppaviththiran815@gmail.com', 'daaa96d2-02a8-4b1c-81ce-42645626a7a8', '');
INSERT INTO public.meal_orders VALUES (42, '2026-03-23', 'pending', '2026-03-23 11:59:32.992115+05:30', NULL, 3, 'takeaway', 1, '', '', 'item', 62, 'ppaviththiran815@gmail.com', 'daaa96d2-02a8-4b1c-81ce-42645626a7a8', '');
INSERT INTO public.meal_orders VALUES (43, '2026-03-24', 'pending', '2026-03-23 13:29:53.865429+05:30', 2, 1, 'delivery', 1, 'jaffna', '0768081026', 'package', NULL, 'it24100268@my.sliit.lk', 'c3839402-8a01-494c-9521-8206ea069506', 'non-veg');
INSERT INTO public.meal_orders VALUES (44, '2026-03-23', 'pending', '2026-03-23 13:29:53.872496+05:30', NULL, 1, 'takeaway', 1, '', '', 'item', 62, 'it24100268@my.sliit.lk', 'c3839402-8a01-494c-9521-8206ea069506', '');
INSERT INTO public.meal_orders VALUES (45, '2026-03-24', 'pending', '2026-03-23 15:32:37.702506+05:30', 1, 1, 'delivery', 1, 'vaddukoddai', '0778567192', 'package', NULL, 'it24100268@my.sliit.lk', '6a647c0e-fdee-4e99-b2af-1bdd401e93ee', 'non-veg');
INSERT INTO public.meal_orders VALUES (46, '2026-03-23', 'pending', '2026-03-23 15:32:37.711184+05:30', NULL, 1, 'takeaway', 1, '', '', 'item', 33, 'it24100268@my.sliit.lk', '6a647c0e-fdee-4e99-b2af-1bdd401e93ee', '');
INSERT INTO public.meal_orders VALUES (47, '2026-03-23', 'pending', '2026-03-23 15:32:37.71563+05:30', NULL, 1, 'takeaway', 1, '', '', 'item', 62, 'it24100268@my.sliit.lk', '6a647c0e-fdee-4e99-b2af-1bdd401e93ee', '');
INSERT INTO public.meal_orders VALUES (49, '2026-03-25', 'confirmed', '2026-03-23 15:37:14.515479+05:30', 2, 1, 'takeaway', 1, '', '', 'package', NULL, 'it24100268@my.sliit.lk', 'bfa7d538-c03d-4680-8355-b144885f2ebf', 'veg');
INSERT INTO public.meal_orders VALUES (48, '2026-03-27', 'cancelled', '2026-03-23 15:35:56.866567+05:30', 2, 1, 'takeaway', 1, '', '', 'package', NULL, 'it24100268@my.sliit.lk', 'f5361d40-4a01-4f08-89e4-39db1a77f730', 'non-veg');
INSERT INTO public.meal_orders VALUES (50, '2026-03-24', 'pending', '2026-03-23 19:09:53.268981+05:30', 1, 1, 'takeaway', 1, '', '', 'package', NULL, 'it24100268@my.sliit.lk', '494232ce-5870-4ecb-bd50-bb7d6eee9285', 'veg');
INSERT INTO public.meal_orders VALUES (51, '2026-03-24', 'pending', '2026-03-23 19:12:25.383243+05:30', 1, 1, 'takeaway', 1, '', '', 'package', NULL, 'it24100268@my.sliit.lk', '9971863e-c8d7-44f9-ab66-d626aa15aaed', 'veg');
INSERT INTO public.meal_orders VALUES (52, '2026-03-24', 'cancelled', '2026-03-23 19:13:48.707659+05:30', 1, 1, 'takeaway', 1, '', '', 'package', NULL, 'it24100268@my.sliit.lk', '517a3236-bc22-4a4a-b20a-f611d436a1ed', 'non-veg');


--
-- Data for Name: bills; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.bills VALUES (3, 'BILL-310BC1F0', 'walk_in', '[{"qty": 1, "name": "Dosa", "line_total": 100.0, "unit_price": 100.0}, {"qty": 1, "name": "String Hopper", "line_total": 200.0, "unit_price": 200.0}, {"qty": 1, "name": "Idly", "line_total": 100.0, "unit_price": 100.0}]', 400.00, '', '2026-03-21 12:54:10.524629+05:30', NULL, '');
INSERT INTO public.bills VALUES (4, 'BILL-1EAEB030', 'walk_in', '[{"qty": 1, "name": "Pittu", "line_total": 200.0, "unit_price": 200.0}, {"qty": 1, "name": "String Hopper", "line_total": 200.0, "unit_price": 200.0}, {"qty": 1, "name": "Idly", "line_total": 100.0, "unit_price": 100.0}]', 500.00, '', '2026-03-21 12:56:11.503662+05:30', NULL, '');
INSERT INTO public.bills VALUES (5, 'BILL-EE1F5A0F', 'walk_in', '[{"qty": 1, "name": "String Hopper", "line_total": 200.0, "unit_price": 200.0}, {"qty": 1, "name": "Veg Paneer Pittu Kottu", "line_total": 450.0, "unit_price": 450.0}]', 650.00, '', '2026-03-21 12:56:48.833953+05:30', NULL, '');
INSERT INTO public.bills VALUES (6, 'BILL-4087ADCF', 'walk_in', '[{"qty": 1, "name": "Dosa", "line_total": 100.0, "unit_price": 100.0}, {"qty": 1, "name": "Pittu", "line_total": 200.0, "unit_price": 200.0}, {"qty": 1, "name": "String Hopper", "line_total": 200.0, "unit_price": 200.0}]', 500.00, '', '2026-03-21 12:59:55.612593+05:30', NULL, '');
INSERT INTO public.bills VALUES (7, 'BILL-28470A41', 'walk_in', '[{"qty": 1, "name": "Dosa", "line_total": 100.0, "unit_price": 100.0}, {"qty": 1, "name": "String Hopper", "line_total": 200.0, "unit_price": 200.0}]', 300.00, '', '2026-03-21 13:02:32.206742+05:30', NULL, '');
INSERT INTO public.bills VALUES (8, 'BILL-24CB1840', 'online', '[{"qty": 1, "name": "Breakfast", "line_total": 0, "unit_price": 0}]', 0.00, 'it24100268@my.sliit.lk', '2026-03-21 13:03:03.200564+05:30', 5, '');
INSERT INTO public.bills VALUES (12, 'BILL-01EABBE4', 'walk_in', '[{"qty": 1, "name": "Dosa", "line_total": 100.0, "unit_price": 100.0}, {"qty": 1, "name": "Pittu", "line_total": 200.0, "unit_price": 200.0}]', 300.00, '', '2026-03-21 19:11:21.502284+05:30', NULL, '');
INSERT INTO public.bills VALUES (13, 'BILL-BE63C3BD', 'walk_in', '[{"qty": 1, "name": "Dosa", "line_total": 100.0, "unit_price": 100.0}, {"qty": 1, "name": "Pittu", "line_total": 200.0, "unit_price": 200.0}, {"qty": 1, "name": "String Hopper", "line_total": 200.0, "unit_price": 200.0}]', 500.00, '', '2026-03-21 19:22:49.816559+05:30', NULL, '');
INSERT INTO public.bills VALUES (14, 'BILL-A7181B8A', 'walk_in', '[{"qty": 1, "name": "Veg Pittu Kottu", "line_total": 350.0, "unit_price": 350.0}, {"qty": 1, "name": "Veg Paneer Pittu Kottu", "line_total": 450.0, "unit_price": 450.0}, {"qty": 1, "name": "Veg Paneer Noodils", "line_total": 450.0, "unit_price": 450.0}, {"qty": 1, "name": "Veg String Hoppers Kottu", "line_total": 350.0, "unit_price": 350.0}, {"qty": 1, "name": "Veg Paneer String Hoppers Kottu", "line_total": 450.0, "unit_price": 450.0}]', 2050.00, '', '2026-03-21 19:25:36.516848+05:30', NULL, '');
INSERT INTO public.bills VALUES (15, 'BILL-18F8483D', 'walk_in', '[{"qty": 1, "name": "String Hopper", "line_total": 200.0, "unit_price": 200.0}, {"qty": 1, "name": "Idly", "line_total": 100.0, "unit_price": 100.0}, {"qty": 1, "name": "Veg Fried Noodils", "line_total": 350.0, "unit_price": 350.0}]', 650.00, '', '2026-03-21 19:28:59.761152+05:30', NULL, '');
INSERT INTO public.bills VALUES (16, 'BILL-2545C9CA', 'walk_in', '[{"qty": 1, "name": "Dosa", "line_total": 100.0, "unit_price": 100.0}, {"qty": 1, "name": "Pittu", "line_total": 200.0, "unit_price": 200.0}, {"qty": 1, "name": "String Hopper", "line_total": 200.0, "unit_price": 200.0}]', 500.00, '', '2026-03-21 19:31:30.504858+05:30', NULL, '');
INSERT INTO public.bills VALUES (17, 'BILL-228E2874', 'walk_in', '[{"qty": 1, "name": "Idly", "line_total": 100.0, "unit_price": 100.0}, {"qty": 1, "name": "Veg Paneer Pittu Kottu", "line_total": 450.0, "unit_price": 450.0}, {"qty": 1, "name": "Veg Fried Noodils", "line_total": 350.0, "unit_price": 350.0}]', 900.00, '', '2026-03-21 19:32:16.637572+05:30', NULL, '');
INSERT INTO public.bills VALUES (18, 'BILL-2B58D43F', 'walk_in', '[{"qty": 1, "name": "Dosa", "line_total": 100.0, "unit_price": 100.0}, {"qty": 1, "name": "Pittu", "line_total": 200.0, "unit_price": 200.0}, {"qty": 1, "name": "String Hopper", "line_total": 200.0, "unit_price": 200.0}]', 500.00, '', '2026-03-22 08:34:41.496888+05:30', NULL, '');
INSERT INTO public.bills VALUES (20, 'BILL-12DA2FD1', 'online', '[{"qty": 1, "name": "Breakfast", "line_total": 200.0, "unit_price": 200.0}]', 200.00, 'it24100268@my.sliit.lk', '2026-03-22 23:37:43.270625+05:30', 32, '');
INSERT INTO public.bills VALUES (21, 'BILL-325B0DA9', 'online', '[{"qty": 1, "name": "Quinoa Veg Bowl – குவினோவா காய்கறி பௌல்", "line_total": 0.0, "unit_price": 0.0}, {"qty": 1, "name": "Roasted Chickpeas – வறுத்த கொண்டைக்கடலை", "line_total": 0.0, "unit_price": 0.0}, {"qty": 1, "name": "Boiled Corn Cup – வேகவைத்த மக்காச்சோளம்", "line_total": 0.0, "unit_price": 0.0}, {"qty": 1, "name": "Breakfast", "line_total": 200.0, "unit_price": 200.0}]', 200.00, 'it24100268@my.sliit.lk', '2026-03-23 08:48:50.331307+05:30', 36, '');
INSERT INTO public.bills VALUES (22, 'BILL-420F77CB', 'walk_in', '[{"qty": 1, "name": "Veg Sandwich", "line_total": 200.0, "unit_price": 200.0}, {"qty": 1, "name": "Veg Panner Sandwich", "line_total": 250.0, "unit_price": 250.0}, {"qty": 1, "name": "Egg  Sandwich", "line_total": 250.0, "unit_price": 250.0}]', 700.00, '', '2026-03-23 08:50:08.728486+05:30', NULL, '');
INSERT INTO public.bills VALUES (23, 'BILL-251D2DBF', 'online', '[{"qty": 1, "name": "Egg Appam With Sambol", "line_total": 200.0, "unit_price": 200.0}, {"qty": 1, "name": "Egg Onion Uttappam", "line_total": 200.0, "unit_price": 200.0}, {"qty": 1, "name": "Breakfast", "line_total": 200.0, "unit_price": 200.0}]', 600.00, 'it24100268@my.sliit.lk', '2026-03-23 11:07:12.709251+05:30', 39, '');
INSERT INTO public.bills VALUES (24, 'BILL-14E51A97', 'walk_in', '[{"qty": 1, "name": "Dosa", "line_total": 100.0, "unit_price": 100.0}]', 100.00, '', '2026-03-23 11:07:55.208231+05:30', NULL, '');
INSERT INTO public.bills VALUES (25, 'BILL-321B4620', 'walk_in', '[{"qty": 1, "name": "Pittu", "line_total": 200.0, "unit_price": 200.0}, {"qty": 1, "name": "String Hopper", "line_total": 200.0, "unit_price": 200.0}, {"qty": 1, "name": "Veg Paneer Pittu Kottu", "line_total": 450.0, "unit_price": 450.0}]', 850.00, '', '2026-03-23 15:33:32.728857+05:30', NULL, '');
INSERT INTO public.bills VALUES (26, 'BILL-9D4C6D62', 'walk_in', '[{"qty": 1, "name": "String Hopper", "line_total": 200.0, "unit_price": 200.0}]', 200.00, '', '2026-03-23 15:51:33.000067+05:30', NULL, '');
INSERT INTO public.bills VALUES (27, 'BILL-C3DF893E', 'online', '[{"qty": 1, "name": "Dinner", "line_total": 200.0, "unit_price": 200.0}]', 200.00, 'it24100268@my.sliit.lk', '2026-03-23 15:52:26.599837+05:30', 49, '');
INSERT INTO public.bills VALUES (1, 'BILL-7DE7AE40', 'online', '[{"qty": 3, "name": "Dinner", "line_total": 0, "unit_price": 0}]', 0.00, 'manivannanmathusan7@gmail.com', '2026-03-21 12:42:15.68297+05:30', NULL, '');
INSERT INTO public.bills VALUES (2, 'BILL-16790FAE', 'online', '[{"qty": 1, "name": "Dinner", "line_total": 0, "unit_price": 0}]', 0.00, 'manivannanmathusan7@gmail.com', '2026-03-21 12:44:21.297388+05:30', NULL, '');
INSERT INTO public.bills VALUES (9, 'BILL-B8EABBCF', 'online', '[{"qty": 1, "name": "Egg Appam With Sambol", "line_total": 200.0, "unit_price": 200.0}]', 200.00, 'manivannanmathusan7@gmail.com', '2026-03-21 18:54:04.497055+05:30', NULL, '');
INSERT INTO public.bills VALUES (10, 'BILL-7305DE90', 'online', '[{"qty": 1, "name": "Egg Veg &Onion Uttappam", "line_total": 250.0, "unit_price": 250.0}]', 250.00, 'manivannanmathusan7@gmail.com', '2026-03-21 18:59:42.002192+05:30', NULL, '');
INSERT INTO public.bills VALUES (11, 'BILL-BB63FAD4', 'online', '[{"qty": 1, "name": "Egg Appam With Sambol", "line_total": 200.0, "unit_price": 200.0}, {"qty": 1, "name": "Egg Veg &Onion Uttappam", "line_total": 250.0, "unit_price": 250.0}, {"qty": 1, "name": "Breakfast", "line_total": 0, "unit_price": 0}]', 450.00, 'manivannanmathusan7@gmail.com', '2026-03-21 19:10:22.624212+05:30', NULL, '');
INSERT INTO public.bills VALUES (19, 'BILL-CCA87CDF', 'online', '[{"qty": 1, "name": "Plain Appam with Sambol", "line_total": 150.0, "unit_price": 150.0}, {"qty": 1, "name": "Egg Veg &Onion Uttappam", "line_total": 250.0, "unit_price": 250.0}, {"qty": 1, "name": "Roasted Chickpeas – வறுத்த கொண்டைக்கடலை", "line_total": 0.0, "unit_price": 0.0}, {"qty": 1, "name": "Breakfast", "line_total": 200.0, "unit_price": 200.0}]', 600.00, 'manivannanmathusan7@gmail.com', '2026-03-22 20:07:58.030715+05:30', NULL, '');


--
-- Data for Name: branches; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: django_admin_log; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: django_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.django_migrations VALUES (1, 'contenttypes', '0001_initial', '2026-03-17 22:12:02.913284+05:30');
INSERT INTO public.django_migrations VALUES (2, 'contenttypes', '0002_remove_content_type_name', '2026-03-17 22:12:02.934268+05:30');
INSERT INTO public.django_migrations VALUES (3, 'auth', '0001_initial', '2026-03-17 22:12:03.020664+05:30');
INSERT INTO public.django_migrations VALUES (4, 'auth', '0002_alter_permission_name_max_length', '2026-03-17 22:12:03.029626+05:30');
INSERT INTO public.django_migrations VALUES (5, 'auth', '0003_alter_user_email_max_length', '2026-03-17 22:12:03.040381+05:30');
INSERT INTO public.django_migrations VALUES (6, 'auth', '0004_alter_user_username_opts', '2026-03-17 22:12:03.058364+05:30');
INSERT INTO public.django_migrations VALUES (7, 'auth', '0005_alter_user_last_login_null', '2026-03-17 22:12:03.082715+05:30');
INSERT INTO public.django_migrations VALUES (8, 'auth', '0006_require_contenttypes_0002', '2026-03-17 22:12:03.094208+05:30');
INSERT INTO public.django_migrations VALUES (9, 'auth', '0007_alter_validators_add_error_messages', '2026-03-17 22:12:03.118943+05:30');
INSERT INTO public.django_migrations VALUES (10, 'auth', '0008_alter_user_username_max_length', '2026-03-17 22:12:03.145433+05:30');
INSERT INTO public.django_migrations VALUES (11, 'auth', '0009_alter_user_last_name_max_length', '2026-03-17 22:12:03.171579+05:30');
INSERT INTO public.django_migrations VALUES (12, 'auth', '0010_alter_group_name_max_length', '2026-03-17 22:12:03.203561+05:30');
INSERT INTO public.django_migrations VALUES (13, 'auth', '0011_update_proxy_permissions', '2026-03-17 22:12:03.225564+05:30');
INSERT INTO public.django_migrations VALUES (14, 'auth', '0012_alter_user_first_name_max_length', '2026-03-17 22:12:03.250555+05:30');
INSERT INTO public.django_migrations VALUES (15, 'authentication', '0001_initial', '2026-03-17 22:12:03.441619+05:30');
INSERT INTO public.django_migrations VALUES (16, 'admin', '0001_initial', '2026-03-17 22:12:03.509174+05:30');
INSERT INTO public.django_migrations VALUES (17, 'admin', '0002_logentry_remove_auto_add', '2026-03-17 22:12:03.526185+05:30');
INSERT INTO public.django_migrations VALUES (18, 'admin', '0003_logentry_add_action_flag_choices', '2026-03-17 22:12:03.54318+05:30');
INSERT INTO public.django_migrations VALUES (19, 'events', '0001_initial', '2026-03-17 22:12:03.583217+05:30');
INSERT INTO public.django_migrations VALUES (20, 'partners', '0001_initial', '2026-03-17 22:12:03.73143+05:30');
INSERT INTO public.django_migrations VALUES (21, 'events', '0002_initial', '2026-03-17 22:12:03.806548+05:30');
INSERT INTO public.django_migrations VALUES (22, 'meals', '0001_initial', '2026-03-17 22:12:03.998091+05:30');
INSERT INTO public.django_migrations VALUES (23, 'pos', '0001_initial', '2026-03-17 22:12:04.242644+05:30');
INSERT INTO public.django_migrations VALUES (24, 'reports', '0001_initial', '2026-03-17 22:12:04.265642+05:30');
INSERT INTO public.django_migrations VALUES (25, 'sessions', '0001_initial', '2026-03-17 22:12:04.292198+05:30');
INSERT INTO public.django_migrations VALUES (26, 'token_blacklist', '0001_initial', '2026-03-17 22:12:04.38122+05:30');
INSERT INTO public.django_migrations VALUES (27, 'token_blacklist', '0002_outstandingtoken_jti_hex', '2026-03-17 22:12:04.405777+05:30');
INSERT INTO public.django_migrations VALUES (28, 'token_blacklist', '0003_auto_20171017_2007', '2026-03-17 22:12:04.479803+05:30');
INSERT INTO public.django_migrations VALUES (29, 'token_blacklist', '0004_auto_20171017_2013', '2026-03-17 22:12:04.531353+05:30');
INSERT INTO public.django_migrations VALUES (30, 'token_blacklist', '0005_remove_outstandingtoken_jti', '2026-03-17 22:12:04.570354+05:30');
INSERT INTO public.django_migrations VALUES (31, 'token_blacklist', '0006_auto_20171017_2113', '2026-03-17 22:12:04.601605+05:30');
INSERT INTO public.django_migrations VALUES (32, 'token_blacklist', '0007_auto_20171017_2214', '2026-03-17 22:12:04.670606+05:30');
INSERT INTO public.django_migrations VALUES (33, 'token_blacklist', '0008_migrate_to_bigautofield', '2026-03-17 22:12:04.76972+05:30');
INSERT INTO public.django_migrations VALUES (34, 'token_blacklist', '0010_fix_migrate_to_bigautofield', '2026-03-17 22:12:04.817384+05:30');
INSERT INTO public.django_migrations VALUES (35, 'token_blacklist', '0011_linearizes_history', '2026-03-17 22:12:04.823386+05:30');
INSERT INTO public.django_migrations VALUES (36, 'token_blacklist', '0012_alter_outstandingtoken_user', '2026-03-17 22:12:04.861386+05:30');
INSERT INTO public.django_migrations VALUES (37, 'pos', '0002_item_image', '2026-03-18 08:59:29.842981+05:30');
INSERT INTO public.django_migrations VALUES (38, 'pos', '0003_item_item_id', '2026-03-18 09:28:40.952636+05:30');
INSERT INTO public.django_migrations VALUES (39, 'meals', '0002_mealorder_delivery_type_mealorder_quantity', '2026-03-19 07:50:21.025672+05:30');
INSERT INTO public.django_migrations VALUES (40, 'meals', '0003_mealorder_delivery_address', '2026-03-19 07:54:14.995457+05:30');
INSERT INTO public.django_migrations VALUES (41, 'meals', '0004_mealorder_phone_number', '2026-03-19 10:46:17.964223+05:30');
INSERT INTO public.django_migrations VALUES (42, 'meals', '0005_notification', '2026-03-19 10:55:36.591953+05:30');
INSERT INTO public.django_migrations VALUES (43, 'meals', '0006_mealpackage', '2026-03-19 12:50:10.022325+05:30');
INSERT INTO public.django_migrations VALUES (44, 'meals', '0007_seed_meal_packages', '2026-03-19 12:50:10.125366+05:30');
INSERT INTO public.django_migrations VALUES (45, 'pos', '0004_category_cascade_delete', '2026-03-19 16:22:50.836988+05:30');
INSERT INTO public.django_migrations VALUES (46, 'meals', '0008_mealorder_order_type_item', '2026-03-20 07:16:56.992801+05:30');
INSERT INTO public.django_migrations VALUES (47, 'pos', '0005_featureditem', '2026-03-21 07:32:23.061336+05:30');
INSERT INTO public.django_migrations VALUES (48, 'pos', '0006_weeklymealplan', '2026-03-21 10:46:36.548881+05:30');
INSERT INTO public.django_migrations VALUES (49, 'meals', '0009_bill_and_student_email', '2026-03-21 12:13:44.888535+05:30');
INSERT INTO public.django_migrations VALUES (50, 'meals', '0010_add_customer_name_to_bill', '2026-03-21 12:35:31.454321+05:30');
INSERT INTO public.django_migrations VALUES (51, 'meals', '0011_alter_mealorder_meal_type', '2026-03-21 18:15:51.685983+05:30');
INSERT INTO public.django_migrations VALUES (52, 'meals', '0012_mealorder_session_id', '2026-03-21 18:20:06.690309+05:30');
INSERT INTO public.django_migrations VALUES (53, 'pos', '0007_posorder_bill_id', '2026-03-21 18:25:23.875438+05:30');
INSERT INTO public.django_migrations VALUES (54, 'meals', '0013_mealorder_preference', '2026-03-21 22:04:43.966062+05:30');
INSERT INTO public.django_migrations VALUES (55, 'reports', '0002_incomeoutcome', '2026-03-21 22:33:45.896265+05:30');
INSERT INTO public.django_migrations VALUES (56, 'reports', '0003_payment_date_default', '2026-03-23 08:30:49.346196+05:30');
INSERT INTO public.django_migrations VALUES (57, 'meals', '0014_suggestion', '2026-03-24 18:04:32.970008+05:30');
INSERT INTO public.django_migrations VALUES (58, 'meals', '0015_notification_order_nullable', '2026-03-24 18:09:44.616321+05:30');


--
-- Data for Name: django_session; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.events VALUES (1, 'Wedding', 'Jack', '0718813479', '2026-03-23', 'jaffna', 50000.00, 'completed', '2026-03-23 08:42:56.561398+05:30', NULL);


--
-- Data for Name: featured_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.featured_items VALUES (1, 1, '2026-03-21 07:34:17.963608+05:30', 1);
INSERT INTO public.featured_items VALUES (2, 2, '2026-03-21 07:34:29.814823+05:30', 35);
INSERT INTO public.featured_items VALUES (3, 3, '2026-03-21 07:34:43.155057+05:30', 49);
INSERT INTO public.featured_items VALUES (6, 4, '2026-03-21 09:43:25.142595+05:30', 55);


--
-- Data for Name: income_outcome; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.income_outcome VALUES (1, 'income', 20000.00, 'For a wedding', '2026-03-21', '2026-03-21 22:41:07.779536+05:30');
INSERT INTO public.income_outcome VALUES (2, 'outcome', 10000.00, 'For purchasing', '2026-03-21', '2026-03-21 22:41:09.401878+05:30');


--
-- Data for Name: meal_packages; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.meal_packages VALUES (2, 0, 'Monday Veg Dinner', 'Comforting Monday dinner — red rice with a selection of fresh vegetable curries.', true, '2026-03-19 12:50:10.084851+05:30', '2026-03-19 12:50:10.084851+05:30', 2);
INSERT INTO public.meal_packages VALUES (3, 1, 'Tuesday Veg Breakfast', 'Light and nutritious — plain hoppers with kiri hodi and a boiled egg.', true, '2026-03-19 12:50:10.087851+05:30', '2026-03-19 12:50:10.087851+05:30', 1);
INSERT INTO public.meal_packages VALUES (4, 1, 'Tuesday Veg Dinner', 'White rice with beetroot curry, potato curry and a warm lentil soup.', true, '2026-03-19 12:50:10.090854+05:30', '2026-03-19 12:50:10.090854+05:30', 2);
INSERT INTO public.meal_packages VALUES (5, 2, 'Wednesday Veg Breakfast', 'Midweek energy boost — pittu with dhal curry and fresh coconut milk gravy.', true, '2026-03-19 12:50:10.093851+05:30', '2026-03-19 12:50:10.093851+05:30', 1);
INSERT INTO public.meal_packages VALUES (6, 2, 'Wednesday Veg Dinner', 'Red rice with jackfruit curry, tempered potatoes and a refreshing raita.', true, '2026-03-19 12:50:10.095851+05:30', '2026-03-19 12:50:10.095851+05:30', 2);
INSERT INTO public.meal_packages VALUES (7, 3, 'Thursday Veg Breakfast', 'Egg hoppers with seeni sambol and a warm cup of Milo — a classic Sri Lankan morning.', true, '2026-03-19 12:50:10.097844+05:30', '2026-03-19 12:50:10.097844+05:30', 1);
INSERT INTO public.meal_packages VALUES (8, 3, 'Thursday Veg Dinner', 'White rice with egg curry, pumpkin curry and a hearty vegetable soup.', true, '2026-03-19 12:50:10.101847+05:30', '2026-03-19 12:50:10.101847+05:30', 2);
INSERT INTO public.meal_packages VALUES (9, 4, 'Friday Veg Breakfast', 'End the weekday right — roti with dhal curry, pol sambol and fresh juice.', true, '2026-03-19 12:50:10.105846+05:30', '2026-03-19 12:50:10.105846+05:30', 1);
INSERT INTO public.meal_packages VALUES (10, 4, 'Friday Veg Dinner', 'Red rice with potato curry, mallum and watalappan for a sweet finish.', true, '2026-03-19 12:50:10.109851+05:30', '2026-03-19 12:50:10.109851+05:30', 2);
INSERT INTO public.meal_packages VALUES (11, 5, 'Saturday Non-Veg Breakfast', 'Weekend treat — string hoppers with chicken curry and a creamy coconut milk gravy.', false, '2026-03-19 12:50:10.112919+05:30', '2026-03-19 12:50:10.112919+05:30', 1);
INSERT INTO public.meal_packages VALUES (12, 5, 'Saturday Non-Veg Dinner', 'Special Saturday dinner — white rice with fish curry, prawn curry and curd & treacle dessert.', false, '2026-03-19 12:50:10.114869+05:30', '2026-03-19 12:50:10.114869+05:30', 2);
INSERT INTO public.meal_packages VALUES (13, 6, 'Sunday Non-Veg Breakfast', 'Lazy Sunday breakfast — egg hoppers with chicken soup and fresh juice.', false, '2026-03-19 12:50:10.117851+05:30', '2026-03-19 12:50:10.117851+05:30', 1);
INSERT INTO public.meal_packages VALUES (14, 6, 'Sunday Non-Veg Dinner', 'Grand Sunday dinner — red rice with mutton curry, fish curry and watalappan to close the week.', false, '2026-03-19 12:50:10.119856+05:30', '2026-03-19 12:50:10.119856+05:30', 2);
INSERT INTO public.meal_packages VALUES (1, 0, 'Monday Veg Breakfast', 'A wholesome Sri Lankan veg breakfast to start the week — string hoppers with dhal and coconut milk gravy.', true, '2026-03-19 12:50:10.080851+05:30', '2026-03-19 13:04:03.361069+05:30', 1);


--
-- Data for Name: meal_packages_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.meal_packages_items VALUES (24, 5, 2);
INSERT INTO public.meal_packages_items VALUES (42, 8, 14);


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.notifications VALUES (1, '✅ Your Breakfast order for 2026-03-20 has been confirmed! Expect delivery to your address.', true, '2026-03-19 10:58:36.720456+05:30', 3, 1);
INSERT INTO public.notifications VALUES (13, '✅ Your Veg Breakfast order for 2026-03-24 has been confirmed! Ready for pickup in ~30 minutes.', true, '2026-03-22 23:37:38.508725+05:30', 32, 1);
INSERT INTO public.notifications VALUES (14, '✅ Your Boiled Corn Cup – வேகவைத்த மக்காச்சோளம் order for 2026-03-23 has been confirmed! Ready for pickup in ~30 minutes.', true, '2026-03-23 08:48:47.816265+05:30', 36, 1);
INSERT INTO public.notifications VALUES (15, '✅ Your Roasted Chickpeas – வறுத்த கொண்டைக்கடலை order for 2026-03-23 has been confirmed! Ready for pickup in ~30 minutes.', true, '2026-03-23 08:48:47.817256+05:30', 35, 1);
INSERT INTO public.notifications VALUES (16, '✅ Your Non-Veg Breakfast order for 2026-03-25 has been confirmed! Ready for pickup in ~30 minutes.', true, '2026-03-23 08:48:47.862269+05:30', 33, 1);
INSERT INTO public.notifications VALUES (17, '✅ Your Quinoa Veg Bowl – குவினோவா காய்கறி பௌல் order for 2026-03-23 has been confirmed! Ready for pickup in ~30 minutes.', true, '2026-03-23 08:48:47.916931+05:30', 34, 1);
INSERT INTO public.notifications VALUES (18, '✅ Your Egg Onion Uttappam order for 2026-03-23 has been confirmed! Ready for pickup in ~30 minutes.', true, '2026-03-23 11:07:10.997934+05:30', 39, 1);
INSERT INTO public.notifications VALUES (19, '✅ Your Veg Breakfast order for 2026-03-24 has been confirmed! Ready for pickup in ~30 minutes.', true, '2026-03-23 11:07:11.01801+05:30', 37, 1);
INSERT INTO public.notifications VALUES (20, '✅ Your Egg Appam With Sambol order for 2026-03-23 has been confirmed! Ready for pickup in ~30 minutes.', true, '2026-03-23 11:07:11.038553+05:30', 38, 1);
INSERT INTO public.notifications VALUES (21, '✅ Your Veg Dinner order for 2026-03-25 has been confirmed! Ready for pickup in ~30 minutes.', true, '2026-03-23 15:52:24.763162+05:30', 49, 1);
INSERT INTO public.notifications VALUES (22, '❌ Your Non-Veg Dinner order for 2026-03-27 has been cancelled. Please contact us if you have any questions.', true, '2026-03-23 15:52:33.41762+05:30', 48, 1);
INSERT INTO public.notifications VALUES (23, '❌ Your Non-Veg Breakfast order for 2026-03-24 has been cancelled. Please contact us if you have any questions.', true, '2026-03-23 19:14:01.862785+05:30', 52, 1);


--
-- Data for Name: partner_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.payments VALUES (5, 'meal', 31, 600.00, '2026-03-22 20:07:58.039695+05:30');
INSERT INTO public.payments VALUES (7, 'meal', 32, 200.00, '2026-03-22 23:37:43.282998+05:30');
INSERT INTO public.payments VALUES (12, 'meal', 36, 200.00, '2026-03-23 00:00:00+05:30');
INSERT INTO public.payments VALUES (16, 'meal', 39, 600.00, '2026-03-23 00:00:00+05:30');
INSERT INTO public.payments VALUES (18, 'meal', 49, 200.00, '2026-03-25 00:00:00+05:30');


--
-- Data for Name: pos_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.pos_orders VALUES (1, 100.00, 'paid', '2026-03-18 09:31:44.45215+05:30', 4, 'BILL-20260318-0001');
INSERT INTO public.pos_orders VALUES (2, 1100.00, 'paid', '2026-03-18 21:09:42.65743+05:30', 4, 'BILL-20260318-0002');
INSERT INTO public.pos_orders VALUES (3, 400.00, 'paid', '2026-03-19 07:49:39.09879+05:30', 4, 'BILL-20260319-0003');
INSERT INTO public.pos_orders VALUES (4, 400.00, 'paid', '2026-03-19 10:00:53.131043+05:30', 4, 'BILL-20260319-0004');
INSERT INTO public.pos_orders VALUES (5, 1400.00, 'paid', '2026-03-19 11:12:20.966716+05:30', 4, 'BILL-20260319-0005');
INSERT INTO public.pos_orders VALUES (6, 600.00, 'paid', '2026-03-19 11:14:34.504821+05:30', 4, 'BILL-20260319-0006');
INSERT INTO public.pos_orders VALUES (7, 850.00, 'paid', '2026-03-19 17:18:10.123896+05:30', 4, 'BILL-20260319-0007');
INSERT INTO public.pos_orders VALUES (8, 1450.00, 'paid', '2026-03-20 12:18:24.710216+05:30', 4, 'BILL-20260320-0008');
INSERT INTO public.pos_orders VALUES (9, 1900.00, 'paid', '2026-03-20 18:54:07.614953+05:30', 4, 'BILL-20260320-0009');
INSERT INTO public.pos_orders VALUES (10, 500.00, 'paid', '2026-03-20 21:38:05.811512+05:30', 4, 'BILL-20260320-0010');
INSERT INTO public.pos_orders VALUES (11, 300.00, 'paid', '2026-03-20 21:38:25.130739+05:30', 4, 'BILL-20260320-0011');
INSERT INTO public.pos_orders VALUES (12, 650.00, 'paid', '2026-03-20 21:41:33.613019+05:30', 4, 'BILL-20260320-0012');
INSERT INTO public.pos_orders VALUES (13, 400.00, 'paid', '2026-03-20 21:45:20.842249+05:30', 4, 'BILL-20260320-0013');


--
-- Data for Name: pos_order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.pos_order_items VALUES (1, 1, 100.00, 1, 1);
INSERT INTO public.pos_order_items VALUES (2, 1, 100.00, 1, 2);
INSERT INTO public.pos_order_items VALUES (3, 1, 200.00, 2, 2);
INSERT INTO public.pos_order_items VALUES (4, 1, 450.00, 7, 2);
INSERT INTO public.pos_order_items VALUES (5, 1, 350.00, 8, 2);
INSERT INTO public.pos_order_items VALUES (6, 1, 100.00, 1, 3);
INSERT INTO public.pos_order_items VALUES (7, 1, 200.00, 2, 3);
INSERT INTO public.pos_order_items VALUES (8, 1, 100.00, 4, 3);
INSERT INTO public.pos_order_items VALUES (9, 1, 200.00, 2, 4);
INSERT INTO public.pos_order_items VALUES (10, 1, 200.00, 3, 4);
INSERT INTO public.pos_order_items VALUES (11, 1, 350.00, 8, 5);
INSERT INTO public.pos_order_items VALUES (12, 1, 350.00, 12, 5);
INSERT INTO public.pos_order_items VALUES (13, 1, 350.00, 15, 5);
INSERT INTO public.pos_order_items VALUES (14, 1, 350.00, 16, 5);
INSERT INTO public.pos_order_items VALUES (15, 1, 350.00, 48, 6);
INSERT INTO public.pos_order_items VALUES (16, 1, 250.00, 51, 6);
INSERT INTO public.pos_order_items VALUES (17, 2, 100.00, 1, 7);
INSERT INTO public.pos_order_items VALUES (18, 1, 200.00, 3, 7);
INSERT INTO public.pos_order_items VALUES (19, 1, 450.00, 7, 7);
INSERT INTO public.pos_order_items VALUES (20, 1, 100.00, 5, 8);
INSERT INTO public.pos_order_items VALUES (21, 1, 350.00, 6, 8);
INSERT INTO public.pos_order_items VALUES (22, 1, 300.00, 70, 8);
INSERT INTO public.pos_order_items VALUES (23, 1, 450.00, 71, 8);
INSERT INTO public.pos_order_items VALUES (24, 1, 250.00, 72, 8);
INSERT INTO public.pos_order_items VALUES (25, 1, 350.00, 14, 9);
INSERT INTO public.pos_order_items VALUES (26, 1, 350.00, 15, 9);
INSERT INTO public.pos_order_items VALUES (27, 1, 350.00, 16, 9);
INSERT INTO public.pos_order_items VALUES (28, 1, 400.00, 19, 9);
INSERT INTO public.pos_order_items VALUES (29, 1, 450.00, 21, 9);
INSERT INTO public.pos_order_items VALUES (30, 1, 100.00, 1, 10);
INSERT INTO public.pos_order_items VALUES (31, 1, 200.00, 2, 10);
INSERT INTO public.pos_order_items VALUES (32, 1, 200.00, 3, 10);
INSERT INTO public.pos_order_items VALUES (33, 1, 100.00, 1, 11);
INSERT INTO public.pos_order_items VALUES (34, 1, 200.00, 2, 11);
INSERT INTO public.pos_order_items VALUES (35, 1, 200.00, 3, 12);
INSERT INTO public.pos_order_items VALUES (36, 1, 100.00, 4, 12);
INSERT INTO public.pos_order_items VALUES (37, 1, 350.00, 8, 12);
INSERT INTO public.pos_order_items VALUES (38, 1, 200.00, 2, 13);
INSERT INTO public.pos_order_items VALUES (39, 1, 200.00, 3, 13);


--
-- Data for Name: suggestions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.suggestions VALUES (1, 'Your foods are great', true, '2026-03-24 18:05:31.782572+05:30', 1);


--
-- Data for Name: token_blacklist_outstandingtoken; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.token_blacklist_outstandingtoken VALUES (1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3Mzg1Mjc0OSwiaWF0IjoxNzczNzY2MzQ5LCJqdGkiOiIxZDljYTM1MzBlNmU0N2U2YThkZTFlMGM1YTA3NGZjYyIsInVzZXJfaWQiOjJ9.wzY52yrXyqEPz2F0IGh1rsxoHlo4ga1DJVQDUYeNTKU', '2026-03-17 22:22:29.001851+05:30', '2026-03-18 22:22:29+05:30', 2, '1d9ca3530e6e47e6a8de1e0c5a074fcc');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3Mzg1Mjg2MywiaWF0IjoxNzczNzY2NDYzLCJqdGkiOiI0NDFmMTI0NTFkMzc0Y2M2OTM2YzRmMDMzZTRkNjQ1YyIsInVzZXJfaWQiOjJ9.ZUv7mFALvWex17WHoqhufZzGd-sMp6az75ePmxuvCcA', '2026-03-17 22:24:23.231284+05:30', '2026-03-18 22:24:23+05:30', 2, '441f12451d374cc6936c4f033e4d645c');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (3, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3Mzg1MzA3NywiaWF0IjoxNzczNzY2Njc3LCJqdGkiOiJlZGVlNDFhN2FjNWY0MTI3YTRkYjI4YjdmODUzNGIyMyIsInVzZXJfaWQiOjR9.mO--OOIsUVRb5cuHS8KeY3YEgkyIbRlECUmcNarr7js', '2026-03-17 22:27:57.82193+05:30', '2026-03-18 22:27:57+05:30', 4, 'edee41a7ac5f4127a4db28b7f8534b23');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3Mzg1MzA5MCwiaWF0IjoxNzczNzY2NjkwLCJqdGkiOiIxMjkyNDlmYjMzZjE0MjIzYmZiZGY0YjFmMjYxNzUxZiIsInVzZXJfaWQiOjF9.G6N3IZvM5dAM0TE1xA62W8Acm0TKqd8W8o-Mup4jBNc', '2026-03-17 22:28:10.156836+05:30', '2026-03-18 22:28:10+05:30', 1, '129249fb33f14223bfbdf4b1f261751f');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (5, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3Mzg1MzI2NCwiaWF0IjoxNzczNzY2ODY0LCJqdGkiOiI3ZTVkNmRiY2M1OTY0Y2FlYWYyN2IyYmE3ZDFhNGNjNCIsInVzZXJfaWQiOjR9.4T1WjRP3DK4LOyqN05qd5oPG2nREqupsvr2VNfwUKrI', '2026-03-17 22:31:04.190622+05:30', '2026-03-18 22:31:04+05:30', 4, '7e5d6dbcc5964caeaf27b2ba7d1a4cc4');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (6, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3Mzg1MzI4MywiaWF0IjoxNzczNzY2ODgzLCJqdGkiOiJmOWJiMWEzMWQ0ZTc0MTg3OGEzZTU5MjBlOThhYWE2OCIsInVzZXJfaWQiOjJ9.D9sk11G-kYz-xmHD71Gcsz_-Q8FjOJbo6Ic6Gx9QuOI', '2026-03-17 22:31:23.629531+05:30', '2026-03-18 22:31:23+05:30', 2, 'f9bb1a31d4e741878a3e5920e98aaa68');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3Mzg5MTAyMSwiaWF0IjoxNzczODA0NjIxLCJqdGkiOiJmZTA0YTQ2MGM3MmQ0ZGJiYTNjMjY3NWExMTk2NWNiNCIsInVzZXJfaWQiOjJ9.WlkA3L869sT0BVLaQbSGLaKv79gabHglE8HPKXaDdw8', '2026-03-18 09:00:21.254128+05:30', '2026-03-19 09:00:21+05:30', 2, 'fe04a460c72d4dbba3c2675a11965cb4');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (8, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3Mzg5MTIwNiwiaWF0IjoxNzczODA0ODA2LCJqdGkiOiI0MWJjMTUwZDQzOGM0ZGU5YTBmNjU5NWVkYWMzNmNhMyIsInVzZXJfaWQiOjF9.VnvyQu5oYAUQrLRbB-U5gtRohc0Mpz8xmhhhreBTOK8', '2026-03-18 09:03:26.373921+05:30', '2026-03-19 09:03:26+05:30', 1, '41bc150d438c4de9a0f6595edac36ca3');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (9, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3Mzg5MjgzNCwiaWF0IjoxNzczODA2NDM0LCJqdGkiOiI1MzkwMDcwY2RjMzU0ZGFkYWI4MDRjMzViMTdjZGZjOSIsInVzZXJfaWQiOjR9.qVlEIebpksBdZwreWZ5PcUX9hNbRrf0ksRKTczGeQ6c', '2026-03-18 09:30:34.014589+05:30', '2026-03-19 09:30:34+05:30', 4, '5390070cdc354dadab804c35b17cdfc9');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3MzkwODc2MSwiaWF0IjoxNzczODIyMzYxLCJqdGkiOiI0MTFkOWNkNWM2ZWI0NWE2OTQ4Mzg2NzJmMWNmODI2ZCIsInVzZXJfaWQiOjF9.D7H3BLmMkH9dIbLLeNzhhlVgG93RCHl6d2f7JgrBAys', '2026-03-18 13:56:01.997655+05:30', '2026-03-19 13:56:01+05:30', 1, '411d9cd5c6eb45a694838672f1cf826d');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (11, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3MzkxNjQ1OCwiaWF0IjoxNzczODMwMDU4LCJqdGkiOiI0OTNjOWJhMTA1YzM0MTVhYWU3NjJkMTRiNGI2OWE2MCIsInVzZXJfaWQiOjR9.T5srUgOm_L-nPhXhjc1d06QiDOqmEG-tDHoFFVaQjEU', '2026-03-18 16:04:18.975011+05:30', '2026-03-19 16:04:18+05:30', 4, '493c9ba105c3415aae762d14b4b69a60');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (12, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3MzkxNjQ3MywiaWF0IjoxNzczODMwMDczLCJqdGkiOiI0YTk1OTViYWU4ZjA0YzA2OTNmZjU3MWZkZTBiNzdmMiIsInVzZXJfaWQiOjF9.zsEx1LxuZZrPiwd0YU9Ppoq71LwKLv9JGoSkjfC99BU', '2026-03-18 16:04:33.372624+05:30', '2026-03-19 16:04:33+05:30', 1, '4a9595bae8f04c0693ff571fde0b77f2');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (13, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3MzkxOTA5OCwiaWF0IjoxNzczODMyNjk4LCJqdGkiOiI5NzkzYWNhMGM0OWI0YWY4YTQxNzI5MTE4ZmJiY2RmMCIsInVzZXJfaWQiOjR9.2h_9meH_ozAQBiG_WGfwZ5PsiyzjLMhvWOdBOLcu-tE', '2026-03-18 16:48:18.251616+05:30', '2026-03-19 16:48:18+05:30', 4, '9793aca0c49b4af8a41729118fbbcdf0');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (14, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3MzkyMDI2OSwiaWF0IjoxNzczODMzODY5LCJqdGkiOiJhNTFlODc3NGEzMDg0M2Q1OTMwYmY5MDFjMjZjNzQxNSIsInVzZXJfaWQiOjF9.e2i8TKMb7ZQw78zsVu5ZRz0iVSygtoZAgHpYajjhBZo', '2026-03-18 17:07:49.515596+05:30', '2026-03-19 17:07:49+05:30', 1, 'a51e8774a30843d5930bf901c26c7415');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (15, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3MzkyMDU4MiwiaWF0IjoxNzczODM0MTgyLCJqdGkiOiIyNTYxODBiMmU0NWY0OTZmOTUwYzg4MjFhYzhkMzU4ZSIsInVzZXJfaWQiOjF9.CeFc-z7HXiAlaHQJAxsJuaqcEOPlqcmH3FqpIr5vyhA', '2026-03-18 17:13:02.071529+05:30', '2026-03-19 17:13:02+05:30', 1, '256180b2e45f496f950c8821ac8d358e');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (16, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3MzkyMDY1OSwiaWF0IjoxNzczODM0MjU5LCJqdGkiOiJmZDQxZGE3NGJkMDI0MTE5YWE1ODc3Y2FkZDg5N2MwMyIsInVzZXJfaWQiOjF9.N-DIHxN0IhWA7FZWkZPW4hE7vGbfdw6B4XpthZSGg8U', '2026-03-18 17:14:19.82029+05:30', '2026-03-19 17:14:19+05:30', 1, 'fd41da74bd024119aa5877cadd897c03');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (17, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3MzkzNDY3NywiaWF0IjoxNzczODQ4Mjc3LCJqdGkiOiIyYTIwMzZhYmFlMmM0ODI1YTE1ZDk0NTgzNjUxNzZkZSIsInVzZXJfaWQiOjF9.EB67RiCRuhoDiwqZXKIWyaHyK5RX405s83cA8jyvxxo', '2026-03-18 21:07:57.733159+05:30', '2026-03-19 21:07:57+05:30', 1, '2a2036abae2c4825a15d9458365176de');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (18, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3MzkzNDc1MywiaWF0IjoxNzczODQ4MzUzLCJqdGkiOiJlZmZhZTgwYjRkMWE0ODUxOTgwNjIxOWFiMzRkZTY2ZSIsInVzZXJfaWQiOjR9.M7mXiq0SYWH_dQ9Y3e1DBs6Q4GXWHVKG6ctAfJHyv0s', '2026-03-18 21:09:13.822698+05:30', '2026-03-19 21:09:13+05:30', 4, 'effae80b4d1a48519806219ab34de66e');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (19, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3MzkzNDgxNCwiaWF0IjoxNzczODQ4NDE0LCJqdGkiOiI2MmI4MjY1MTlkNDk0YWUyYjc4NTIzMjA2YTkwZDZlNiIsInVzZXJfaWQiOjJ9.KKxFGNPn5LL4SDn14x0kcdFu0lcXD4oMsaCPA3k_SYQ', '2026-03-18 21:10:14.822159+05:30', '2026-03-19 21:10:14+05:30', 2, '62b826519d494ae2b78523206a90d6e6');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (20, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3Mzk3MzE1NiwiaWF0IjoxNzczODg2NzU2LCJqdGkiOiJiYzk0MWI5MTlmYTk0NDUyOWM0Njk2YTg5OTllNTFlNCIsInVzZXJfaWQiOjR9.9VLSdnbtgA36dzehMWLKiTOt346bW_MJyYQ0j7hWtgk', '2026-03-19 07:49:16.813664+05:30', '2026-03-20 07:49:16+05:30', 4, 'bc941b919fa944529c4696a8999e51e4');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (21, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3Mzk3MzI3NSwiaWF0IjoxNzczODg2ODc1LCJqdGkiOiI3MmQ5NGVjMWJkZDU0ZThhOTlkMWRiZDY0ZDdiMjg5NSIsInVzZXJfaWQiOjJ9.fSV1kpXrnMWnk3brZcsAH_VjrLFWTlhACuKqcc4dsCA', '2026-03-19 07:51:15.08597+05:30', '2026-03-20 07:51:15+05:30', 2, '72d94ec1bdd54e8a99d1dbd64d7b2895');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (22, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3Mzk3MzU4NywiaWF0IjoxNzczODg3MTg3LCJqdGkiOiJmZWYzMjRjOWJmZDk0ZWRjYTljYWU2NWEyYTkzZWFmNCIsInVzZXJfaWQiOjF9.UVjuSsVANKD1Eab-NtH-tXOQsIRlsRggCFMPfGZAGzE', '2026-03-19 07:56:27.167091+05:30', '2026-03-20 07:56:27+05:30', 1, 'fef324c9bfd94edca9cae65a2a93eaf4');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (23, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3Mzk3Mzc1NSwiaWF0IjoxNzczODg3MzU1LCJqdGkiOiJiY2ZhOTdlZTc1NzM0NWU4ODEyZWU1Nzc0NjllNGU5MSIsInVzZXJfaWQiOjJ9.smZNL_EH-Vx_xpfMrMl_MH0AC2vn1B5EatJm80e7B-A', '2026-03-19 07:59:15.104176+05:30', '2026-03-20 07:59:15+05:30', 2, 'bcfa97ee757345e8812ee577469e4e91');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (24, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3Mzk4MDk3NCwiaWF0IjoxNzczODk0NTc0LCJqdGkiOiIxOTE2MDA1MzlmYmI0Y2Y2ODc1MzMzOTU4ODdiNThlYiIsInVzZXJfaWQiOjF9.h8Hfk-24JcmPqKuP0YgOvul1N29uR4S6oh-CE4N30cU', '2026-03-19 09:59:34.675791+05:30', '2026-03-20 09:59:34+05:30', 1, '191600539fbb4cf687533395887b58eb');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (25, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3Mzk4MTAzMSwiaWF0IjoxNzczODk0NjMxLCJqdGkiOiI4YzI5ZTZlNzIyNjI0NDM2ODNiZGQwYWE1YjBkZTg4ZCIsInVzZXJfaWQiOjR9.LEi9GLQLjn1q9nAmCw9aShZXlJv6ZXgFiw5RglZ7iIs', '2026-03-19 10:00:31.318+05:30', '2026-03-20 10:00:31+05:30', 4, '8c29e6e72262443683bdd0aa5b0de88d');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (26, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3Mzk4MTA4NSwiaWF0IjoxNzczODk0Njg1LCJqdGkiOiJmMjBlM2RmZjc2OTU0ZjQ0YWZmZGYxNTdhZGVmNzM3ZSIsInVzZXJfaWQiOjJ9.nH-k2uXERRCHvDWZLeA0SYSHEt63ycxgYXbkugVRCG8', '2026-03-19 10:01:25.049283+05:30', '2026-03-20 10:01:25+05:30', 2, 'f20e3dff76954f44affdf157adef737e');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (27, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3Mzk4MTI4OCwiaWF0IjoxNzczODk0ODg4LCJqdGkiOiI4ZTIxZjRlZjM1OTY0NDNlYmZjZjU5N2I2YmQ3OTE1YiIsInVzZXJfaWQiOjF9.R1OOuPMdp56HbIVFzj6-OeNzIeYzGwvue4odQF06oAU', '2026-03-19 10:04:48.414438+05:30', '2026-03-20 10:04:48+05:30', 1, '8e21f4ef3596443ebfcf597b6bd7915b');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (28, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3Mzk4MzA3NiwiaWF0IjoxNzczODk2Njc2LCJqdGkiOiI3NWRkMzllOTMyZDc0NzBmOGRkNmRhMGEyZGM3NDcwYiIsInVzZXJfaWQiOjF9.OGn2zXC120hFqVLitN3hijqso2cx9TZRekHKRrQZtA4', '2026-03-19 10:34:36.097967+05:30', '2026-03-20 10:34:36+05:30', 1, '75dd39e932d7470f8dd6da0a2dc7470b');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (29, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3Mzk4Mzg3NCwiaWF0IjoxNzczODk3NDc0LCJqdGkiOiJhZGQ2YjdjNThhYWY0OWU0YTU1YTAzOGE5OTE2MzlhOCIsInVzZXJfaWQiOjJ9.VCZMqS0nyqxzFYvj-kHE5YSeJI47ST2Vpv0DQ0_8O4g', '2026-03-19 10:47:54.096198+05:30', '2026-03-20 10:47:54+05:30', 2, 'add6b7c58aaf49e4a55a038a991639a8');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (30, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3Mzk4MzkyMSwiaWF0IjoxNzczODk3NTIxLCJqdGkiOiJmYzMyMzk4YzRkZTc0Y2U2ODM0MWYyMWIwMzg0ZDRiMCIsInVzZXJfaWQiOjF9.jovscJqoN1yY8AXYfP2c-ui6rmWxKgH1zd_booBMWMM', '2026-03-19 10:48:41.72258+05:30', '2026-03-20 10:48:41+05:30', 1, 'fc32398c4de74ce68341f21b0384d4b0');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (31, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3Mzk4NDUyMywiaWF0IjoxNzczODk4MTIzLCJqdGkiOiJhNTQxN2YxNmM4NTU0YWZlYTI4ZTdjNDk2M2ZkNzcxMyIsInVzZXJfaWQiOjJ9.QGC6trHIGhMhGqwUQTgEbZN3sF8JPtSpQzGd1mBu1tY', '2026-03-19 10:58:43.659678+05:30', '2026-03-20 10:58:43+05:30', 2, 'a5417f16c8554afea28e7c4963fd7713');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (32, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3Mzk4NDYxNCwiaWF0IjoxNzczODk4MjE0LCJqdGkiOiJmMWM2ZWZiNzYwMjQ0M2E4OWM3ZWI3ZmRlMjM4ZDhmZiIsInVzZXJfaWQiOjJ9.1B2bGcGSE-vi40u6rKmPmik7FuPElZ5BXRe0mFZoSMo', '2026-03-19 11:00:14.515898+05:30', '2026-03-20 11:00:14+05:30', 2, 'f1c6efb7602443a89c7eb7fde238d8ff');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (33, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3Mzk4NDgxMywiaWF0IjoxNzczODk4NDEzLCJqdGkiOiJkYjA2OTgyMjBlZTA0YzE1OWNhNDRkMTQ5YjRjZDU1ZCIsInVzZXJfaWQiOjF9.n1h5l0b4oL6qQ3DxJFVN9-fymFmlYNhJ5TxdEPjKOtQ', '2026-03-19 11:03:33.068129+05:30', '2026-03-20 11:03:33+05:30', 1, 'db0698220ee04c159ca44d149b4cd55d');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (34, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3Mzk4NTA5MCwiaWF0IjoxNzczODk4NjkwLCJqdGkiOiJkNDAyOGM3NzgzMmY0YTlkYWZkNjczZDlhZWMzYzA1MiIsInVzZXJfaWQiOjR9.01bl9zGFJxgENpNyGeI5bfKyfxUD2Jcme5GWEA6JWCk', '2026-03-19 11:08:10.522419+05:30', '2026-03-20 11:08:10+05:30', 4, 'd4028c77832f4a9dafd673d9aec3c052');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (35, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3Mzk4NTI2OSwiaWF0IjoxNzczODk4ODY5LCJqdGkiOiI2YzE4OTM3ODI1ODM0NzY0OGE0MWRiZjRkMmUzMjhmNyIsInVzZXJfaWQiOjR9.nYj_iQb2KSMuH2Xf5Z6RZKjy-gMEZyutBWWIQRVLdko', '2026-03-19 11:11:09.169121+05:30', '2026-03-20 11:11:09+05:30', 4, '6c189378258347648a41dbf4d2e328f7');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (36, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3Mzk4NTMwNCwiaWF0IjoxNzczODk4OTA0LCJqdGkiOiJiNzZhZDhjNTNlMmQ0ODU0YWY1NmRlOGJhMzA5MmJmMyIsInVzZXJfaWQiOjR9.4gOaEj_C5Cyon9uE93gkgSrP54urplPR7Ce1pXzJcns', '2026-03-19 11:11:44.257044+05:30', '2026-03-20 11:11:44+05:30', 4, 'b76ad8c53e2d4854af56de8ba3092bf3');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (37, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3Mzk4NTMxOSwiaWF0IjoxNzczODk4OTE5LCJqdGkiOiI5YzU3ODFjYzJjMjA0ZmQ1YWYxMTYwMzQzNTljMjVjYyIsInVzZXJfaWQiOjR9.7DzLgu8cJiiq9IdQxnekbxqKiM6qLryltTV93NfZUmc', '2026-03-19 11:11:59.560068+05:30', '2026-03-20 11:11:59+05:30', 4, '9c5781cc2c204fd5af116034359c25cc');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (38, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3Mzk4NTQ1MiwiaWF0IjoxNzczODk5MDUyLCJqdGkiOiIxMjhjMTY2OTI2Zjg0Mzk1ODg2NzJjOTYwMWVkMDgyYiIsInVzZXJfaWQiOjR9.7GTaLHtEQ1FBCFRiv6q5vfS0H3F4L3vFatMFw3P5-co', '2026-03-19 11:14:12.034752+05:30', '2026-03-20 11:14:12+05:30', 4, '128c166926f8439588672c9601ed082b');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (39, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3Mzk4NTUxNSwiaWF0IjoxNzczODk5MTE1LCJqdGkiOiI3MWExYzk1ODdhYjA0M2NmYmU3N2VmYTAxNzRlMjlkMSIsInVzZXJfaWQiOjJ9.jbnx1VnTkS8xHE09Tn86FfQjUdaF2qAkpF7VSMYpIHU', '2026-03-19 11:15:15.63241+05:30', '2026-03-20 11:15:15+05:30', 2, '71a1c9587ab043cfbe77efa0174e29d1');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (40, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3Mzk4NTY3NCwiaWF0IjoxNzczODk5Mjc0LCJqdGkiOiI1ZTZhZTdlOTM0ZGY0NDU1YTk0MmU0MjE2NjFjNTIzZSIsInVzZXJfaWQiOjF9.9KEF1d4Il82lO_663W2uX1LL6WYWk5TsqRoWy8JS8fc', '2026-03-19 11:17:54.581517+05:30', '2026-03-20 11:17:54+05:30', 1, '5e6ae7e934df4455a942e421661c523e');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (41, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3Mzk4NjI4NiwiaWF0IjoxNzczODk5ODg2LCJqdGkiOiI2YzJhODA5N2NmNzM0Y2I2OWRlN2IzMjQzODYzNDFiMyIsInVzZXJfaWQiOjJ9.QVST79vCCgqnNSP_VlI4HrJX1sKbfZlQuojHe0OlFUE', '2026-03-19 11:28:06.098745+05:30', '2026-03-20 11:28:06+05:30', 2, '6c2a8097cf734cb69de7b324386341b3');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (42, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3Mzk4ODgzNSwiaWF0IjoxNzczOTAyNDM1LCJqdGkiOiIxZjAwY2VhMmUyOTY0ODUyOGU4ZTczYTJkMGE3MTVhZCIsInVzZXJfaWQiOjF9.UN2PP838AU-J3KjsgZUtUQrxU6Agy1DIWPT8tPBiQys', '2026-03-19 12:10:35.814978+05:30', '2026-03-20 12:10:35+05:30', 1, '1f00cea2e29648528e8e73a2d0a715ad');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (43, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3Mzk5MjA4MywiaWF0IjoxNzczOTA1NjgzLCJqdGkiOiI3NmJlNjVlNzNmOTk0OTk4YjZjZTZjNjJjMTE4ZjIzNSIsInVzZXJfaWQiOjJ9.brgTqb8RShjL_QnkcBqp2ykjzlzqs5eVLzc7EuPAtmw', '2026-03-19 13:04:43.777253+05:30', '2026-03-20 13:04:43+05:30', 2, '76be65e73f994998b6ce6c62c118f235');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (44, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3Mzk5MjEyMiwiaWF0IjoxNzczOTA1NzIyLCJqdGkiOiI1ZTAzNzYzYjNhYjE0M2ZiYjY4NDMxNTUxYTVkZmViOSIsInVzZXJfaWQiOjF9.FAz-kyWTk8CF6660rOzK7h0FwNlcSEOkd72wZzhkswg', '2026-03-19 13:05:22.448738+05:30', '2026-03-20 13:05:22+05:30', 1, '5e03763b3ab143fbb68431551a5dfeb9');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (45, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3Mzk5MjQxMSwiaWF0IjoxNzczOTA2MDExLCJqdGkiOiI0ZDU1MWZhMjc2ZTA0MzRlOTkwOGQwYWNjODVjNmUzYSIsInVzZXJfaWQiOjF9.5qjGgETlcwv5dhA12fsAI5jTWYLQ1pPvIoNmpeDiT8E', '2026-03-19 13:10:11.907571+05:30', '2026-03-20 13:10:11+05:30', 1, '4d551fa276e0434e9908d0acc85c6e3a');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (46, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3Mzk5MjUwOCwiaWF0IjoxNzczOTA2MTA4LCJqdGkiOiIxN2ViYTM3NDM2NWQ0MDYwYWVlNWY4ODY5M2VlYjk1NSIsInVzZXJfaWQiOjF9.aZIdWgz8EU46TEIb3fK4MYq_WUWV1PsNcP0rpM5J14k', '2026-03-19 13:11:48.672237+05:30', '2026-03-20 13:11:48+05:30', 1, '17eba374365d4060aee5f88693eeb955');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (47, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3Mzk5NjMzMiwiaWF0IjoxNzczOTA5OTMyLCJqdGkiOiIyYTFjMjNhYmIwZjU0OTdmYTVjYWExNGUwNTM4NTA3NiIsInVzZXJfaWQiOjF9.x4ckU7bFnL7tj7ZAru_LK6JaY00pv395IahJo9s2H2Q', '2026-03-19 14:15:32.679024+05:30', '2026-03-20 14:15:32+05:30', 1, '2a1c23abb0f5497fa5caa14e05385076');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (48, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDAwMDMwNiwiaWF0IjoxNzczOTEzOTA2LCJqdGkiOiI3YWU2OGJkZjQ5NzM0NTQyOGM4NGExOTFiZjQyNjQxYSIsInVzZXJfaWQiOjF9.YmpgLks8trA_9Ow734F_rCJty4NSoyBcfUzz00W_kEo', '2026-03-19 15:21:46.821447+05:30', '2026-03-20 15:21:46+05:30', 1, '7ae68bdf497345428c84a191bf42641a');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (49, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDAwNjkyNywiaWF0IjoxNzczOTIwNTI3LCJqdGkiOiI2M2M4NTRiZWIwNGM0OWQ1OTkyMGM0ZDAxOGE4ODE2OCIsInVzZXJfaWQiOjJ9.at9tJVhnBGrah-9CrPhLZ_NcaCGIeTrHZ4wxMWnBqZA', '2026-03-19 17:12:07.381324+05:30', '2026-03-20 17:12:07+05:30', 2, '63c854beb04c49d59920c4d018a88168');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (50, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDAwNzE1NSwiaWF0IjoxNzczOTIwNzU1LCJqdGkiOiJlOTY1MWUxMDI3MmM0NzNmYmM5NTkyZWJlNGEwMjMzNCIsInVzZXJfaWQiOjR9.Mi8Dp1_RjUpKbb58qBfOinAZOKEuIT5SVr09Av9OXLc', '2026-03-19 17:15:55.661562+05:30', '2026-03-20 17:15:55+05:30', 4, 'e9651e10272c473fbc9592ebe4a02334');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (51, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDAwNzQ0NSwiaWF0IjoxNzczOTIxMDQ1LCJqdGkiOiJiYmRiM2NlOTUzZTc0YTAxYmVkOGI4NDE0NDdiMDFkMyIsInVzZXJfaWQiOjR9.aczIAexM8NzI2ZYrxWa7xB2_0MXQS86IIaOYsmWIuAE', '2026-03-19 17:20:45.561418+05:30', '2026-03-20 17:20:45+05:30', 4, 'bbdb3ce953e74a01bed8b841447b01d3');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (52, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDAwNzUxNSwiaWF0IjoxNzczOTIxMTE1LCJqdGkiOiI0YTg5YTk4OTk3YjU0MTM5YjkzZWEwZjcwNmVkYTdkNiIsInVzZXJfaWQiOjF9.ukmMOd9sDOwUswcjhVFh0TQp75LjTkkrKGYys-iCu2Q', '2026-03-19 17:21:55.988364+05:30', '2026-03-20 17:21:55+05:30', 1, '4a89a98997b54139b93ea0f706eda7d6');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (53, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDAyNDU0OSwiaWF0IjoxNzczOTM4MTQ5LCJqdGkiOiI5NGU4YTdhZjliZmM0ZmExYjc0NGRjM2ZkMzllY2Q2NiIsInVzZXJfaWQiOjF9.qkli7DM2i45YWwJR8M5D_z8txwDq48JBbpNdGD8Pz1E', '2026-03-19 22:05:49.80429+05:30', '2026-03-20 22:05:49+05:30', 1, '94e8a7af9bfc4fa1b744dc3fd39ecd66');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (54, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDAyNDU2OSwiaWF0IjoxNzczOTM4MTY5LCJqdGkiOiI2YmYzNmEyMWEyODE0ZTY1YmJkY2I0YzEyM2Q5YTZmYiIsInVzZXJfaWQiOjR9.1A36yHDzU0M599NY8aykYPvsjxdhf4i4M1_FAKS6tCY', '2026-03-19 22:06:09.878666+05:30', '2026-03-20 22:06:09+05:30', 4, '6bf36a21a2814e65bbdcb4c123d9a6fb');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (55, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDAyNTAyMSwiaWF0IjoxNzczOTM4NjIxLCJqdGkiOiI4N2MyMDhkYWFkNjk0YjRkOWVmYzc0YzI0NjUyNTgzMyIsInVzZXJfaWQiOjF9.MvUIYmFEY4ybCW5xeMDnI8sWqQNcUqhH9-ssTsavNNY', '2026-03-19 22:13:41.729363+05:30', '2026-03-20 22:13:41+05:30', 1, '87c208daad694b4d9efc74c246525833');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (56, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDAyNTAzNiwiaWF0IjoxNzczOTM4NjM2LCJqdGkiOiI2ZjU1NTdiYWYwZDQ0YzI3ODc3M2Q4NzkzMDFjNDMzNCIsInVzZXJfaWQiOjJ9.Viv-h24b0jULSw6l9_CVFhN2HPzWWy8GLUphHM8pUhY', '2026-03-19 22:13:56.887177+05:30', '2026-03-20 22:13:56+05:30', 2, '6f5557baf0d44c278773d879301c4334');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (57, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDAyNjAwMCwiaWF0IjoxNzczOTM5NjAwLCJqdGkiOiIyMGI5NTc1ZDhlNDA0ZGQ0YjlhZjU5YmUwOTViZGFiZiIsInVzZXJfaWQiOjJ9.lHzBRcu0BchVdFKhZk9FddTKV30GAK4PGdfDan-ISa4', '2026-03-19 22:30:00.29263+05:30', '2026-03-20 22:30:00+05:30', 2, '20b9575d8e404dd4b9af59be095bdabf');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (58, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDAyNjM5NiwiaWF0IjoxNzczOTM5OTk2LCJqdGkiOiJmMWQyNWVkMTdlOWY0MzIwOTNiNjBmZDE1MGM4MWJhMSIsInVzZXJfaWQiOjJ9.GJ9CJnT5lLMX0jHFf6iCaJCKBkFtsUKsMlyrtF9XyaM', '2026-03-19 22:36:36.449476+05:30', '2026-03-20 22:36:36+05:30', 2, 'f1d25ed17e9f432093b60fd150c81ba1');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (59, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDA1NzY3MSwiaWF0IjoxNzczOTcxMjcxLCJqdGkiOiJlN2FhOWM0N2E1NGM0NWEzYjkwZDU3NDE3MmI5ZjJhYiIsInVzZXJfaWQiOjJ9.bV6yUxDfzT41NybD7TKC84jyVdKqHQmEuveR46O3JYI', '2026-03-20 07:17:51.15541+05:30', '2026-03-21 07:17:51+05:30', 2, 'e7aa9c47a54c45a3b90d574172b9f2ab');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (60, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDA2NzkyMywiaWF0IjoxNzczOTgxNTIzLCJqdGkiOiI4YmM0ZTA3YWM5NzI0ZjY4YmIwYjhhYmE0NWNiMDEwYSIsInVzZXJfaWQiOjJ9.uD9VqgQJGpG4cHUpzdjfzOtCMsVpUBKAsHsys-Ulabc', '2026-03-20 10:08:43.189724+05:30', '2026-03-21 10:08:43+05:30', 2, '8bc4e07ac9724f68bb0b8aba45cb010a');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (61, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDA2ODM1NiwiaWF0IjoxNzczOTgxOTU2LCJqdGkiOiIyMDg1MjJhY2E4YzE0YzEyODZmNzQ4ZmU4ODdhNTdjMiIsInVzZXJfaWQiOjJ9.FP_vG3Pkx3U6uz4EuuL2pNUfFlB2ynXZuLFfwvHEdlo', '2026-03-20 10:15:56.140799+05:30', '2026-03-21 10:15:56+05:30', 2, '208522aca8c14c1286f748fe887a57c2');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (62, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDA3MTI3NCwiaWF0IjoxNzczOTg0ODc0LCJqdGkiOiI5ZDk1OGZiYjkxZmM0ZDM2YmMwY2Q5ZGVjZWNkNzZkYyIsInVzZXJfaWQiOjJ9.jPWiOpqw-MbT6Lwh9zUvDY1psZ-3Q3ifWkV27S4GFZ4', '2026-03-20 11:04:34.430271+05:30', '2026-03-21 11:04:34+05:30', 2, '9d958fbb91fc4d36bc0cd9dececd76dc');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (63, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDA3NDY1OSwiaWF0IjoxNzczOTg4MjU5LCJqdGkiOiI3MGIyZTA3MWQ4Zjk0MGU3YTk0YjZiZjhlMjgyMjUyOSIsInVzZXJfaWQiOjR9.Q4FII36EUCn8SmbQn_SJwX6M_3IR1Cu_gCv7JsHz_n0', '2026-03-20 12:00:59.994827+05:30', '2026-03-21 12:00:59+05:30', 4, '70b2e071d8f940e7a94b6bf8e2822529');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (64, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDA3NTc4NywiaWF0IjoxNzczOTg5Mzg3LCJqdGkiOiJjMjI0ZDM3YWM5ZDY0MmEzOWI3NzU4NDhmMGNmMTE0YyIsInVzZXJfaWQiOjJ9.u4V45IjhlYsppC_tmZd848rydiFQodTfPZ4AoAlj--w', '2026-03-20 12:19:47.7065+05:30', '2026-03-21 12:19:47+05:30', 2, 'c224d37ac9d642a39b775848f0cf114c');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (65, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDA3NjMzMiwiaWF0IjoxNzczOTg5OTMyLCJqdGkiOiIxMThiZjU3NDU3ZjM0MjM5OTU2ZjBjZTk2OGY5OTAwZCIsInVzZXJfaWQiOjJ9.fMQv7jd8Zu54ZL0Q_z2fVjZl1f3LXFilItPjAwU-Bsw', '2026-03-20 12:28:52.307556+05:30', '2026-03-21 12:28:52+05:30', 2, '118bf57457f34239956f0ce968f9900d');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (66, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDA4MjUzNywiaWF0IjoxNzczOTk2MTM3LCJqdGkiOiJlZDg0NjFkYzY1NzE0MDFhYjFlY2Q0ODc5YWJkMWNiZiIsInVzZXJfaWQiOjJ9.A-rneabZRoUFLd9BHoYQ1O9kKMBIUBo6Nl0uRkr518k', '2026-03-20 14:12:17.696573+05:30', '2026-03-21 14:12:17+05:30', 2, 'ed8461dc6571401ab1ecd4879abd1cbf');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (67, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDA4MjY5MSwiaWF0IjoxNzczOTk2MjkxLCJqdGkiOiI3OTNmNTVkOTRhNGE0YzVlODBiZDkzNzJiZDBhNDNhZSIsInVzZXJfaWQiOjJ9.kiM8e85nGNRLzDURu_H9HzD9O6s8bd0QhKHYPOeAED4', '2026-03-20 14:14:51.163144+05:30', '2026-03-21 14:14:51+05:30', 2, '793f55d94a4a4c5e80bd9372bd0a43ae');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (68, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDA5ODk5NSwiaWF0IjoxNzc0MDEyNTk1LCJqdGkiOiJkNWQ4MzJhZjc3MDM0ZDViODY1OGFhYWM5ZjhmNmZhMyIsInVzZXJfaWQiOjJ9.hYCxcMdRQnXrg-iq8Ak4Rr1TO1FZehrKqOHxrrWT9yU', '2026-03-20 18:46:35.2237+05:30', '2026-03-21 18:46:35+05:30', 2, 'd5d832af77034d5b8658aaac9f8f6fa3');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (69, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDA5OTQxNSwiaWF0IjoxNzc0MDEzMDE1LCJqdGkiOiJiMmE5ZWQ5ZmFlZTk0YzY1OGI0ZThlMTE3NzgyYzdhYyIsInVzZXJfaWQiOjR9.FeYZ8c8XUboRpzLOY1KjH4ZT70wcULLGfjQZPIYnvvE', '2026-03-20 18:53:35.206987+05:30', '2026-03-21 18:53:35+05:30', 4, 'b2a9ed9faee94c658b4e8e117782c7ac');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (70, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDA5OTQ3MSwiaWF0IjoxNzc0MDEzMDcxLCJqdGkiOiJiNTQ2MzhhNTI1MmM0ZjcyYjc0OWI1ZDEzN2ZhMWQwNCIsInVzZXJfaWQiOjJ9.p2KdJE1lm8p_cnppgPMfkBr9VONlFju_fF3zu3dGUFM', '2026-03-20 18:54:31.485828+05:30', '2026-03-21 18:54:31+05:30', 2, 'b54638a5252c4f72b749b5d137fa1d04');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (71, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDA5OTc4MiwiaWF0IjoxNzc0MDEzMzgyLCJqdGkiOiI2NjRmODQ2ZDc4NDc0ODBjYmM1MGM1MTdiZDIxOWJiNSIsInVzZXJfaWQiOjR9.oSVCGCCuH7cSzEkQZrTt4OR8cKePWVq0V9BGoj4Zp0Y', '2026-03-20 18:59:42.40043+05:30', '2026-03-21 18:59:42+05:30', 4, '664f846d7847480cbc50c517bd219bb5');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (72, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDEwMTE3NywiaWF0IjoxNzc0MDE0Nzc3LCJqdGkiOiI1N2ZlNmViNzZhOTk0ZDJiYjgxMzRiMjVhMTI4ZmI2MyIsInVzZXJfaWQiOjJ9.69nheIoGQYSmyLa4_1Zdnt_ycNZUtlFYVl2T4H23Y4w', '2026-03-20 19:22:57.031845+05:30', '2026-03-21 19:22:57+05:30', 2, '57fe6eb76a994d2bb8134b25a128fb63');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (73, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDEwMTE4NCwiaWF0IjoxNzc0MDE0Nzg0LCJqdGkiOiJhYmQ3OWMzNjc1Y2M0OTljODRmOGRmYjJjZmRmZWFiNCIsInVzZXJfaWQiOjF9.ijPCQK-qRTOQtsJ2WFDqEvGt8TUlOzSV2BkaHCjDHOw', '2026-03-20 19:23:04.622974+05:30', '2026-03-21 19:23:04+05:30', 1, 'abd79c3675cc499c84f8dfb2cfdfeab4');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (74, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDEwMTc1NywiaWF0IjoxNzc0MDE1MzU3LCJqdGkiOiI1ZTY1ZmE4M2Y1NzQ0M2VkYTMzODY3ZjRjMzQyZDhmNiIsInVzZXJfaWQiOjF9.K0zQuZ3EMydJS81mk9hFvvEOrfGntgv8tfKULB8yY90', '2026-03-20 19:32:37.461584+05:30', '2026-03-21 19:32:37+05:30', 1, '5e65fa83f57443eda33867f4c342d8f6');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (75, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDEwNzczOSwiaWF0IjoxNzc0MDIxMzM5LCJqdGkiOiIyMDQ3NTMyYWU0M2Y0ODgwYTM3OGIyNWQ0ODRjZWEzNyIsInVzZXJfaWQiOjF9.bDCIXhu0C-8K2hBbkSqLR8p1GQ5wja3dk1_5iOuFUCM', '2026-03-20 21:12:19.626093+05:30', '2026-03-21 21:12:19+05:30', 1, '2047532ae43f4880a378b25d484cea37');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (76, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDEwNzk4OCwiaWF0IjoxNzc0MDIxNTg4LCJqdGkiOiJjNWQ4ZmIyNGYyMTQ0ZmQ5OWNmMTkwZDYwYjNjZDQxOCIsInVzZXJfaWQiOjR9.E8ngBMtfDbjdxnd8MPE9RfEOzH1IdqA1yCQGXsE-9b8', '2026-03-20 21:16:28.111027+05:30', '2026-03-21 21:16:28+05:30', 4, 'c5d8fb24f2144fd99cf190d60b3cd418');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (77, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDEwODA1MCwiaWF0IjoxNzc0MDIxNjUwLCJqdGkiOiJmNzgzNjA0OTM0ZDM0NjQ3OWQ1ZmRhYzUxZGZmMzhlMyIsInVzZXJfaWQiOjF9.APj3QY-SHIywuMQ6N_jye6shYiZNvB7vQvoEYCADARY', '2026-03-20 21:17:30.231297+05:30', '2026-03-21 21:17:30+05:30', 1, 'f783604934d346479d5fdac51dff38e3');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (78, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDEwODA2OSwiaWF0IjoxNzc0MDIxNjY5LCJqdGkiOiJkNzg3MGNhZTIzZmQ0MzI2YTJjOTBjZjA4ZjkwNDc4OSIsInVzZXJfaWQiOjR9.GGpj7k0T-xmqKWWc1eAGZnStlUu39so-JzHuCBVWbZA', '2026-03-20 21:17:49.667039+05:30', '2026-03-21 21:17:49+05:30', 4, 'd7870cae23fd4326a2c90cf08f904789');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (79, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDEwOTE4OCwiaWF0IjoxNzc0MDIyNzg4LCJqdGkiOiI4MmUyMWZjMmJjYjI0YmVlYmMyZDNhOWVmMjIyZGIwOSIsInVzZXJfaWQiOjR9.zgJBjED6gknVyPTrMSFMpCMSth2NJZbabTQPvAXeAkE', '2026-03-20 21:36:28.785344+05:30', '2026-03-21 21:36:28+05:30', 4, '82e21fc2bcb24beebc2d3a9ef222db09');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (80, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDEwOTI5NCwiaWF0IjoxNzc0MDIyODk0LCJqdGkiOiJlMWFmZmMwMDAyNzU0MjZkYWQxYjQ4NjBlNjMyYWNiYSIsInVzZXJfaWQiOjR9.t-rcVipaePnGLxAjBaY5sWMTUw0cM2lwLrJlO2ILxzw', '2026-03-20 21:38:14.262454+05:30', '2026-03-21 21:38:14+05:30', 4, 'e1affc000275426dad1b4860e632acba');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (81, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE0NDE3MywiaWF0IjoxNzc0MDU3NzczLCJqdGkiOiJkM2FhNzMyOTZkMzg0ODVhYjhhNjg5MDUwNjI4YmZjMSIsInVzZXJfaWQiOjF9.w1OqQKNjCb7S_eJrmupFX9ERAgSO115woMQ4XKLiWLY', '2026-03-21 07:19:33.82954+05:30', '2026-03-22 07:19:33+05:30', 1, 'd3aa73296d38485ab8a689050628bfc1');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (82, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE0NTA0NywiaWF0IjoxNzc0MDU4NjQ3LCJqdGkiOiI5ZDhlYWQ1ZGJlYmU0MDE1OTJmMGZiOTUwY2YzNTMwOCIsInVzZXJfaWQiOjF9.4dz_oGjw8LYDsC2bu3ayiEbH4s1-EmjLoR_Vpj5ajMI', '2026-03-21 07:34:07.34901+05:30', '2026-03-22 07:34:07+05:30', 1, '9d8ead5dbebe401592f0fb950cf35308');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (83, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE1Mjc0NywiaWF0IjoxNzc0MDY2MzQ3LCJqdGkiOiI5ODA4NDA1MmE3ZmQ0YmIzOTliYzQ3MjdhN2I0Zjg3ZiIsInVzZXJfaWQiOjF9.GBu7vNEsmugy3ZBRZlxoD3apRGR3ub9Lfb0HFtvrgWc', '2026-03-21 09:42:27.108925+05:30', '2026-03-22 09:42:27+05:30', 1, '98084052a7fd4bb399bc4727a7b4f87f');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (84, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE1NDI2MiwiaWF0IjoxNzc0MDY3ODYyLCJqdGkiOiIyYTkwNTVhYzY1MWI0NDIzYjJiYWNmNTMxN2MxZGU3OCIsInVzZXJfaWQiOjF9.NJ9ChYcu-oM1iytSnfXvuXBJ3EsaPRQMH_XEHJTNFgQ', '2026-03-21 10:07:42.034545+05:30', '2026-03-22 10:07:42+05:30', 1, '2a9055ac651b4423b2bacf5317c1de78');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (85, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE1ODIxOSwiaWF0IjoxNzc0MDcxODE5LCJqdGkiOiIwN2VhMGU3NjMzYmI0N2RiYjA5ZWM1MjlmY2M5OTQ2NiIsInVzZXJfaWQiOjF9.kGweHOzZGCHwUVzSH4hQCe4XEy_y2cpubI1LwnI1Ahc', '2026-03-21 11:13:39.874741+05:30', '2026-03-22 11:13:39+05:30', 1, '07ea0e7633bb47dbb09ec529fcc99466');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (86, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE2MDIyNSwiaWF0IjoxNzc0MDczODI1LCJqdGkiOiIwZTc4Zjk0ZjNmMGI0MDA1OGUxZjU1MzU2YjAxOWMyNiIsInVzZXJfaWQiOjF9.fCFpofFoievyIyXcqjSCf9ykIJk7KFrXHqNTdcsS1b4', '2026-03-21 11:47:05.434398+05:30', '2026-03-22 11:47:05+05:30', 1, '0e78f94f3f0b40058e1f55356b019c26');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (87, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE2MDMzNywiaWF0IjoxNzc0MDczOTM3LCJqdGkiOiJkM2UxMDA3OTFkMGY0ZDE4OTZjMTliM2M3ODk1YTFkYyIsInVzZXJfaWQiOjR9.HaO14OrTtyRD_nyMQuURVcSuUziv_5lojfEF93BVBAw', '2026-03-21 11:48:57.252999+05:30', '2026-03-22 11:48:57+05:30', 4, 'd3e100791d0f4d1896c19b3c7895a1dc');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (88, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE2MjA0NiwiaWF0IjoxNzc0MDc1NjQ2LCJqdGkiOiIyOGUzNjFhNmZlNWM0ZDExOTRkYWY3ZTYwYzQ4YWE3OCIsInVzZXJfaWQiOjJ9.WmB-vweRll7ckd-Uii5lsUJ9WJbN4L_eEXaN7rnYX68', '2026-03-21 12:17:26.678595+05:30', '2026-03-22 12:17:26+05:30', 2, '28e361a6fe5c4d1194daf7e60c48aa78');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (89, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE2MjE2MSwiaWF0IjoxNzc0MDc1NzYxLCJqdGkiOiIyOTMyNDdjOTdkMDM0MGVhODk3ODBiYWVkNjhlM2ExMSIsInVzZXJfaWQiOjV9.tV4rFe4ZTdw3kLVZVGgeyxpz5xCr8hNntDwwqBBAk60', '2026-03-21 12:19:21.988665+05:30', '2026-03-22 12:19:21+05:30', 5, '293247c97d0340ea89780baed68e3a11');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (90, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE2MjE2NCwiaWF0IjoxNzc0MDc1NzY0LCJqdGkiOiI0M2E2MjMwYWI0NWE0MDlkYjExMDQxMTNlNzIyZDgwOSIsInVzZXJfaWQiOjV9.KTgbjEyxi_m-_elQY8cXqTaDPH4_5_BnhfOuCFDPboY', '2026-03-21 12:19:24.465002+05:30', '2026-03-22 12:19:24+05:30', 5, '43a6230ab45a409db1104113e722d809');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (91, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE2MjE5MiwiaWF0IjoxNzc0MDc1NzkyLCJqdGkiOiI4NTU4MjZmYTc2ZjQ0MzEwOTQ3N2VjNTM2MWMzM2JiZiIsInVzZXJfaWQiOjR9.ACRleSPzGWFRIMbGuFmbECokoQIcKofGQ2kui7iCXUQ', '2026-03-21 12:19:52.443333+05:30', '2026-03-22 12:19:52+05:30', 4, '855826fa76f443109477ec5361c33bbf');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (92, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE2MjIwMSwiaWF0IjoxNzc0MDc1ODAxLCJqdGkiOiI2MDY0MGFkMGYzZDI0ODA3OWJlMDcyOTg4MGFjNDEzZSIsInVzZXJfaWQiOjF9.dsDqBIkXKCxnxv6GWbUlK_r2UE0VKNUPdOZAiyWgKJw', '2026-03-21 12:20:01.055736+05:30', '2026-03-22 12:20:01+05:30', 1, '60640ad0f3d248079be0729880ac413e');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (93, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE2MzQwOCwiaWF0IjoxNzc0MDc3MDA4LCJqdGkiOiIyNWMyZWQ5NWU0MGQ0NmViYmIyMjY2ZmRjMzk1OTIwOCIsInVzZXJfaWQiOjV9.ZNkFcNbhPhu7bBW_wh-9JkXjdIn2k4-C9rFdbo1ggzI', '2026-03-21 12:40:08.54307+05:30', '2026-03-22 12:40:08+05:30', 5, '25c2ed95e40d46ebbb2266fdc3959208');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (94, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE2MzQ3MiwiaWF0IjoxNzc0MDc3MDcyLCJqdGkiOiI3YmUyZGIzN2I4ZjQ0NmFlYmJmNDkwZWM0OWM1N2EwNCIsInVzZXJfaWQiOjR9.f1HL5xpWK9vusdE_em9WBGMiBtZSOtVAVdvPIp85r_Y', '2026-03-21 12:41:12.790644+05:30', '2026-03-22 12:41:12+05:30', 4, '7be2db37b8f446aebbf490ec49c57a04');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (95, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE2MzU3NiwiaWF0IjoxNzc0MDc3MTc2LCJqdGkiOiJmYjZiMjhjYjU4YzI0NWUyOGMxYjE5MzU5NjE3MGY0ZiIsInVzZXJfaWQiOjF9.yRN8-056Eqq8TL3VAFipYH6CPshjI5bQYdoGyZXeA2k', '2026-03-21 12:42:56.452617+05:30', '2026-03-22 12:42:56+05:30', 1, 'fb6b28cb58c245e28c1b193596170f4f');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (96, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE2MzYxMiwiaWF0IjoxNzc0MDc3MjEyLCJqdGkiOiI2NDEyYzhkZWJmNDc0YmU0OTFmZWVmZmYyMjYzYmM0YSIsInVzZXJfaWQiOjR9.SyE5niSGiuPH0xo3PvSf5aPHtrULuBVAU_eGbDFiI_c', '2026-03-21 12:43:32.959081+05:30', '2026-03-22 12:43:32+05:30', 4, '6412c8debf474be491feefff2263bc4a');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (97, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE2NDA1NSwiaWF0IjoxNzc0MDc3NjU1LCJqdGkiOiJmOTJkODcxOTNmMGI0NGE5ODI3NzcxYzViMTE4MzBlNCIsInVzZXJfaWQiOjF9.YSr6J0YJSaszcq096Xh9W589BK9Mh-Vn4HPmTS8p0Ls', '2026-03-21 12:50:55.46798+05:30', '2026-03-22 12:50:55+05:30', 1, 'f92d87193f0b44a9827771c5b11830e4');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (98, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE2NDA2OSwiaWF0IjoxNzc0MDc3NjY5LCJqdGkiOiI2ZTQzMGI0Y2VjZGY0OGMzOGEzYmJiNWVhNzM1NjA2MSIsInVzZXJfaWQiOjR9.WXny9jB0645Pfi2STNoYMGtoW-CGUabAk3OMWJXiYBQ', '2026-03-21 12:51:09.55957+05:30', '2026-03-22 12:51:09+05:30', 4, '6e430b4cecdf48c38a3bbb5ea7356061');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (99, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE2NDgxOCwiaWF0IjoxNzc0MDc4NDE4LCJqdGkiOiJhNGZlNmE2NTgyY2Q0YTM0YmU3NGVhNWNjMzllNWJkNSIsInVzZXJfaWQiOjV9.kTkl9NFq8z9k61l7yQegGuNr5q-7NX3fEJnV35aGRxk', '2026-03-21 13:03:38.814582+05:30', '2026-03-22 13:03:38+05:30', 5, 'a4fe6a6582cd4a34be74ea5cc39e5bd5');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (100, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE2NDg2MCwiaWF0IjoxNzc0MDc4NDYwLCJqdGkiOiI1Y2Y2ZTQyYjEwZjM0YmNlODE2NzAyMGRlOGY1Mjg4NiIsInVzZXJfaWQiOjR9.dJU1lYlu1a1fFpIkfnX0eTmz4HGh4yKCu4INhUsp2hA', '2026-03-21 13:04:20.051072+05:30', '2026-03-22 13:04:20+05:30', 4, '5cf6e42b10f34bce8167020de8f52886');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (101, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE4MjQzMywiaWF0IjoxNzc0MDk2MDMzLCJqdGkiOiI3MDUyNzIyM2U1ZmM0MzBkOGUxNzFjZWY0ZjdmMWY1NiIsInVzZXJfaWQiOjR9.nhZJ-S7IZDphNKYRXicrmnJK1DqzLO_Oetc2bYj4sqs', '2026-03-21 17:57:13.565163+05:30', '2026-03-22 17:57:13+05:30', 4, '70527223e5fc430d8e171cef4f7f1f56');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (102, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE4MzI0NywiaWF0IjoxNzc0MDk2ODQ3LCJqdGkiOiJkMDRkM2U1ZmE2ZjI0ODJhYWI0NTdjYWY1MWM1YWQ4ZSIsInVzZXJfaWQiOjV9.ZOpH4CuBLpQk21js9RXdjeOiTWijrtc5e6g1mBIk7is', '2026-03-21 18:10:47.882814+05:30', '2026-03-22 18:10:47+05:30', 5, 'd04d3e5fa6f2482aab457caf51c5ad8e');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (103, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE4NTI2MywiaWF0IjoxNzc0MDk4ODYzLCJqdGkiOiIzYmUwZGNjNTAyZWE0MGQxODA4OTg1YWVkNzIzOGQ1NyIsInVzZXJfaWQiOjR9.3cy0LTUjh8GlF6o23VwoeOQbFEcdSyUZroGALeX49uc', '2026-03-21 18:44:23.920619+05:30', '2026-03-22 18:44:23+05:30', 4, '3be0dcc502ea40d1808985aed7238d57');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (104, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE4NTI5MywiaWF0IjoxNzc0MDk4ODkzLCJqdGkiOiI2ZTM0ZDM5MWMwZGI0YTU5OWIwOGVlMDhlZDE3M2EwMSIsInVzZXJfaWQiOjF9.cPIqU0VEhKTgazgnimxoORklbatecVcOZ2VHU86ygCg', '2026-03-21 18:44:53.142184+05:30', '2026-03-22 18:44:53+05:30', 1, '6e34d391c0db4a599b08ee08ed173a01');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (105, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE4NTU0OCwiaWF0IjoxNzc0MDk5MTQ4LCJqdGkiOiI3NjEzYjdiNDg5Y2Q0MTQ4ODI1NTBhOTMzNDEyNjJiNSIsInVzZXJfaWQiOjR9.MurKhmbgPuPNxUoxTei7d-R4lpEK_Hs4ie8mykFt46I', '2026-03-21 18:49:08.988515+05:30', '2026-03-22 18:49:08+05:30', 4, '7613b7b489cd414882550a93341262b5');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (106, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE4NTg2OCwiaWF0IjoxNzc0MDk5NDY4LCJqdGkiOiI5NWY4MTBlM2I2OGU0MzIyOGM5MDdmZDc4NTg0MmYxYiIsInVzZXJfaWQiOjF9.i6Ni2nyCvDXzvcPv3bhxRyYiT-tITI52zWRLJOQ91bI', '2026-03-21 18:54:28.627724+05:30', '2026-03-22 18:54:28+05:30', 1, '95f810e3b68e43228c907fd785842f1b');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (107, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE4NTg3OSwiaWF0IjoxNzc0MDk5NDc5LCJqdGkiOiI1ODAwYWYwOWIwMDY0ZDgwYTQ1ZGM1NGVkMGNlMTY5NyIsInVzZXJfaWQiOjR9.ta0PrQsxe6jHiTkAapH3p7K7dlroOFtm2pcFLOGqfyM', '2026-03-21 18:54:39.617915+05:30', '2026-03-22 18:54:39+05:30', 4, '5800af09b0064d80a45dc54ed0ce1697');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (108, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE4NjIwMywiaWF0IjoxNzc0MDk5ODAzLCJqdGkiOiJkNGQ1ZmI0MjE5ZTQ0M2FhODUyZTlmNzNmZGRiNDExNiIsInVzZXJfaWQiOjV9.pNt0UjAucabt5bFYZQzhRlFkwRPS8aEwGvHn0cklU0E', '2026-03-21 19:00:03.445449+05:30', '2026-03-22 19:00:03+05:30', 5, 'd4d5fb4219e443aa852e9f73fddb4116');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (109, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE4NjIxNSwiaWF0IjoxNzc0MDk5ODE1LCJqdGkiOiJhMGJmYjM3MmY4NTM0MDhhYWQ1NjkzZTg5MzI5NDM0NiIsInVzZXJfaWQiOjR9.LlWpgVDsZSq-Apt5lA8KQuyMtpbSrWuYVYZjdASmHWE', '2026-03-21 19:00:15.860526+05:30', '2026-03-22 19:00:15+05:30', 4, 'a0bfb372f853408aad5693e893294346');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (110, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE4NjYyNiwiaWF0IjoxNzc0MTAwMjI2LCJqdGkiOiI1N2Q0MzEzYTQ5MTE0YWVmYmE4ODkwNDQyNzQ1NTU0OSIsInVzZXJfaWQiOjR9.VchcepVi9Q_0VbE5c8PGaGW0J0JZIWVbvBBFVPt1-xE', '2026-03-21 19:07:06.976727+05:30', '2026-03-22 19:07:06+05:30', 4, '57d4313a49114aefba88904427455549');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (111, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE4Njc1NywiaWF0IjoxNzc0MTAwMzU3LCJqdGkiOiI0YzM5YTNhYjgwNGI0MWU5YmI2ZThjNjJiYzU5MGQ2ZCIsInVzZXJfaWQiOjV9.fE8gtyKQKw7BA3Ez9rc4p05_QPwRCXYGdua44fR2ebk', '2026-03-21 19:09:17.976382+05:30', '2026-03-22 19:09:17+05:30', 5, '4c39a3ab804b41e9bb6e8c62bc590d6d');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (112, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE4Njc5NywiaWF0IjoxNzc0MTAwMzk3LCJqdGkiOiIzNTJjOGZiMjVkNzI0MTkxOTU5NDQwZjY0ZDA5OTgwYyIsInVzZXJfaWQiOjR9.sEs7LAuJredI7hx_6ki8tX5JG8VbTpjwCID-x9YzHeE', '2026-03-21 19:09:57.582904+05:30', '2026-03-22 19:09:57+05:30', 4, '352c8fb25d724191959440f64d09980c');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (113, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE4Njg0MywiaWF0IjoxNzc0MTAwNDQzLCJqdGkiOiI3YmM1NmExZWY2NTE0YTM2ODYxOTg3NWM5OWIyNzFmOCIsInVzZXJfaWQiOjF9.bwXUcSP6ou2bgf2B2aeHHFtfF3XLwpMFCzGOznrQvQA', '2026-03-21 19:10:43.905496+05:30', '2026-03-22 19:10:43+05:30', 1, '7bc56a1ef6514a368619875c99b271f8');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (114, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE4Njg3NSwiaWF0IjoxNzc0MTAwNDc1LCJqdGkiOiIwYTAxYWNiNzc1Mzg0ZmM1OWUzZmRjMjg0OGNjMmIyZCIsInVzZXJfaWQiOjR9.kzYtTf08flvB-pLUN-6g3ZTZhbz4uZraP7zP6_bXFb4', '2026-03-21 19:11:15.086675+05:30', '2026-03-22 19:11:15+05:30', 4, '0a01acb775384fc59e3fdc2848cc2b2d');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (115, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE4NzA3OSwiaWF0IjoxNzc0MTAwNjc5LCJqdGkiOiI2YjQ3YjhlMDgwNTM0ZDE5OTIzZDFjZjNjMTUwY2ZhMiIsInVzZXJfaWQiOjV9.7KW1veb8C7RLqcqjx9vPKz2mouJMzsWy5AE3ay8WKjY', '2026-03-21 19:14:39.222972+05:30', '2026-03-22 19:14:39+05:30', 5, '6b47b8e080534d19923d1cf3c150cfa2');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (116, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE4NzU2MSwiaWF0IjoxNzc0MTAxMTYxLCJqdGkiOiI1MjFiZGNhZjYwOWE0YzlkYmJjY2MyMDhmZjA2ODU1YyIsInVzZXJfaWQiOjR9.trwXUowo1oTh2VK7NlpoNwa8EZeQxHsyl5TRfmxJn5g', '2026-03-21 19:22:41.174923+05:30', '2026-03-22 19:22:41+05:30', 4, '521bdcaf609a4c9dbbccc208ff06855c');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (117, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE4NzYzNiwiaWF0IjoxNzc0MTAxMjM2LCJqdGkiOiJhZWFlZjhmMzcwYjk0NGMxYmRkNTE0ZThkNGZhZDRhZCIsInVzZXJfaWQiOjF9.9z4Q9KYNDNLq3ixo4SberP1FpH0_pj5exwfWL-l1LcY', '2026-03-21 19:23:56.25735+05:30', '2026-03-22 19:23:56+05:30', 1, 'aeaef8f370b944c1bdd514e8d4fad4ad');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (118, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE4NzcwOCwiaWF0IjoxNzc0MTAxMzA4LCJqdGkiOiI0MjhlYzcyNmQ5OWE0ZDQxYWZjOGY0NDM5YTE3ZWUwNSIsInVzZXJfaWQiOjR9.u7nNhvNbZ5MIBx_Exd3K0yjfx0YxkMjjM0CKhYBDDsw', '2026-03-21 19:25:08.974964+05:30', '2026-03-22 19:25:08+05:30', 4, '428ec726d99a4d41afc8f4439a17ee05');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (119, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE4NzcyOCwiaWF0IjoxNzc0MTAxMzI4LCJqdGkiOiJhYmE5ZDRmZmQ3NDI0MmE1ODFkYjZiZmEzOTc2ODA3YyIsInVzZXJfaWQiOjR9.eM--7438AlqPVfGVmAGaECyLiFXLkSxDBBKaIRMklac', '2026-03-21 19:25:28.05945+05:30', '2026-03-22 19:25:28+05:30', 4, 'aba9d4ffd74242a581db6bfa3976807c');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (120, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE4Nzc0OCwiaWF0IjoxNzc0MTAxMzQ4LCJqdGkiOiIzNDBhZDYxZDkwMzA0YWI3ODEyMWVmZDU3YjAwMmZiMCIsInVzZXJfaWQiOjF9.0aXBpplj7ZNcbeNVmAawhx5-9jeaSCZdpTtLfm3QoHw', '2026-03-21 19:25:48.630074+05:30', '2026-03-22 19:25:48+05:30', 1, '340ad61d90304ab78121efd57b002fb0');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (121, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE4NzkzNCwiaWF0IjoxNzc0MTAxNTM0LCJqdGkiOiJlMjY5NzUxMmQ1YzY0YTk3OTdjMjhlNDllNjdkOGNjOSIsInVzZXJfaWQiOjR9.sfxZOWNTA6lwRDdT3O6owBdRR-Zhm6kaIbXUQWNWua0', '2026-03-21 19:28:54.157493+05:30', '2026-03-22 19:28:54+05:30', 4, 'e2697512d5c64a9797c28e49e67d8cc9');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (122, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE4Nzk0NiwiaWF0IjoxNzc0MTAxNTQ2LCJqdGkiOiJhNjhhMzlkZDE4ZDM0NWJmYWU2ZTQwYjkyNjkzODNiZCIsInVzZXJfaWQiOjF9.eriED8mgBwscuJhXvHpuIYPy3N7Y03ytOV7Dl9I0gcg', '2026-03-21 19:29:06.84915+05:30', '2026-03-22 19:29:06+05:30', 1, 'a68a39dd18d345bfae6e40b9269383bd');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (123, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE4ODA4MywiaWF0IjoxNzc0MTAxNjgzLCJqdGkiOiJlZTFhMTRhMjI1MDY0ODNhOTIyMzlkNzc2NTg3MDViYiIsInVzZXJfaWQiOjR9.kbopT13edf3np2BkzP2Oks9N7tOvR8rmRXOIoU4W_lM', '2026-03-21 19:31:23.392589+05:30', '2026-03-22 19:31:23+05:30', 4, 'ee1a14a22506483a92239d77658705bb');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (124, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE4ODQxNiwiaWF0IjoxNzc0MTAyMDE2LCJqdGkiOiJkZDM1Y2IwOWJkYmI0MjhlYjIyMTQ1Y2U2OGQ1MmVkOSIsInVzZXJfaWQiOjV9.pkEouT652QrDlzYCOtWi6t96oDTReryKVwdiQVPImF4', '2026-03-21 19:36:56.36545+05:30', '2026-03-22 19:36:56+05:30', 5, 'dd35cb09bdbb428eb22145ce68d52ed9');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (125, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE4ODQyMiwiaWF0IjoxNzc0MTAyMDIyLCJqdGkiOiIwNjJlOTFiNTlmNGM0N2Q1YTFlOWZhMzY3Nzg1NjY0ZiIsInVzZXJfaWQiOjF9.pX7VNQe2ZP1vKStXOrMy0U17LOVYdaMVO6KDnevj7nk', '2026-03-21 19:37:02.432458+05:30', '2026-03-22 19:37:02+05:30', 1, '062e91b59f4c47d5a1e9fa367785664f');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (126, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE4ODk3OCwiaWF0IjoxNzc0MTAyNTc4LCJqdGkiOiI5NThmZDE4YjJkNDg0MDNmYTM3NzY5NTlmZWE3ZjVmNyIsInVzZXJfaWQiOjV9.L_LZR8mLfyFuAN7XPn4BYHO9NOZEmsqA3uBmKZ-JQNM', '2026-03-21 19:46:18.438255+05:30', '2026-03-22 19:46:18+05:30', 5, '958fd18b2d48403fa3776959fea7f5f7');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (127, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE4OTAzMywiaWF0IjoxNzc0MTAyNjMzLCJqdGkiOiIxMDk4NGJkYzNiNWM0YTg1OGFlZDQ2MDA1YjM2YzVjZCIsInVzZXJfaWQiOjR9.Dmwlon4JfcTP1PtmpRs1FY8TrtAAlT-QUeU-HYeC9BY', '2026-03-21 19:47:13.008082+05:30', '2026-03-22 19:47:13+05:30', 4, '10984bdc3b5c4a858aed46005b36c5cd');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (128, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE4OTIyMCwiaWF0IjoxNzc0MTAyODIwLCJqdGkiOiI2NWUyMTFlZjE4ODc0ZDViYWM0OWYwM2RjMjZkYjg5MyIsInVzZXJfaWQiOjF9.yWON3IRILjaQlcNWDaliLBXVOPW7tqSHlzHmv7ukk4o', '2026-03-21 19:50:20.114538+05:30', '2026-03-22 19:50:20+05:30', 1, '65e211ef18874d5bac49f03dc26db893');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (129, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE5NTU4MywiaWF0IjoxNzc0MTA5MTgzLCJqdGkiOiJlYTM5ODNlNmE2YWE0YzdiYTgwZjZkY2U5NjUzZmMzZiIsInVzZXJfaWQiOjV9.74KunjLgPWhghOvJ_apQFsAkq85Ht7aa3SdvltL7IPM', '2026-03-21 21:36:23.139788+05:30', '2026-03-22 21:36:23+05:30', 5, 'ea3983e6a6aa4c7ba80f6dce9653fc3f');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (130, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE5NTg5NiwiaWF0IjoxNzc0MTA5NDk2LCJqdGkiOiIyOTliNzQ1ZTk5Mjk0OTdjYTY2YmY4ZDMwMDllNGY1YiIsInVzZXJfaWQiOjF9.X-GuAS0ETmdyR0cEO_lCWVeeF9fu7FLECsho7oxPvJo', '2026-03-21 21:41:36.610997+05:30', '2026-03-22 21:41:36+05:30', 1, '299b745e9929497ca66bf8d3009e4f5b');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (131, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE5NTkwMiwiaWF0IjoxNzc0MTA5NTAyLCJqdGkiOiJmOGQ1OTAxMmRlMmU0MzYyYjQ4YjJjZjhlMzMwNTBiMSIsInVzZXJfaWQiOjV9.UU57qbOHOMmwTlN75qCzJAJs7quspsbZexhs4Ff6okw', '2026-03-21 21:41:42.517384+05:30', '2026-03-22 21:41:42+05:30', 5, 'f8d59012de2e4362b48b2cf8e33050b1');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (132, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE5Njk2NywiaWF0IjoxNzc0MTEwNTY3LCJqdGkiOiIwMmZhODBhYmMwMTA0Y2YxOGIzMGY4NGJkN2VjODA2NiIsInVzZXJfaWQiOjR9.lVReBHjiEyXPbhUl8FCsmZ232ueutK2mr8yEOZ2fCs4', '2026-03-21 21:59:27.475282+05:30', '2026-03-22 21:59:27+05:30', 4, '02fa80abc0104cf18b30f84bd7ec8066');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (133, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE5NzY0NywiaWF0IjoxNzc0MTExMjQ3LCJqdGkiOiJjYjhkYjExYmQ3MDA0YTZiYWZmNzMzM2RiZmIxMjY3NiIsInVzZXJfaWQiOjV9.rwRYmqr62RoZ1qJfUimh3kJRPXUxXH89YqbR0d9IAyU', '2026-03-21 22:10:47.230342+05:30', '2026-03-22 22:10:47+05:30', 5, 'cb8db11bd7004a6baff7333dbfb12676');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (134, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE5NzY3MiwiaWF0IjoxNzc0MTExMjcyLCJqdGkiOiI1ODc5ZjliMDFkYWY0YjllYWJkMDQ0YThkZTE2NDg3MCIsInVzZXJfaWQiOjR9.R8Meylm_oXw-FKDfEAZKGlubAEhJcJQUOdlEOUcYPLE', '2026-03-21 22:11:12.587579+05:30', '2026-03-22 22:11:12+05:30', 4, '5879f9b01daf4b9eabd044a8de164870');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (135, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE5Nzc0MywiaWF0IjoxNzc0MTExMzQzLCJqdGkiOiJiZThhNzVmNDRhOTc0MDQ4ODM4MTM5NzkyYzM2MGJhMCIsInVzZXJfaWQiOjF9.d6as_ybGPfTy5sU5_r4cWtxRWmw720F1qCh4pdfBk8k', '2026-03-21 22:12:23.049366+05:30', '2026-03-22 22:12:23+05:30', 1, 'be8a75f44a974048838139792c360ba0');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (136, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE5Nzk2MCwiaWF0IjoxNzc0MTExNTYwLCJqdGkiOiIzODQ1YTg5NGM2MDA0MGZmYTljZjU0MmM3Nzg2Mjc4YiIsInVzZXJfaWQiOjR9.V3t_ayfKYSb9bovprj9sGveIz7wCNRHOJ8pt8vLA5mU', '2026-03-21 22:16:00.407883+05:30', '2026-03-22 22:16:00+05:30', 4, '3845a894c60040ffa9cf542c7786278b');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (137, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE5Nzk2OCwiaWF0IjoxNzc0MTExNTY4LCJqdGkiOiI0NGE2NDY4YTUyNmE0NDI1YjAyYzIzYTJlZTliM2UxZiIsInVzZXJfaWQiOjR9.xF6N2WnV5EOlGKGolcB2Vax8ptSsPznGot38MPMuBV8', '2026-03-21 22:16:08.558487+05:30', '2026-03-22 22:16:08+05:30', 4, '44a6468a526a4425b02c23a2ee9b3e1f');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (138, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE5Nzk3MywiaWF0IjoxNzc0MTExNTczLCJqdGkiOiJkODA5YjJkZGE1YjU0ZDdjOGY3NzJmNTk5ZTdkMWI4MiIsInVzZXJfaWQiOjF9.Z-spkj5aow9itoadNxJHph-IhCNXa_BqmYwHiqqCVDE', '2026-03-21 22:16:13.873939+05:30', '2026-03-22 22:16:13+05:30', 1, 'd809b2dda5b54d7c8f772f599e7d1b82');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (139, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDE5OTA1MCwiaWF0IjoxNzc0MTEyNjUwLCJqdGkiOiIyMmY5ZTY2ZWY2N2U0YjNiOGQ5ZjZiMDcyOGExOGY0NiIsInVzZXJfaWQiOjF9.WbjbJC86bEy_pOrBh4s6wOsFXD2tbMb7S8sN13pAfOE', '2026-03-21 22:34:10.372345+05:30', '2026-03-22 22:34:10+05:30', 1, '22f9e66ef67e4b3b8d9f6b0728a18f46');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (140, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDIwMTk4NSwiaWF0IjoxNzc0MTE1NTg1LCJqdGkiOiJlMjdjNDZkM2UxNDY0YTNkYTIzM2M4NDk3YWRmNjNhNiIsInVzZXJfaWQiOjR9.2w7BCxuoayAaHeLF55Ci9l7YK_fo7Arx1Snau6aAJdI', '2026-03-21 23:23:05.458193+05:30', '2026-03-22 23:23:05+05:30', 4, 'e27c46d3e1464a3da233c8497adf63a6');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (141, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDIwMjQwMywiaWF0IjoxNzc0MTE2MDAzLCJqdGkiOiIxODM5MjE2ZWVjZTg0MmRlOWE4M2ViNWI0ZDQwMDc0OSIsInVzZXJfaWQiOjF9.Ew8kBhgRjwM0jlwmDJldxuGgqW5eBkH3_tlPTVbCEuc', '2026-03-21 23:30:03.674444+05:30', '2026-03-22 23:30:03+05:30', 1, '1839216eece842de9a83eb5b4d400749');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (142, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDIwMjQyOCwiaWF0IjoxNzc0MTE2MDI4LCJqdGkiOiI0MjgwOWVlYjAwMzg0ODgwOTgwZGUwOTMyN2Y2ZmRiNCIsInVzZXJfaWQiOjV9.pXTnoW0yS52i6XuxxECD_THz4ElXIy14HdAktkdhCfY', '2026-03-21 23:30:28.60204+05:30', '2026-03-22 23:30:28+05:30', 5, '42809eeb00384880980de09327f6fdb4');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (143, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDIwMjcwMCwiaWF0IjoxNzc0MTE2MzAwLCJqdGkiOiJmNDg1ZTA1ZDIzNWM0ODZlODJlNDQ0ZTBmNTdlOWZhNyIsInVzZXJfaWQiOjF9.TD6115R9Qn-PwLfFDOhtF5EI6Ly2APcdZUo3b1QjDkU', '2026-03-21 23:35:00.044896+05:30', '2026-03-22 23:35:00+05:30', 1, 'f485e05d235c486e82e444e0f57e9fa7');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (144, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDIwMjc0MCwiaWF0IjoxNzc0MTE2MzQwLCJqdGkiOiI0YmZhMTBkZjQ5OWY0NmVkYWQxNDA4YWVmZGZhOWZiMCIsInVzZXJfaWQiOjR9.Bb9Rb_L9CPfvKx9pOLh1KjAP1w24DHOY4FELlmj149M', '2026-03-21 23:35:40.355028+05:30', '2026-03-22 23:35:40+05:30', 4, '4bfa10df499f46edad1408aefdfa9fb0');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (145, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDIzNTAzMCwiaWF0IjoxNzc0MTQ4NjMwLCJqdGkiOiJkZDE5MTQ2ZmJhNGU0Njc0OTA0MTZlOWM5N2EzNmZlNiIsInVzZXJfaWQiOjV9.31JZBcltkX7dRGOWPjXvQDr8MajHLY8OU2jSfID4taE', '2026-03-22 08:33:50.520452+05:30', '2026-03-23 08:33:50+05:30', 5, 'dd19146fba4e467490416e9c97a36fe6');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (146, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDIzNTA2NywiaWF0IjoxNzc0MTQ4NjY3LCJqdGkiOiJkNDQ0NmI4ZjI4NWI0MDM1OTJmYTU1YTlmZjZhYWUxZiIsInVzZXJfaWQiOjR9.GsvNQz67uKzRCta4cQx8XXgaiD_MrbRmV174NJ6HpNI', '2026-03-22 08:34:27.306746+05:30', '2026-03-23 08:34:27+05:30', 4, 'd4446b8f285b403592fa55a9ff6aae1f');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (147, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDIzNTA5MiwiaWF0IjoxNzc0MTQ4NjkyLCJqdGkiOiI3OGU5ZTRiYmEzNTU0ZjY2OGQxY2NjMDIxMzAyM2RlNSIsInVzZXJfaWQiOjF9.iFehrUtXbYNUaiUHaxblgS2m1uqLm4deUQE2_tBoWSc', '2026-03-22 08:34:52.961593+05:30', '2026-03-23 08:34:52+05:30', 1, '78e9e4bba3554f668d1ccc0213023de5');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (148, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDIzNTE0MywiaWF0IjoxNzc0MTQ4NzQzLCJqdGkiOiIxMTZhMzU0Y2ZjYWE0NmRiOGViZmUzYzcxNWQ5ZDBjZSIsInVzZXJfaWQiOjF9.s7SMPPOrdj_fevLc7_lKdbu7g6KDur176qu5ioPIRQo', '2026-03-22 08:35:43.536448+05:30', '2026-03-23 08:35:43+05:30', 1, '116a354cfcaa46db8ebfe3c715d9d0ce');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (149, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDIzNTE2MCwiaWF0IjoxNzc0MTQ4NzYwLCJqdGkiOiIyOGE3MzMzMGI4ZmM0YzJkODJiZmMwNDFjYzNlZmNhZiIsInVzZXJfaWQiOjV9.waq2CSBav0-6lh9lIEpiO0sXV6adD5jwWilAi6H1MXM', '2026-03-22 08:36:00.104437+05:30', '2026-03-23 08:36:00+05:30', 5, '28a73330b8fc4c2d82bfc041cc3efcaf');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (150, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDIzNTE3MywiaWF0IjoxNzc0MTQ4NzczLCJqdGkiOiJlN2UxOTM5YzQyYjk0NmMzYTBkNmY5MWQ4MjIwNTQ2NCIsInVzZXJfaWQiOjF9.sQR1Y0cV0hz_QWnSbiAi-oj7EwXqKWddXIWUzL3ZTkg', '2026-03-22 08:36:13.556593+05:30', '2026-03-23 08:36:13+05:30', 1, 'e7e1939c42b946c3a0d6f91d82205464');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (151, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDIzNTQyMCwiaWF0IjoxNzc0MTQ5MDIwLCJqdGkiOiJiYmQyZDM5YjYxODI0NzdlODU5MjRiOWJlYzQ2OTI3YiIsInVzZXJfaWQiOjF9.r9oLNXrVOdpltPss0KNFMiua7gueoYvLluoi8aN0VUY', '2026-03-22 08:40:20.626649+05:30', '2026-03-23 08:40:20+05:30', 1, 'bbd2d39b6182477e85924b9bec46927b');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (152, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDI0MDMwOSwiaWF0IjoxNzc0MTUzOTA5LCJqdGkiOiIyOTgwNTRjOTAwOTg0ZjE3YWExMjYxOTdiZWUyNzQwNyIsInVzZXJfaWQiOjF9.k3suBUQYYpflhy1KbxEMzfaH2sWCFBykgI0wfcje1SQ', '2026-03-22 10:01:49.160124+05:30', '2026-03-23 10:01:49+05:30', 1, '298054c900984f17aa126197bee27407');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (153, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDI0MDM0NywiaWF0IjoxNzc0MTUzOTQ3LCJqdGkiOiI4ZmYzMDkzMjZiN2E0YWEyODc0ZjZjODViZjhiZWRiNyIsInVzZXJfaWQiOjV9.YMXzqWd1GMSvJPD8CKrHHVKu0aFRFtZHityPu76FT8I', '2026-03-22 10:02:27.539205+05:30', '2026-03-23 10:02:27+05:30', 5, '8ff309326b7a4aa2874f6c85bf8bedb7');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (154, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDI0MjE2NSwiaWF0IjoxNzc0MTU1NzY1LCJqdGkiOiI3OWU4ZGY0ZmEyYWU0MDU2YWQ1ZjQ2MWFiNmQ5NWMxYyIsInVzZXJfaWQiOjR9.fXqgyANOvVn2HAzuC1AqNf8DhTJBoRpEbX3G8sPMU04', '2026-03-22 10:32:45.626166+05:30', '2026-03-23 10:32:45+05:30', 4, '79e8df4fa2ae4056ad5f461ab6d95c1c');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (155, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDI0MjE4NCwiaWF0IjoxNzc0MTU1Nzg0LCJqdGkiOiIwMmM5MjAyNTBlYmI0MWJmOGYzYTQ3Nzg1ZTM1ZTNiNSIsInVzZXJfaWQiOjV9.Uh5IB_vYbpvJu0PvOlF6fSsdPgkMmm7hbrvqypS0ABA', '2026-03-22 10:33:04.034777+05:30', '2026-03-23 10:33:04+05:30', 5, '02c920250ebb41bf8f3a47785e35e3b5');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (156, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDI0NTI3NywiaWF0IjoxNzc0MTU4ODc3LCJqdGkiOiIyYzM4ZjBjN2Y4N2Y0ZDIyYmZkNWIyMGEwNDRmMjI1NyIsInVzZXJfaWQiOjV9.8tsR-g4cxzpnYlOtTitojUvzdcZD4rWTSN26KerfiKE', '2026-03-22 11:24:37.661556+05:30', '2026-03-23 11:24:37+05:30', 5, '2c38f0c7f87f4d22bfd5b20a044f2257');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (157, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDI0NTI4NSwiaWF0IjoxNzc0MTU4ODg1LCJqdGkiOiJkZDQxNzBjNDM1OWY0ZTk5YTg4NDNmYTBiM2UxNGQ4NyIsInVzZXJfaWQiOjR9.khlaO9hK_Z-DaBeGXIO6qyyULrcvVXOSMYwRCsBtQTE', '2026-03-22 11:24:45.424084+05:30', '2026-03-23 11:24:45+05:30', 4, 'dd4170c4359f4e99a8843fa0b3e14d87');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (158, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDI0NTMyOSwiaWF0IjoxNzc0MTU4OTI5LCJqdGkiOiIwNWQ3MDM5NTVjOTk0MTZkYmJjNGU1ZDU3ZTY4MzRjZCIsInVzZXJfaWQiOjF9.im7tHF3M9mPVbyzBONBy4X75CQqZP-EfSjkLJ6DY-8E', '2026-03-22 11:25:29.090002+05:30', '2026-03-23 11:25:29+05:30', 1, '05d703955c99416dbbc4e5d57e6834cd');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (159, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDI2NjEwOCwiaWF0IjoxNzc0MTc5NzA4LCJqdGkiOiJiM2Q4MDY2ZGFlYWY0ODcwYjg4ODJmZTBmN2FkZTM0NiIsInVzZXJfaWQiOjV9.lLcLt55hUTVMTzVnBLDOiX1-vZ2cM_HDBPgI50BtELk', '2026-03-22 17:11:48.686802+05:30', '2026-03-23 17:11:48+05:30', 5, 'b3d8066daeaf4870b8882fe0f7ade346');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (160, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDI2NjM1NSwiaWF0IjoxNzc0MTc5OTU1LCJqdGkiOiIzZjRlODE2OWY3NmE0NDY2YmNjODQxYTM4ZjkxNTI0NCIsInVzZXJfaWQiOjV9.qf37Z9byj26YhtxKA_oIHHuQ75WlCXdGMeyiI8dO9Ww', '2026-03-22 17:15:55.059234+05:30', '2026-03-23 17:15:55+05:30', 5, '3f4e8169f76a4466bcc841a38f915244');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (161, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDI2NjM3MCwiaWF0IjoxNzc0MTc5OTcwLCJqdGkiOiJkNWMyYmM1ZmMxNzg0NmQxOGVmYjhlYWJlMzgwMGRkNSIsInVzZXJfaWQiOjV9.BPVQS2z89w0iYtNtzv1y2_75QoypOvEPW9JeDLOCD4I', '2026-03-22 17:16:10.91158+05:30', '2026-03-23 17:16:10+05:30', 5, 'd5c2bc5fc17846d18efb8eabe3800dd5');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (162, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDI2ODE2NSwiaWF0IjoxNzc0MTgxNzY1LCJqdGkiOiI2MTFjOTVlNTNkZWQ0NjU2YmE0MjEzNzMxODM1NWIwZiIsInVzZXJfaWQiOjJ9.DsKMqh6BTZN7pGkmws_1HxYl0Ua06UNPkYhsHnT4sz8', '2026-03-22 17:46:05.824046+05:30', '2026-03-23 17:46:05+05:30', 2, '611c95e53ded4656ba42137318355b0f');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (163, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDI2ODYwOSwiaWF0IjoxNzc0MTgyMjA5LCJqdGkiOiIwMGFjZTIyZDZiNTg0MDdkYWFlNWY0NDBiZjE3NDUzMCIsInVzZXJfaWQiOjV9.zxol7Ggzk22a4M14z2V6CWmGULv3ODcdueKeMOkJcUM', '2026-03-22 17:53:29.661833+05:30', '2026-03-23 17:53:29+05:30', 5, '00ace22d6b58407daae5f440bf174530');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (164, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDI2ODgwMywiaWF0IjoxNzc0MTgyNDAzLCJqdGkiOiI2YTNlY2Y0MDYwZjE0MjJkYjJhMTM2YzliNDRjZTcwOCIsInVzZXJfaWQiOjV9.moY3SyaVo6UgfX1Q5TOhdqNNqPeJ6FIpYtgAyzxh_zk', '2026-03-22 17:56:43.124632+05:30', '2026-03-23 17:56:43+05:30', 5, '6a3ecf4060f1422db2a136c9b44ce708');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (165, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDI2ODg0NCwiaWF0IjoxNzc0MTgyNDQ0LCJqdGkiOiIwNzA0ZTM0MmNjMDA0OGE5YWExYmM0MThjZmUzM2MyNiIsInVzZXJfaWQiOjV9.TD80u7gxwELfhAUjSBrhwDQS6sFstq7YAA5ylau7ykU', '2026-03-22 17:57:24.613603+05:30', '2026-03-23 17:57:24+05:30', 5, '0704e342cc0048a9aa1bc418cfe33c26');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (166, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDI2ODg2NywiaWF0IjoxNzc0MTgyNDY3LCJqdGkiOiIwNWRjZDc4ZGM2OTM0MWQ5YjYyNDRmZDc4YjViNjNjMCIsInVzZXJfaWQiOjJ9.0t2pjxRgkjOqOHv44Z1Jo2bNj_bw_IM66sB7PsBocVw', '2026-03-22 17:57:47.281565+05:30', '2026-03-23 17:57:47+05:30', 2, '05dcd78dc69341d9b6244fd78b5b63c0');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (167, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDI3NDY3MiwiaWF0IjoxNzc0MTg4MjcyLCJqdGkiOiI5MzE4MjVjMWRhMzM0YWY2YmRlZmMxYWQ5NjBkYjNhMCIsInVzZXJfaWQiOjJ9.3wSWiaZsQcoJvWuQzZQZbUYL6uLPjnhuzIZYB7mkosg', '2026-03-22 19:34:32.979846+05:30', '2026-03-23 19:34:32+05:30', 2, '931825c1da334af6bdefc1ad960db3a0');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (168, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDI3NDY3OSwiaWF0IjoxNzc0MTg4Mjc5LCJqdGkiOiJmYTg1MjEyMjNhZTA0NzE3OTc1MTZmODkwNTNmNzhkNyIsInVzZXJfaWQiOjR9.P-koLSPgD7kYxfF3PVBGSRlyyPbvkwm7BBOdk9Yci7o', '2026-03-22 19:34:39.412559+05:30', '2026-03-23 19:34:39+05:30', 4, 'fa8521223ae0471797516f89053f78d7');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (169, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDI4NzU0NSwiaWF0IjoxNzc0MjAxMTQ1LCJqdGkiOiIzM2EyMzQ5MDJhZGY0OTBjYmM0ZTAyYTM4YmYyODNlYSIsInVzZXJfaWQiOjJ9.eYUdnENdACHb3MzVrnEQjj7Xb6apwo5jMLAENb-Mpo4', '2026-03-22 23:09:05.562037+05:30', '2026-03-23 23:09:05+05:30', 2, '33a234902adf490cbc4e02a38bf283ea');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (170, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDI4ODc3NSwiaWF0IjoxNzc0MjAyMzc1LCJqdGkiOiI5Y2IxZmJhZTc3NmY0NGQ1YWI3NzIxNTdkMDMzYjM0OSIsInVzZXJfaWQiOjJ9.pe5jCs_VLBsGNuky1IiLFt0codN94t1NhReNHctMJWM', '2026-03-22 23:29:35.811113+05:30', '2026-03-23 23:29:35+05:30', 2, '9cb1fbae776f44d5ab772157d033b349');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (171, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDI4ODg1NiwiaWF0IjoxNzc0MjAyNDU2LCJqdGkiOiJmYjUyODk5OTYyMzU0MTNjOTkzNjcxZTcxNDU5NTA5MyIsInVzZXJfaWQiOjJ9.9sY6Gmf5HSS8SX9iJ4OUCbaVnppRg-cQdLmWn0iqg1E', '2026-03-22 23:30:56.531304+05:30', '2026-03-23 23:30:56+05:30', 2, 'fb5289996235413c993671e714595093');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (172, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDI4ODk1MiwiaWF0IjoxNzc0MjAyNTUyLCJqdGkiOiI2MDY5MGVhOWQxOTc0NWYyODE3MTM0ODYxZWJmMTVkYiIsInVzZXJfaWQiOjR9._TiahbsgFjgSek_wgBdhfNZNgrhYrXqHQ_o6tl2iVKc', '2026-03-22 23:32:32.242578+05:30', '2026-03-23 23:32:32+05:30', 4, '60690ea9d19745f2817134861ebf15db');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (173, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDI4OTEzOSwiaWF0IjoxNzc0MjAyNzM5LCJqdGkiOiJhZjBhODMxMDA0YTA0ZWFhYjRlOTk3YWVlMTRhZTY5NSIsInVzZXJfaWQiOjJ9.iDFq58PPrYsqLfcnBJL5MeBcuDd2H1BhJJqu3hUWeQU', '2026-03-22 23:35:39.46646+05:30', '2026-03-23 23:35:39+05:30', 2, 'af0a831004a04eaab4e997aee14ae695');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (174, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDI4OTI0OSwiaWF0IjoxNzc0MjAyODQ5LCJqdGkiOiJhZWVjMWJiZWZhNTY0NDMzOTk5NDc3YWI5OWQ5NTg3ZSIsInVzZXJfaWQiOjR9.VLwz63GkXDWBCgZPLBkmAXu1AhpiWvLcEv5mMU8cZEA', '2026-03-22 23:37:29.537068+05:30', '2026-03-23 23:37:29+05:30', 4, 'aeec1bbefa564433999477ab99d9587e');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (175, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDI4OTMxMiwiaWF0IjoxNzc0MjAyOTEyLCJqdGkiOiI3YmJhOWVjOTQyZDE0NWY2YWU2NGExMzRhNWM5NTU3MyIsInVzZXJfaWQiOjF9.nV4wfuHD7MLZ2aiBOGpmvsrJ3G_rN5wZdWEMg0L-pWg', '2026-03-22 23:38:32.503275+05:30', '2026-03-23 23:38:32+05:30', 1, '7bba9ec942d145f6ae64a134a5c95573');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (176, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDMxNzI2NCwiaWF0IjoxNzc0MjMwODY0LCJqdGkiOiI2NDA5OWY0ZmEyZjU0ZGQ3OTdjMzhmNDYyYmJhYWY1YyIsInVzZXJfaWQiOjF9.pgnjBVJBnYBXX5M9nbJHx8A4iUJk-zAUsBbegGVGAA4', '2026-03-23 07:24:24.545482+05:30', '2026-03-24 07:24:24+05:30', 1, '64099f4fa2f54dd797c38f462bbaaf5c');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (177, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDMyMDYzNiwiaWF0IjoxNzc0MjM0MjM2LCJqdGkiOiJlZDU3ZGNlN2VlNGE0ZDQ4YjM4ODA1OWQ1NjdjYTMzOCIsInVzZXJfaWQiOjF9.LnrtKhcvk5aYJ1W6KKt-nONv_91Knk7QQZjq-YFCATk', '2026-03-23 08:20:36.470898+05:30', '2026-03-24 08:20:36+05:30', 1, 'ed57dce7ee4a4d48b388059d567ca338');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (178, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDMyMDkzNiwiaWF0IjoxNzc0MjM0NTM2LCJqdGkiOiIyNTIxZTQ1NzdlNjA0ZmYyOTZkY2M0ZDA1NTNlYWQyNiIsInVzZXJfaWQiOjR9.ln5m2a4ZVaSC6Cq5KrdMOKoRk0V-QJ3BONXiOlT3iwY', '2026-03-23 08:25:36.711831+05:30', '2026-03-24 08:25:36+05:30', 4, '2521e4577e604ff296dcc4d0553ead26');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (179, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDMyMTI5OSwiaWF0IjoxNzc0MjM0ODk5LCJqdGkiOiJkZGMzMWQ2YmE3ZDE0N2UxOTYxODFmNWZiNmEwOGU0NiIsInVzZXJfaWQiOjF9.9gR4NRur8jw9MdkFQE_iAsfz2WLlghP8YoenwDxr8w4', '2026-03-23 08:31:39.996992+05:30', '2026-03-24 08:31:39+05:30', 1, 'ddc31d6ba7d147e196181f5fb6a08e46');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (180, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDMyMjI5OCwiaWF0IjoxNzc0MjM1ODk4LCJqdGkiOiI5YTQ2NDU2OGZlZWY0OTcyODFiZDYxNzM4NWI5NWEzNiIsInVzZXJfaWQiOjJ9.vx1jMRhCaEbsR8s6BKcvy6CxWywYRbhgcwyr5rWxDH8', '2026-03-23 08:48:18.959358+05:30', '2026-03-24 08:48:18+05:30', 2, '9a464568feef497281bd617385b95a36');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (181, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDMyMjMyNCwiaWF0IjoxNzc0MjM1OTI0LCJqdGkiOiI1ZTM5ZTMxODA0N2Q0ZDRhOTY4ZTExYWVlM2ZhNjExNyIsInVzZXJfaWQiOjR9.KPn5LDxNOMiHGB9ELqQBN7Lm0U31l-XNskbxah3rPm8', '2026-03-23 08:48:44.637234+05:30', '2026-03-24 08:48:44+05:30', 4, '5e39e318047d4d4a968e11aee3fa6117');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (182, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDMyMjM2NCwiaWF0IjoxNzc0MjM1OTY0LCJqdGkiOiIwYTE4MjNiZmJjOTQ0MDAwOTBjZTAxOGJjZWUxYzM2YSIsInVzZXJfaWQiOjF9.EBMGdIDW_v2BR01JeAiaMOcOtR9v__X0gS_0PIe5xWo', '2026-03-23 08:49:24.577254+05:30', '2026-03-24 08:49:24+05:30', 1, '0a1823bfbc94400090ce018bcee1c36a');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (183, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDMyMjM4OCwiaWF0IjoxNzc0MjM1OTg4LCJqdGkiOiI5ZWMwNTE4MmM3OGE0NDFiODU1MWQxMjk4Y2Y2OWMwZiIsInVzZXJfaWQiOjR9.zQQ8VmikV5pQL2rdrKXcLPvfcorXezQfoHT0grvH7VY', '2026-03-23 08:49:48.258957+05:30', '2026-03-24 08:49:48+05:30', 4, '9ec05182c78a441b8551d1298cf69c0f');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (184, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDMyMjQwMSwiaWF0IjoxNzc0MjM2MDAxLCJqdGkiOiJiMDFjMmNmMzI1NjY0YzFmYjY2NTZhOGNjYzQxZWY3OSIsInVzZXJfaWQiOjR9.HmH6uX9WqgrT2EgjCKlrCo2mQT7YtSlrSCYZ6_pBSYI', '2026-03-23 08:50:01.634331+05:30', '2026-03-24 08:50:01+05:30', 4, 'b01c2cf325664c1fb6656a8ccc41ef79');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (185, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDMyODI1MiwiaWF0IjoxNzc0MjQxODUyLCJqdGkiOiIxNjMyZTg3MDFlYWM0NTFlOTBjZTMyYWFjOTUyZTQ3ZCIsInVzZXJfaWQiOjR9.hTdqMsqDV8ca9QHpQ05uoJ8HNzMjFpkxXcwde36rgSM', '2026-03-23 10:27:32.210111+05:30', '2026-03-24 10:27:32+05:30', 4, '1632e8701eac451e90ce32aac952e47d');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (186, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDMyOTY0MywiaWF0IjoxNzc0MjQzMjQzLCJqdGkiOiJmNzEyZmQ1ZGY4NTY0ZGI0OTE2MDVmOWY4MmM5YWRjNiIsInVzZXJfaWQiOjh9.nSpxX6QHhRAs82UBJBo8zrCWQj2en-FgjZ0gzBt6GkU', '2026-03-23 10:50:43.14417+05:30', '2026-03-24 10:50:43+05:30', 8, 'f712fd5df8564db491605f9f82c9adc6');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (187, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDMyOTc0OSwiaWF0IjoxNzc0MjQzMzQ5LCJqdGkiOiJiNTg0MzZkNmRmY2U0NWQ4YTZmMWJiYjE5M2RkMzdjMyIsInVzZXJfaWQiOjh9.8aAh2e_8bDYWdIWghUBEipXUnuuAL-K_M83woJAQQgI', '2026-03-23 10:52:29.186064+05:30', '2026-03-24 10:52:29+05:30', 8, 'b58436d6dfce45d8a6f1bbb193dd37c3');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (188, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDMzMDU2NSwiaWF0IjoxNzc0MjQ0MTY1LCJqdGkiOiJlM2EyYmMxMzljOTY0MmM2YmFlNzcwMTNkZTdhNjRiNiIsInVzZXJfaWQiOjJ9.gVfkP_kCnN09TLiGRy7Tf3z2_ktXfOljOTIRwk2M-BE', '2026-03-23 11:06:05.913472+05:30', '2026-03-24 11:06:05+05:30', 2, 'e3a2bc139c9642c6bae77013de7a64b6');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (189, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDMzMDYyMSwiaWF0IjoxNzc0MjQ0MjIxLCJqdGkiOiI2ZWVkNjcwNDRmOTc0NWU4YWQwZjUwM2FlN2I2YzYwYyIsInVzZXJfaWQiOjR9.PppAqUJr-wYgueQ8713ikbe-TfbAsvdCLcbVVheqcPc', '2026-03-23 11:07:01.612677+05:30', '2026-03-24 11:07:01+05:30', 4, '6eed67044f9745e8ad0f503ae7b6c60c');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (190, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDMzMDcwNCwiaWF0IjoxNzc0MjQ0MzA0LCJqdGkiOiI2ZDM4MzQ3MmFlMTc0MmNjOWY4Njg4NzE2NDdiM2MwMCIsInVzZXJfaWQiOjF9.cMdrl3JyMRl3wt1iOh7tLXdxQY85SaoV2Sc08oeMB0k', '2026-03-23 11:08:24.02059+05:30', '2026-03-24 11:08:24+05:30', 1, '6d383472ae1742cc9f868871647b3c00');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (191, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDMzMTk2OCwiaWF0IjoxNzc0MjQ1NTY4LCJqdGkiOiJjODRlYWQ0Y2FkOWY0MDI3YTk5OGE2MmMyYTk5YTIyOCIsInVzZXJfaWQiOjh9.zD1HLBZ1dxN0BDRtLRm_wr7i3zUE7zZSLtIoX9aTVww', '2026-03-23 11:29:28.146572+05:30', '2026-03-24 11:29:28+05:30', 8, 'c84ead4cad9f4027a998a62c2a99a228');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (192, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDMzMzc1NSwiaWF0IjoxNzc0MjQ3MzU1LCJqdGkiOiJkNDliMmVhY2M0N2Y0ZTIzOWY2YWY1MTBhOGU3MmQzYyIsInVzZXJfaWQiOjh9.u8EUbDC4iFMGlJgTaOkCRdVyDTrPC7FfK_9vhv5zGYQ', '2026-03-23 11:59:15.539162+05:30', '2026-03-24 11:59:15+05:30', 8, 'd49b2eacc47f4e239f6af510a8e72d3c');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (193, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDMzODkyNiwiaWF0IjoxNzc0MjUyNTI2LCJqdGkiOiI3OWJiODdhOGRjOGM0NjIxODExYzA4OWVhOWE1ZGM4NCIsInVzZXJfaWQiOjJ9.oaGemFBL2IIG2mFC92D7Se5nnQpNEA28Hug-jfQ7IaE', '2026-03-23 13:25:26.429185+05:30', '2026-03-24 13:25:26+05:30', 2, '79bb87a8dc8c4621811c089ea9a5dc84');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (194, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDM0NjI0MiwiaWF0IjoxNzc0MjU5ODQyLCJqdGkiOiJkNDg1M2ZmYzJjY2Y0ZDZjYmY3NGIxMTcwNGFmYTAzNSIsInVzZXJfaWQiOjJ9.CaPhm7xsqGiKnJWjEkYkU_zjBHTV5iXVWbxGU32bWIM', '2026-03-23 15:27:22.655144+05:30', '2026-03-24 15:27:22+05:30', 2, 'd4853ffc2ccf4d6cbf74b11704afa035');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (195, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDM0NjYwMCwiaWF0IjoxNzc0MjYwMjAwLCJqdGkiOiIxNDA5OTVmOWQ3YTc0MTMyODUxMGJhZDI0ZDhhODQ0YiIsInVzZXJfaWQiOjR9.I46TGmWe8jSrczJsdfRq30cfEVFXJs2uVfEFq6pWR40', '2026-03-23 15:33:20.838042+05:30', '2026-03-24 15:33:20+05:30', 4, '140995f9d7a741328510bad24d8a844b');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (196, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDM0Njc0MCwiaWF0IjoxNzc0MjYwMzQwLCJqdGkiOiJhZjAzODliMDJkNTE0YTU3YTkzMWMzZGUzYTQ4NjZkNCIsInVzZXJfaWQiOjJ9.oeRrWvQmLtfg7kBNtAYGWjFStL-M4_iS7i9-Bnc2glI', '2026-03-23 15:35:40.748259+05:30', '2026-03-24 15:35:40+05:30', 2, 'af0389b02d514a57a931c3de3a4866d4');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (197, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDM0Njk3NywiaWF0IjoxNzc0MjYwNTc3LCJqdGkiOiJjMjBjNDcxOWFlNGM0MTg5YWE5NTM4NTE0NTk5NzNhYiIsInVzZXJfaWQiOjR9.2h9K5INMq5-nY695fQueKszTgiIWMeHtdezRwwJ-Jug', '2026-03-23 15:39:37.6499+05:30', '2026-03-24 15:39:37+05:30', 4, 'c20c4719ae4c4189aa953851459973ab');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (198, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDM0Njk4NSwiaWF0IjoxNzc0MjYwNTg1LCJqdGkiOiIxYjhkNDlhN2QzNGQ0ODkwYWIxNDdhNWY2OWY5NmMyNiIsInVzZXJfaWQiOjF9.Negros0ixTchVJb44EfsVPiHj7dS6E4vGIXYMNnUs-Y', '2026-03-23 15:39:45.403165+05:30', '2026-03-24 15:39:45+05:30', 1, '1b8d49a7d34d4890ab147a5f69f96c26');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (199, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDM0NzQ1MywiaWF0IjoxNzc0MjYxMDUzLCJqdGkiOiJlMjAwZWE0NmYxOGM0MGE5OTE3Y2QyN2FkOTIxZDk1MyIsInVzZXJfaWQiOjF9.F5Eb0_BC7Vo2qqf8RtWXzweZLtZQ2BuGE2taPggZM3w', '2026-03-23 15:47:33.883579+05:30', '2026-03-24 15:47:33+05:30', 1, 'e200ea46f18c40a9917cd27ad921d953');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (200, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDM0NzQ3MiwiaWF0IjoxNzc0MjYxMDcyLCJqdGkiOiI5OTRiMGI2NGQ0Yjc0YmZjYmE2MWQ4ZTMzZDEzZWRmNiIsInVzZXJfaWQiOjJ9.9wpNzw24xSLLoFogY9Qvt2YXQtkIxfESi3ZkXLz3kHc', '2026-03-23 15:47:52.951149+05:30', '2026-03-24 15:47:52+05:30', 2, '994b0b64d4b74bfcba61d8e33d13edf6');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (201, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDM0NzY2MywiaWF0IjoxNzc0MjYxMjYzLCJqdGkiOiI0MGYwZTdjMjJjODk0ZjEyOGQ1OTQzYTNlMjkzMjE0ZSIsInVzZXJfaWQiOjR9.H4DMJsnalsJOO_qZBxQjFGX7r3Xh9HaWCXBGkrmKRls', '2026-03-23 15:51:03.505088+05:30', '2026-03-24 15:51:03+05:30', 4, '40f0e7c22c894f128d5943a3e293214e');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (202, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDM0Nzc4OCwiaWF0IjoxNzc0MjYxMzg4LCJqdGkiOiI0NTZkZmQzNmVmYTM0YjVlYWU4ZjFmNzJhZDMxNzBkYiIsInVzZXJfaWQiOjF9.xHPPEnUDoFQOhs3AAVQGCieYf3q7JS3HiF1id3ZijP4', '2026-03-23 15:53:08.373803+05:30', '2026-03-24 15:53:08+05:30', 1, '456dfd36efa34b5eae8f1f72ad3170db');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (203, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDM0NzgyMywiaWF0IjoxNzc0MjYxNDIzLCJqdGkiOiJjZGE1OTUxZjAyNTg0YTAzOWRlNDBlOTY4YTMzN2U4OSIsInVzZXJfaWQiOjJ9.yaqkHTsM1APUgm2YErHpyF7MVStrkfWdLlzC6jACAwk', '2026-03-23 15:53:43.295263+05:30', '2026-03-24 15:53:43+05:30', 2, 'cda5951f02584a039de40e968a337e89');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (204, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDM0Nzg2MCwiaWF0IjoxNzc0MjYxNDYwLCJqdGkiOiI1ZjVhNjk5ZDRkODY0YzNiOGQ4Yjc0ZjlhN2ZiYTljNCIsInVzZXJfaWQiOjF9.kcgz6klyTxF7m5zyvPHJlaSj7W2AT3IePcx7x8Tqu4g', '2026-03-23 15:54:20.494927+05:30', '2026-03-24 15:54:20+05:30', 1, '5f5a699d4d864c3b8d8b74f9a7fba9c4');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (205, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDM1MDI4OSwiaWF0IjoxNzc0MjYzODg5LCJqdGkiOiIwZTU5NTc4ZjMwYjI0NDAwOWU4YjhlNGUwYmFmNWVlNyIsInVzZXJfaWQiOjJ9.ds1Axm8MiziThXh_zeztS084c5eQF6uFdKrEXZWxoqM', '2026-03-23 16:34:49.930037+05:30', '2026-03-24 16:34:49+05:30', 2, '0e59578f30b244009e8b8e4e0baf5ee7');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (206, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDM1OTgzNiwiaWF0IjoxNzc0MjczNDM2LCJqdGkiOiJjOTVlMzY3MTA3ZDk0M2I0YmQ2ODYxOTAwOTIwM2FjNCIsInVzZXJfaWQiOjR9.1DRnRX1h4omgl3fDuwNnKRWaO4_u_-i8JsVRJ4bg5Po', '2026-03-23 19:13:56.643145+05:30', '2026-03-24 19:13:56+05:30', 4, 'c95e367107d943b4bd68619009203ac4');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (207, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDM1OTg0NywiaWF0IjoxNzc0MjczNDQ3LCJqdGkiOiIzNzE5MmU3OWYwM2U0NDQwODM3NWRiYzQ0NGU2YjA2MiIsInVzZXJfaWQiOjJ9.d_-92tT2OWzQxlUMMMyrZx02wSeEzfaOSPzNYh-6x0g', '2026-03-23 19:14:07.034592+05:30', '2026-03-24 19:14:07+05:30', 2, '37192e79f03e44408375dbc444e6b062');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (208, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDQ0MTQ4MiwiaWF0IjoxNzc0MzU1MDgyLCJqdGkiOiIwMmE4Y2JkNTMxNDU0MWVjYmVhMmMxZDZiMzZhYjFkOCIsInVzZXJfaWQiOjJ9.eUFXmAccQ3i1pymqQ20GDMmkO-4ZxfFVO1ziGxs5mDo', '2026-03-24 17:54:42.217374+05:30', '2026-03-25 17:54:42+05:30', 2, '02a8cbd5314541ecbea2c1d6b36ab1d8');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (209, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDQ0MjE1MSwiaWF0IjoxNzc0MzU1NzUxLCJqdGkiOiI0NWJmZDE0ZDdiOWY0ZmQ0YWM4ZjA0ZWY4YjIxZWIwYSIsInVzZXJfaWQiOjF9.DqwxH5mzcn9cx0X470qX11VMM07EwBZC3eM_TRmbdHo', '2026-03-24 18:05:51.179873+05:30', '2026-03-25 18:05:51+05:30', 1, '45bfd14d7b9f4fd4ac8f04ef8b21eb0a');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (210, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDQ0MjQzNSwiaWF0IjoxNzc0MzU2MDM1LCJqdGkiOiJhNDhkYzExOWU3N2E0MGEyYWYzYzM5YmFkNTI3Zjc5OSIsInVzZXJfaWQiOjJ9.buhIkliIrJJMW7b992UH-gYaYM0efJpdjz89N22RYf0', '2026-03-24 18:10:35.468873+05:30', '2026-03-25 18:10:35+05:30', 2, 'a48dc119e77a40a2af3c39bad527f799');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (211, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDQ1MTY2OCwiaWF0IjoxNzc0MzY1MjY4LCJqdGkiOiJlMGJhMGEyMzA5NTc0ODQ3OTkxYzEyMzlmMTYzMjU3ZiIsInVzZXJfaWQiOjV9.YqUj43y1y-0Vsa4qztnJ9VZxpNAjHWIJTGvv50piN0A', '2026-03-24 20:44:28.146911+05:30', '2026-03-25 20:44:28+05:30', 5, 'e0ba0a2309574847991c1239f163257f');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (212, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDQ1MTc4MCwiaWF0IjoxNzc0MzY1MzgwLCJqdGkiOiJhMTE0MWYxNjdjYjg0YjBmYjIwZjk1ZjlhZDFiYmJlNCIsInVzZXJfaWQiOjR9.dYq5YJUebye4M9cJcY7s48fI14SF-EmtuB_w3Ff-oy0', '2026-03-24 20:46:20.176234+05:30', '2026-03-25 20:46:20+05:30', 4, 'a1141f167cb84b0fb20f95f9ad1bbbe4');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (213, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDQ1MjY2NywiaWF0IjoxNzc0MzY2MjY3LCJqdGkiOiJjNTI0NmI2Y2QyNDY0ZjZmOTFjNThmN2ZlNzgwODI5YyIsInVzZXJfaWQiOjV9.WRYOAmUiioaL2N6fdbT1DAHAV5oQs9M9HedWSlzOVuA', '2026-03-24 21:01:07.422593+05:30', '2026-03-25 21:01:07+05:30', 5, 'c5246b6cd2464f6f91c58f7fe780829c');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (214, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDQ5MzY5OSwiaWF0IjoxNzc0NDA3Mjk5LCJqdGkiOiJlZTAyYjU5OTJlMTg0ZmE1ODE5MDg1Y2ZhOTU4MGQwZCIsInVzZXJfaWQiOjV9.vJNr8V-Sskbeej3AREr0UYWE1ETrXyDuvrbT4rxMnpw', '2026-03-25 08:24:59.214352+05:30', '2026-03-26 08:24:59+05:30', 5, 'ee02b5992e184fa5819085cfa9580d0d');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (215, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDUxNDAyMiwiaWF0IjoxNzc0NDI3NjIyLCJqdGkiOiI3ODBhNzk1YmFkZmU0NzU0OGQzMzkzOTNhYWEwMTYzYiIsInVzZXJfaWQiOjV9.rw5SbmvePcPF0MvGwJHlq-cmJo0dfMPiWtnbO4XuS_w', '2026-03-25 14:03:42.09918+05:30', '2026-03-26 14:03:42+05:30', 5, '780a795badfe47548d339393aaa0163b');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (216, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NDYwMDg5NCwiaWF0IjoxNzc0NTE0NDk0LCJqdGkiOiI2NTkyODk5YjM4OGQ0ZGUwODU1NTE4ODJkZWY3ZmQ3NiIsInVzZXJfaWQiOjF9.HXDYs9_TBxtE-dqFcPDih93lX3_IdnfXqzYnfxcSDAM', '2026-03-26 14:11:34.773069+05:30', '2026-03-27 14:11:34+05:30', 1, '6592899b388d4de085551882def7fd76');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (217, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NTA1MDA5OCwiaWF0IjoxNzc0OTYzNjk4LCJqdGkiOiIzNTI4NDdkMjcxODg0ZDQ0YTUyODAzMThjYmNjZDM4NiIsInVzZXJfaWQiOjJ9.27tvZ9JKwRbzk-kRAPojsqruGfd3qdohpYs0tWle76Y', '2026-03-31 18:58:18.955742+05:30', '2026-04-01 18:58:18+05:30', 2, '352847d271884d44a5280318cbccd386');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (218, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NTM3Njk1NCwiaWF0IjoxNzc1MjkwNTU0LCJqdGkiOiIzYWE1NjQyZGEzZGQ0OTE1OTE1ZjVmMzJjNTZlOGM4NSIsInVzZXJfaWQiOjl9.YFfK9Hi3QpWf7SqWWeSVmM_nVcFnCLey-yULXF-A_mY', '2026-04-04 13:45:54.319289+05:30', '2026-04-05 13:45:54+05:30', 9, '3aa5642da3dd4915915f5f32c56e8c85');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (219, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NTM3Njk2MSwiaWF0IjoxNzc1MjkwNTYxLCJqdGkiOiJiZTQwMjVkZGY1ZGM0YTg2YTRiNDdhNzNlMWQ1ZTJhNiIsInVzZXJfaWQiOjl9.WTywW0-OL0y6lnwmY_Ho1ad8ucA1r8gw-nQtRTVUM4g', '2026-04-04 13:46:01.407698+05:30', '2026-04-05 13:46:01+05:30', 9, 'be4025ddf5dc4a86a4b47a73e1d5e2a6');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (220, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NTM3NzE3NCwiaWF0IjoxNzc1MjkwNzc0LCJqdGkiOiIwY2VjMjEwOTI4MzQ0MDE0YTk1NTI0NGJlMWY2MTcyOCIsInVzZXJfaWQiOjF9.BgRe3p-GMIMnl4LN7knqPfYyj0eh3GfTBN1ndxqV3NY', '2026-04-04 13:49:34.138645+05:30', '2026-04-05 13:49:34+05:30', 1, '0cec210928344014a955244be1f61728');
INSERT INTO public.token_blacklist_outstandingtoken VALUES (221, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3NTM3NzY5OCwiaWF0IjoxNzc1MjkxMjk4LCJqdGkiOiIxMTE2MjYyYzhhNjc0YmIyOWQzMjg1MjY3ZDBmODFkNyIsInVzZXJfaWQiOjF9._1j4vIAU0Q82cBGy9N9QBYjjuFBFwtHLio11e_msDfg', '2026-04-04 13:58:18.116902+05:30', '2026-04-05 13:58:18+05:30', 1, '1116262c8a674bb29d3285267d0f81d7');


--
-- Data for Name: token_blacklist_blacklistedtoken; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.token_blacklist_blacklistedtoken VALUES (1, '2026-03-17 22:24:41.239428+05:30', 2);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (2, '2026-03-17 22:28:05.902051+05:30', 3);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (3, '2026-03-17 22:31:00.977206+05:30', 4);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (4, '2026-03-17 22:31:20.277349+05:30', 5);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (5, '2026-03-18 09:00:17.626143+05:30', 6);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (6, '2026-03-18 09:03:22.372489+05:30', 7);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (7, '2026-03-18 09:30:29.974242+05:30', 8);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (8, '2026-03-18 13:55:56.775749+05:30', 9);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (9, '2026-03-18 16:04:15.686938+05:30', 10);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (10, '2026-03-18 16:04:30.579291+05:30', 11);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (11, '2026-03-18 16:18:59.883977+05:30', 12);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (12, '2026-03-18 17:07:46.212382+05:30', 13);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (13, '2026-03-18 21:09:09.941712+05:30', 17);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (14, '2026-03-18 21:10:10.301965+05:30', 18);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (15, '2026-03-19 07:41:59.970248+05:30', 19);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (17, '2026-03-19 07:49:59.202364+05:30', 20);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (18, '2026-03-19 07:56:23.530308+05:30', 21);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (19, '2026-03-19 07:59:11.213321+05:30', 22);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (20, '2026-03-19 10:00:24.810911+05:30', 24);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (21, '2026-03-19 10:01:08.499445+05:30', 25);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (22, '2026-03-19 10:04:45.236967+05:30', 26);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (23, '2026-03-19 10:47:50.703735+05:30', 28);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (24, '2026-03-19 10:48:37.699356+05:30', 29);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (25, '2026-03-19 10:58:39.478788+05:30', 30);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (26, '2026-03-19 10:59:11.486915+05:30', 31);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (27, '2026-03-19 11:02:43.753129+05:30', 32);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (28, '2026-03-19 11:08:05.775466+05:30', 33);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (29, '2026-03-19 11:17:48.302704+05:30', 39);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (30, '2026-03-19 11:18:23.74516+05:30', 40);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (31, '2026-03-19 11:30:19.667551+05:30', 41);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (32, '2026-03-19 13:04:36.333529+05:30', 42);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (33, '2026-03-19 13:05:18.610795+05:30', 43);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (34, '2026-03-19 13:09:56.088774+05:30', 44);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (35, '2026-03-19 13:10:14.464008+05:30', 45);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (36, '2026-03-19 13:12:34.32362+05:30', 46);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (37, '2026-03-19 17:15:48.775851+05:30', 49);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (38, '2026-03-19 17:20:41.07335+05:30', 50);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (39, '2026-03-19 17:21:50.90232+05:30', 51);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (40, '2026-03-19 17:46:16.047248+05:30', 52);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (41, '2026-03-19 22:13:37.218155+05:30', 54);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (42, '2026-03-19 22:13:53.988138+05:30', 55);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (43, '2026-03-19 22:16:24.324515+05:30', 56);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (44, '2026-03-19 22:34:53.214215+05:30', 57);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (45, '2026-03-19 22:52:41.298036+05:30', 58);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (46, '2026-03-20 09:54:56.258744+05:30', 59);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (47, '2026-03-20 10:10:46.371181+05:30', 60);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (48, '2026-03-20 11:03:16.534251+05:30', 61);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (49, '2026-03-20 12:00:56.676538+05:30', 62);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (50, '2026-03-20 12:19:44.805003+05:30', 63);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (51, '2026-03-20 12:26:35.738552+05:30', 64);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (52, '2026-03-20 18:53:32.136461+05:30', 68);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (53, '2026-03-20 18:54:25.117587+05:30', 69);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (54, '2026-03-20 18:59:39.049184+05:30', 70);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (55, '2026-03-20 19:22:49.705097+05:30', 71);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (56, '2026-03-20 19:23:01.708497+05:30', 72);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (57, '2026-03-20 19:23:06.755479+05:30', 73);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (58, '2026-03-20 21:12:14.864393+05:30', 74);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (59, '2026-03-20 21:16:24.152172+05:30', 75);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (60, '2026-03-20 21:17:27.125731+05:30', 76);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (61, '2026-03-20 21:17:46.895062+05:30', 77);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (62, '2026-03-21 05:46:57.439396+05:30', 80);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (64, '2026-03-21 07:34:57.183256+05:30', 82);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (65, '2026-03-21 09:43:32.785827+05:30', 83);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (66, '2026-03-21 11:48:51.812525+05:30', 86);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (67, '2026-03-21 12:17:23.150411+05:30', 87);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (68, '2026-03-21 12:18:22.493578+05:30', 88);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (69, '2026-03-21 12:19:49.246901+05:30', 90);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (70, '2026-03-21 12:19:56.869153+05:30', 91);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (71, '2026-03-21 12:40:01.151266+05:30', 92);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (72, '2026-03-21 12:41:06.469755+05:30', 93);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (73, '2026-03-21 12:42:51.57471+05:30', 94);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (74, '2026-03-21 12:43:24.990752+05:30', 95);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (75, '2026-03-21 12:50:51.842987+05:30', 96);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (76, '2026-03-21 12:51:05.296681+05:30', 97);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (77, '2026-03-21 13:03:33.050194+05:30', 98);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (78, '2026-03-21 13:04:10.976382+05:30', 99);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (79, '2026-03-21 18:10:39.153278+05:30', 101);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (80, '2026-03-21 18:44:19.890828+05:30', 102);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (81, '2026-03-21 18:44:49.700616+05:30', 103);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (82, '2026-03-21 18:49:05.688855+05:30', 104);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (83, '2026-03-21 18:54:24.524452+05:30', 105);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (84, '2026-03-21 18:54:35.790832+05:30', 106);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (85, '2026-03-21 18:59:55.263703+05:30', 107);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (86, '2026-03-21 19:00:09.506836+05:30', 108);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (87, '2026-03-21 19:09:14.705447+05:30', 110);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (88, '2026-03-21 19:09:53.441881+05:30', 111);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (89, '2026-03-21 19:10:40.614235+05:30', 112);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (90, '2026-03-21 19:11:11.8013+05:30', 113);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (91, '2026-03-21 19:14:31.022648+05:30', 114);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (92, '2026-03-21 19:22:37.185736+05:30', 115);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (93, '2026-03-21 19:23:51.058791+05:30', 116);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (94, '2026-03-21 19:24:17.03439+05:30', 117);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (95, '2026-03-21 19:25:24.184056+05:30', 118);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (96, '2026-03-21 19:25:45.416639+05:30', 119);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (97, '2026-03-21 19:28:50.706022+05:30', 120);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (98, '2026-03-21 19:29:04.300733+05:30', 121);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (99, '2026-03-21 19:31:20.145607+05:30', 122);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (100, '2026-03-21 19:36:52.640781+05:30', 123);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (101, '2026-03-21 19:36:58.481394+05:30', 124);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (102, '2026-03-21 19:46:14.412014+05:30', 125);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (103, '2026-03-21 19:47:09.489077+05:30', 126);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (104, '2026-03-21 19:50:17.134775+05:30', 127);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (105, '2026-03-21 21:36:16.839185+05:30', 128);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (106, '2026-03-21 21:41:33.806214+05:30', 129);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (107, '2026-03-21 21:41:39.020319+05:30', 130);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (108, '2026-03-21 21:59:23.656365+05:30', 131);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (109, '2026-03-21 22:10:43.547387+05:30', 132);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (110, '2026-03-21 22:11:09.092339+05:30', 133);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (111, '2026-03-21 22:12:18.854094+05:30', 134);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (112, '2026-03-21 22:15:57.235316+05:30', 135);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (113, '2026-03-21 22:16:06.406293+05:30', 136);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (114, '2026-03-21 22:16:09.52063+05:30', 137);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (115, '2026-03-21 23:23:02.14264+05:30', 139);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (116, '2026-03-21 23:29:59.105638+05:30', 140);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (117, '2026-03-21 23:30:20.559983+05:30', 141);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (118, '2026-03-21 23:34:55.421325+05:30', 142);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (119, '2026-03-21 23:35:35.548526+05:30', 143);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (120, '2026-03-21 23:35:50.259498+05:30', 144);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (121, '2026-03-22 08:34:12.450489+05:30', 145);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (122, '2026-03-22 08:34:49.768336+05:30', 146);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (123, '2026-03-22 08:35:23.1526+05:30', 147);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (124, '2026-03-22 08:35:56.121719+05:30', 148);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (125, '2026-03-22 08:36:10.785806+05:30', 149);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (126, '2026-03-22 08:37:06.945885+05:30', 150);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (127, '2026-03-22 08:42:09.9756+05:30', 151);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (128, '2026-03-22 10:02:22.768157+05:30', 152);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (129, '2026-03-22 10:32:40.916394+05:30', 153);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (130, '2026-03-22 10:33:00.700929+05:30', 154);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (131, '2026-03-22 11:24:30.871296+05:30', 155);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (132, '2026-03-22 11:24:40.72688+05:30', 156);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (133, '2026-03-22 11:25:09.693311+05:30', 157);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (134, '2026-03-22 17:15:36.663056+05:30', 159);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (135, '2026-03-22 17:53:55.752381+05:30', 163);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (136, '2026-03-22 17:57:43.15429+05:30', 165);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (137, '2026-03-22 19:08:50.981662+05:30', 166);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (138, '2026-03-22 19:34:34.520213+05:30', 167);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (139, '2026-03-22 22:59:30.140766+05:30', 168);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (140, '2026-03-22 23:32:50.948235+05:30', 172);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (141, '2026-03-22 23:37:26.049227+05:30', 173);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (142, '2026-03-22 23:38:25.308741+05:30', 174);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (143, '2026-03-22 23:39:17.653243+05:30', 175);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (144, '2026-03-23 07:24:33.091687+05:30', 176);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (145, '2026-03-23 08:25:33.916375+05:30', 177);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (146, '2026-03-23 08:48:14.894045+05:30', 179);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (147, '2026-03-23 08:48:41.522165+05:30', 180);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (148, '2026-03-23 08:49:20.93374+05:30', 181);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (149, '2026-03-23 08:49:44.899803+05:30', 182);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (150, '2026-03-23 08:49:58.102921+05:30', 183);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (151, '2026-03-23 08:50:46.687695+05:30', 184);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (152, '2026-03-23 10:27:34.220377+05:30', 185);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (153, '2026-03-23 11:04:05.914316+05:30', 187);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (154, '2026-03-23 11:06:58.221481+05:30', 188);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (155, '2026-03-23 11:08:20.558807+05:30', 189);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (156, '2026-03-23 11:29:01.09963+05:30', 190);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (157, '2026-03-23 11:59:36.725705+05:30', 192);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (158, '2026-03-23 13:30:51.990419+05:30', 193);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (159, '2026-03-23 15:33:10.497983+05:30', 194);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (160, '2026-03-23 15:35:35.942949+05:30', 195);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (161, '2026-03-23 15:39:31.193358+05:30', 196);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (162, '2026-03-23 15:39:41.404972+05:30', 197);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (163, '2026-03-23 15:42:34.672018+05:30', 198);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (164, '2026-03-23 15:47:45.108118+05:30', 199);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (165, '2026-03-23 15:50:56.37951+05:30', 200);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (166, '2026-03-23 15:53:02.257395+05:30', 201);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (167, '2026-03-23 15:53:39.541951+05:30', 202);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (168, '2026-03-23 15:54:16.53544+05:30', 203);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (169, '2026-03-23 15:55:37.304126+05:30', 204);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (170, '2026-03-23 19:13:53.172687+05:30', 205);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (171, '2026-03-23 19:14:03.80533+05:30', 206);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (172, '2026-03-24 17:43:41.25358+05:30', 207);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (173, '2026-03-24 18:05:44.111521+05:30', 208);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (174, '2026-03-24 18:10:31.767143+05:30', 209);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (175, '2026-03-24 20:44:08.703089+05:30', 210);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (176, '2026-03-24 20:46:14.995112+05:30', 211);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (177, '2026-03-24 20:52:01.093692+05:30', 212);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (178, '2026-03-25 08:24:54.543938+05:30', 213);
INSERT INTO public.token_blacklist_blacklistedtoken VALUES (179, '2026-04-04 13:56:11.658848+05:30', 220);


--
-- Data for Name: users_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: users_user_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: weekly_meal_plan; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.weekly_meal_plan VALUES (4, 0, 'lunch', 'veg', '[]', 200.00, '2026-03-21 11:30:40.422636+05:30');
INSERT INTO public.weekly_meal_plan VALUES (5, 0, 'lunch', 'nonveg', '[]', 200.00, '2026-03-21 11:30:40.422636+05:30');
INSERT INTO public.weekly_meal_plan VALUES (10, 1, 'lunch', 'veg', '[]', 200.00, '2026-03-21 11:30:40.422636+05:30');
INSERT INTO public.weekly_meal_plan VALUES (11, 1, 'lunch', 'nonveg', '[]', 200.00, '2026-03-21 11:30:40.422636+05:30');
INSERT INTO public.weekly_meal_plan VALUES (16, 2, 'lunch', 'veg', '[]', 200.00, '2026-03-21 11:30:40.422636+05:30');
INSERT INTO public.weekly_meal_plan VALUES (17, 2, 'lunch', 'nonveg', '[]', 200.00, '2026-03-21 11:30:40.422636+05:30');
INSERT INTO public.weekly_meal_plan VALUES (22, 3, 'lunch', 'veg', '[]', 200.00, '2026-03-21 11:30:40.422636+05:30');
INSERT INTO public.weekly_meal_plan VALUES (23, 3, 'lunch', 'nonveg', '[]', 200.00, '2026-03-21 11:30:40.422636+05:30');
INSERT INTO public.weekly_meal_plan VALUES (28, 4, 'lunch', 'veg', '[]', 200.00, '2026-03-21 11:30:40.422636+05:30');
INSERT INTO public.weekly_meal_plan VALUES (29, 4, 'lunch', 'nonveg', '[]', 200.00, '2026-03-21 11:30:40.422636+05:30');
INSERT INTO public.weekly_meal_plan VALUES (34, 5, 'lunch', 'veg', '[]', 200.00, '2026-03-21 11:30:40.422636+05:30');
INSERT INTO public.weekly_meal_plan VALUES (39, 6, 'lunch', 'veg', '[]', 200.00, '2026-03-21 11:30:40.422636+05:30');
INSERT INTO public.weekly_meal_plan VALUES (40, 6, 'lunch', 'nonveg', '[]', 200.00, '2026-03-21 11:30:40.422636+05:30');
INSERT INTO public.weekly_meal_plan VALUES (26, 4, 'breakfast', 'veg', '["Rice", "Dhal", "Vadai Curry", "Coconut Sambal "]', 200.00, '2026-03-21 22:55:14.901581+05:30');
INSERT INTO public.weekly_meal_plan VALUES (30, 4, 'dinner', 'veg', '["Rice", "Dhal", "Soya Curry", "Brinjal Stir-Fry"]', 200.00, '2026-03-21 22:55:54.576596+05:30');
INSERT INTO public.weekly_meal_plan VALUES (32, 5, 'breakfast', 'veg', '["Rice", "Dhal", "Brijal Curry", "Brijal"]', 200.00, '2026-03-21 22:57:20.316458+05:30');
INSERT INTO public.weekly_meal_plan VALUES (35, 5, 'dinner', 'veg', '["Rice", "Dhal", "Vegetable Curry", "Tomato Stir-Fry"]', 200.00, '2026-03-21 22:58:25.629619+05:30');
INSERT INTO public.weekly_meal_plan VALUES (37, 6, 'breakfast', 'veg', '["Rice", "Dhal", "Vegetable Curry", "ladies Finger Curry"]', 200.00, '2026-03-21 22:59:10.162609+05:30');
INSERT INTO public.weekly_meal_plan VALUES (41, 6, 'dinner', 'veg', '["Rice", "Dhal", "Vegetable Curry", "Potato Fry"]', 200.00, '2026-03-21 22:59:38.553377+05:30');
INSERT INTO public.weekly_meal_plan VALUES (3, 0, 'breakfast', 'nonveg', '["Rice", "Dhal", "Carrot Curry", "Egg Curry"]', 200.00, '2026-03-21 21:18:51.794826+05:30');
INSERT INTO public.weekly_meal_plan VALUES (7, 0, 'dinner', 'nonveg', '["Rice", "Dhal", "Beetroot Curry", "Anchovy Fry (Neththali)"]', 200.00, '2026-03-21 21:20:37.450845+05:30');
INSERT INTO public.weekly_meal_plan VALUES (9, 1, 'breakfast', 'nonveg', '["Rice", "Dhal", "Leeks Curry", "Maldive Fish Cocunut Sambal "]', 200.00, '2026-03-21 21:22:34.161082+05:30');
INSERT INTO public.weekly_meal_plan VALUES (13, 1, 'dinner', 'nonveg', '["Rice", "Dhal", "Beans Curry", "Anchovy & Dry Fish"]', 200.00, '2026-03-21 21:23:15.186134+05:30');
INSERT INTO public.weekly_meal_plan VALUES (19, 2, 'dinner', 'nonveg', '["Rice", "Dhal", "Fish Fry", "Vegetable Curry"]', 200.00, '2026-03-21 21:25:20.706021+05:30');
INSERT INTO public.weekly_meal_plan VALUES (21, 3, 'breakfast', 'nonveg', '["Rice", "Dhal", "Gotukola Curry", "Anchovy Fry"]', 200.00, '2026-03-21 21:26:34.921492+05:30');
INSERT INTO public.weekly_meal_plan VALUES (25, 3, 'dinner', 'nonveg', '["Rice", "Dhal", "Vegetable curry", "Sausages"]', 200.00, '2026-03-21 21:29:51.865967+05:30');
INSERT INTO public.weekly_meal_plan VALUES (31, 4, 'dinner', 'nonveg', '["Rice", "Dhal", "Soya Curry", "Dhal Curry"]', 200.00, '2026-03-21 21:30:25.622939+05:30');
INSERT INTO public.weekly_meal_plan VALUES (33, 5, 'breakfast', 'nonveg', '["Rice", "Dhal", "Dry Fish Curry", "Brinjal Curry "]', 200.00, '2026-03-21 21:31:33.808016+05:30');
INSERT INTO public.weekly_meal_plan VALUES (36, 5, 'dinner', 'nonveg', '["Rice", "Dhal", "Vegetable Curry", "Dhal Curry"]', 200.00, '2026-03-21 21:32:05.587685+05:30');
INSERT INTO public.weekly_meal_plan VALUES (38, 6, 'breakfast', 'nonveg', '["Rice", "Dhal", "Vegetable Curry", "Fish Curry"]', 200.00, '2026-03-21 21:33:02.165919+05:30');
INSERT INTO public.weekly_meal_plan VALUES (42, 6, 'dinner', 'nonveg', '["Rice", "Dhal", "Vegetable Curry", "Dry Fish"]', 200.00, '2026-03-21 21:33:41.202095+05:30');
INSERT INTO public.weekly_meal_plan VALUES (1, 5, 'lunch', 'nonveg', '["Rice", "Dhal", "Chicken", "Boiled Egg"]', 300.00, '2026-03-21 21:35:12.687412+05:30');
INSERT INTO public.weekly_meal_plan VALUES (2, 0, 'breakfast', 'veg', '["Rice", "Dhal", "Carrot Curry", "Potato Curry "]', 200.00, '2026-03-21 22:48:10.967689+05:30');
INSERT INTO public.weekly_meal_plan VALUES (6, 0, 'dinner', 'veg', '["Rice", "Dhal", "Beetroot Curry", "Potato Fry"]', 200.00, '2026-03-21 22:49:29.299314+05:30');
INSERT INTO public.weekly_meal_plan VALUES (8, 1, 'breakfast', 'veg', '["Rice", "Dhal", "Leeks Curry", "Tomato Curry"]', 200.00, '2026-03-21 22:50:07.303152+05:30');
INSERT INTO public.weekly_meal_plan VALUES (12, 1, 'dinner', 'veg', '["Rice", "Dhal", "Beans Curry", "Brinjal Fry"]', 200.00, '2026-03-21 22:50:45.225927+05:30');
INSERT INTO public.weekly_meal_plan VALUES (15, 2, 'breakfast', 'nonveg', '["Rice", "Dhal", "Cabbage Curry", "Anchovy Stir-Fry "]', 200.00, '2026-03-21 22:51:50.841711+05:30');
INSERT INTO public.weekly_meal_plan VALUES (14, 2, 'breakfast', 'veg', '["Rice", "Dhal", "Cabbage Curry", "Brinjal Stir-fry"]', 200.00, '2026-03-21 22:51:59.734542+05:30');
INSERT INTO public.weekly_meal_plan VALUES (27, 4, 'breakfast', 'nonveg', '["Rice", "Dhal", "Anchovy Stir-Fry", "Coconut Sambal "]', 200.00, '2026-03-21 22:52:06.622327+05:30');
INSERT INTO public.weekly_meal_plan VALUES (18, 2, 'dinner', 'veg', '["Rice", "Dhal", "Ladies Finger Fry", "Vegetable Curry"]', 200.00, '2026-03-21 22:52:59.789563+05:30');
INSERT INTO public.weekly_meal_plan VALUES (20, 3, 'breakfast', 'veg', '["Rice", "Dhal", "Gotukola Curry", "Fenugreek Curry"]', 200.00, '2026-03-21 22:53:45.789469+05:30');
INSERT INTO public.weekly_meal_plan VALUES (24, 3, 'dinner', 'veg', '["Rice", "Dhal", "Vegetable Curry", "Potato Stir-fry"]', 200.00, '2026-03-21 22:54:35.502109+05:30');


--
-- Name: auth_group_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auth_group_id_seq', 1, false);


--
-- Name: auth_group_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auth_group_permissions_id_seq', 1, false);


--
-- Name: auth_permission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auth_permission_id_seq', 108, true);


--
-- Name: authentication_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.authentication_role_id_seq', 3, true);


--
-- Name: bills_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bills_id_seq', 27, true);


--
-- Name: branches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.branches_id_seq', 1, false);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 18, true);


--
-- Name: django_admin_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.django_admin_log_id_seq', 1, false);


--
-- Name: django_content_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.django_content_type_id_seq', 27, true);


--
-- Name: django_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.django_migrations_id_seq', 58, true);


--
-- Name: events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.events_id_seq', 1, true);


--
-- Name: featured_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.featured_items_id_seq', 6, true);


--
-- Name: income_outcome_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.income_outcome_id_seq', 2, true);


--
-- Name: items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.items_id_seq', 132, true);


--
-- Name: meal_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.meal_orders_id_seq', 52, true);


--
-- Name: meal_packages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.meal_packages_id_seq', 14, true);


--
-- Name: meal_packages_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.meal_packages_items_id_seq', 78, true);


--
-- Name: meal_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.meal_types_id_seq', 2, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 23, true);


--
-- Name: partner_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.partner_transactions_id_seq', 1, false);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payments_id_seq', 18, true);


--
-- Name: pos_order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pos_order_items_id_seq', 39, true);


--
-- Name: pos_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pos_orders_id_seq', 13, true);


--
-- Name: students_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.students_id_seq', 4, true);


--
-- Name: suggestions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.suggestions_id_seq', 1, true);


--
-- Name: token_blacklist_blacklistedtoken_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.token_blacklist_blacklistedtoken_id_seq', 179, true);


--
-- Name: token_blacklist_outstandingtoken_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.token_blacklist_outstandingtoken_id_seq', 221, true);


--
-- Name: users_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_groups_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 9, true);


--
-- Name: users_user_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_permissions_id_seq', 1, false);


--
-- Name: weekly_meal_plan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.weekly_meal_plan_id_seq', 42, true);


--
-- PostgreSQL database dump complete
--

\unrestrict JUBA69thgzXwliutN2HWSJQmmRn9cnA3H1m0o2GHg4OxRchnZVVILkDc3jFhx7I

