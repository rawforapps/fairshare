-- ============================================================================
-- FAIRSHARE DATABASE SCHEMA (Supabase / PostgreSQL)
-- Multi-Modal Auth (Phone OTP, Guest Sessions, QR Codes) & Expense Ledger
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
CREATE TYPE split_method AS ENUM ('EQUAL', 'EXACT', 'PERCENTAGE', 'SHARES', 'ADJUSTMENT');
CREATE TYPE expense_status AS ENUM ('ACTIVE', 'DELETED', 'SETTLED');
CREATE TYPE settlement_method AS ENUM ('CASH', 'VENMO', 'CASH_APP', 'UPI', 'REVOLUT', 'WISE', 'OTHER');

-- 3. PROFILES (Registered Users via Phone OTP)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_number TEXT UNIQUE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    default_currency VARCHAR(3) DEFAULT 'USD',
    payment_handles JSONB DEFAULT '{}'::jsonb, -- e.g. {"venmo": "@alice", "upi": "alice@okaxis", "cashtag": "$alice"}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. GUEST SESSIONS (Unauthenticated Users joining via Shared Link / QR Code)
CREATE TABLE guest_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id TEXT NOT NULL,
    display_name TEXT NOT NULL,
    claimed_by_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    claimed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. GROUPS
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    default_currency VARCHAR(3) DEFAULT 'USD',
    simplify_debts BOOLEAN DEFAULT TRUE,
    invite_token UUID DEFAULT uuid_generate_v4() UNIQUE,
    created_by_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. GROUP MEMBERS (Can be either a registered user or a guest)
CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    guest_session_id UUID REFERENCES guest_sessions(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'MEMBER' CHECK (role IN ('ADMIN', 'MEMBER')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT member_identity_check CHECK (
        (user_id IS NOT NULL AND guest_session_id IS NULL) OR
        (user_id IS NULL AND guest_session_id IS NOT NULL)
    ),
    CONSTRAINT unique_group_user UNIQUE NULLS NOT DISTINCT (group_id, user_id),
    CONSTRAINT unique_group_guest UNIQUE NULLS NOT DISTINCT (group_id, guest_session_id)
);

-- 7. EXPENSES
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    total_amount_cents BIGINT NOT NULL CHECK (total_amount_cents > 0), -- Stored in integer cents to prevent float rounding
    currency VARCHAR(3) DEFAULT 'USD',
    split_method split_method NOT NULL DEFAULT 'EQUAL',
    paid_by_member_id UUID NOT NULL REFERENCES group_members(id) ON DELETE RESTRICT,
    receipt_image_url TEXT,
    receipt_raw_json JSONB, -- Stored output from Gemini Vision AI
    notes TEXT,
    date TIMESTAMPTZ DEFAULT NOW(),
    status expense_status DEFAULT 'ACTIVE',
    created_by_member_id UUID NOT NULL REFERENCES group_members(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. EXPENSE SPLITS (Breakdown per participant)
CREATE TABLE expense_splits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES group_members(id) ON DELETE CASCADE,
    owed_amount_cents BIGINT NOT NULL CHECK (owed_amount_cents >= 0),
    share_numeric NUMERIC(10, 4), -- optional share multiplier or percentage for audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_expense_member UNIQUE (expense_id, member_id)
);

-- 9. SETTLEMENTS (Direct payments to resolve debts)
CREATE TABLE settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    payer_member_id UUID NOT NULL REFERENCES group_members(id),
    receiver_member_id UUID NOT NULL REFERENCES group_members(id),
    amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
    currency VARCHAR(3) DEFAULT 'USD',
    method settlement_method DEFAULT 'OTHER',
    proof_image_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. AUDIT LOG (Immutable change trail to prevent group disputes)
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    actor_member_id UUID REFERENCES group_members(id),
    action TEXT NOT NULL, -- 'EXPENSE_ADDED', 'EXPENSE_UPDATED', 'SETTLEMENT_RECORDED'
    details JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STORED PROCEDURE: CLAIM GUEST ACCOUNT ON PHONE OTP SIGNUP
-- Automatically binds all guest expenses and group memberships to registered user
-- ============================================================================
CREATE OR REPLACE FUNCTION claim_guest_history(
    p_guest_session_id UUID,
    p_user_id UUID
) RETURNS VOID AS $$
BEGIN
    -- 1. Mark guest session as claimed
    UPDATE guest_sessions
    SET claimed_by_user_id = p_user_id,
        claimed_at = NOW()
    WHERE id = p_guest_session_id AND claimed_by_user_id IS NULL;

    -- 2. Migrate group memberships
    UPDATE group_members
    SET user_id = p_user_id,
        guest_session_id = NULL
    WHERE guest_session_id = p_guest_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
