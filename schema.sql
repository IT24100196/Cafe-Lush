-- ============================================================
-- ShanthaCafe: Hotel POS, Student Meal Ordering & Event Mgmt
-- ============================================================

-- 1. roles
CREATE TABLE roles (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- 2. users
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    role_id       INT          NOT NULL REFERENCES roles(id),
    username      VARCHAR(100) NOT NULL UNIQUE,
    password_hash TEXT         NOT NULL,
    email         VARCHAR(150) UNIQUE,
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_role_id   ON users(role_id);
CREATE INDEX idx_users_is_active ON users(is_active);

-- 3. students
CREATE TABLE students (
    id           SERIAL PRIMARY KEY,
    user_id      INT         REFERENCES users(id),
    student_code VARCHAR(50) NOT NULL UNIQUE,
    full_name    VARCHAR(150) NOT NULL,
    contact      VARCHAR(50)
);
CREATE INDEX idx_students_user_id ON students(user_id);

-- 4. branches
CREATE TABLE branches (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    address         TEXT,
    contact         VARCHAR(50),
    is_partner      BOOLEAN        NOT NULL DEFAULT FALSE,
    commission_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00
);
CREATE INDEX idx_branches_is_partner ON branches(is_partner);

-- 5. categories
CREATE TABLE categories (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- 6. items
CREATE TABLE items (
    id           SERIAL PRIMARY KEY,
    category_id  INT           NOT NULL REFERENCES categories(id),
    name         VARCHAR(150)  NOT NULL,
    price        NUMERIC(10,2) NOT NULL,
    is_available BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_items_category_id  ON items(category_id);
CREATE INDEX idx_items_is_available ON items(is_available);

-- 7. meal_types
CREATE TABLE meal_types (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    cutoff_time TIME         NOT NULL
);

-- 8. meal_orders
CREATE TABLE meal_orders (
    id           SERIAL PRIMARY KEY,
    student_id   INT         NOT NULL REFERENCES students(id),
    meal_type_id INT         NOT NULL REFERENCES meal_types(id),
    order_date   DATE        NOT NULL DEFAULT CURRENT_DATE,
    status       VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_meal_orders_student_id   ON meal_orders(student_id);
CREATE INDEX idx_meal_orders_meal_type_id ON meal_orders(meal_type_id);
CREATE INDEX idx_meal_orders_status       ON meal_orders(status);

-- 9. pos_orders
CREATE TABLE pos_orders (
    id           SERIAL PRIMARY KEY,
    cashier_id   INT           NOT NULL REFERENCES users(id),
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    status       VARCHAR(50)   NOT NULL DEFAULT 'open',
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_pos_orders_cashier_id ON pos_orders(cashier_id);
CREATE INDEX idx_pos_orders_status     ON pos_orders(status);

-- 10. pos_order_items
CREATE TABLE pos_order_items (
    id           SERIAL PRIMARY KEY,
    pos_order_id INT           NOT NULL REFERENCES pos_orders(id),
    item_id      INT           NOT NULL REFERENCES items(id),
    quantity     INT           NOT NULL DEFAULT 1,
    unit_price   NUMERIC(10,2) NOT NULL
);
CREATE INDEX idx_pos_order_items_pos_order_id ON pos_order_items(pos_order_id);
CREATE INDEX idx_pos_order_items_item_id      ON pos_order_items(item_id);

-- 11. events
CREATE TABLE events (
    id                 SERIAL PRIMARY KEY,
    name               VARCHAR(200) NOT NULL,
    customer_name      VARCHAR(150) NOT NULL,
    customer_contact   VARCHAR(50),
    event_date         DATE         NOT NULL,
    venue              TEXT,
    assigned_branch_id INT          REFERENCES branches(id),
    total_amount       NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    status             VARCHAR(50)   NOT NULL DEFAULT 'inquiry',
    created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_events_assigned_branch_id ON events(assigned_branch_id);
CREATE INDEX idx_events_status             ON events(status);

-- 12. payments
CREATE TABLE payments (
    id             SERIAL PRIMARY KEY,
    reference_type VARCHAR(20)   NOT NULL CHECK (reference_type IN ('meal', 'pos', 'event')),
    reference_id   INT           NOT NULL,
    amount         NUMERIC(10,2) NOT NULL,
    payment_date   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_payments_reference ON payments(reference_type, reference_id);

-- 13. partner_transactions
CREATE TABLE partner_transactions (
    id                SERIAL PRIMARY KEY,
    branch_id         INT           NOT NULL REFERENCES branches(id),
    event_id          INT           NOT NULL REFERENCES events(id),
    commission_amount NUMERIC(10,2) NOT NULL,
    status            VARCHAR(50)   NOT NULL DEFAULT 'pending',
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_partner_transactions_branch_id ON partner_transactions(branch_id);
CREATE INDEX idx_partner_transactions_event_id  ON partner_transactions(event_id);
CREATE INDEX idx_partner_transactions_status    ON partner_transactions(status);
