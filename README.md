# 🤝 FairShare v10 — 100% Free Splitwise Alternative

> **Version 10.0.0 (v10) • Pure English Interface • Zero Cooldowns • Zero Subscription Paywalls • Zero API Costs • Mathematical Integer-Cent Precision**

FairShare is a modern, high-precision, zero-subscription group expense sharing and debt simplification platform. It directly solves the pain points of Splitwise (10-second wait penalties, 3-4 daily expense caps, $4.99/mo Pro paywalls for charts and receipt scanning).

---

## 🌟 Key Highlights & Killer Advantages

* **🚫 Zero Cooldown Penalty:** Log unlimited bills in seconds. No 10-second countdown timers or daily limits.
* **💰 Shared Kitty Pool:** An upfront group cash pool for quick chai, tea, snacks, and highway tolls so you don't clutter the ledger with micro-bills.
* **📊 Group & Trip Budget Tracker:** Set a spending limit per folder with a visual progress bar (Spent vs. Remaining Budget).
* **🍕 "Who Ate What?" Itemized Meal Claimer:** Tap dishes on a table to assign who ate what, with automated proportional sales tax and tip allocation to the exact cent.
* **📦 Things Borrowed Tracker:** Track physical items (Cameras, Car Keys, Camping Tents) with due dates and a 1-tap return checkoff.
* **🔒 Biometric & PIN App Lock:** 4-digit PIN security lock with numeric keypad and 1-tap Face ID / Touch ID simulator.
* **📄 Formal PDF Statement Generator:** Free alternative to Splitwise Pro ($4.99/mo) with clean A4 invoice styling (`@media print`), KPI meters, itemized history, and settlement instructions.
* **☁️ Persistent Offline Mode:** Full offline sync queue storing bills and settlements locally, automatically syncing on reconnection.
* **⚡ Simplify Debts Toggle:** Real-time switch between greedy Min-Cash-Flow graph reduction and raw bilateral pairwise debts.
* **🗑️ 1-Tap Undo & Trash Bin:** 7-second animated floating toast (`[↩️ Undo]`) plus an Activity Modal Trash Bin tab to restore any deleted expense anytime.
* **🎲 Coffee Roulette:** Randomly spins a wheel to pick one friend to pay today's coffee or round.
* **👁️ 1-Tap Privacy Mode:** Instantly masks all financial values with asterisks (`Rs ••••••`) in public.
* **📱 Progressive Web App (PWA):** Zero-download installable web app with standalone full-screen mode for iOS and Android homescreens.
* **🇵🇰 South Asian Lacs/Crores Support:** Full support for numbers up to 99 Lacs (Rs 99,00,000.00) with pure English interface.

---

## 📐 Mathematical Ledger Engine

All calculations are executed in integer-cents (`bigint` in TypeScript, `int` in Python) to mathematically prevent floating-point rounding errors ($0.01 drift).

1. **Greedy Min-Cash-Flow Graph Simplification:**
   Reduces $N$-person cyclical and transitive debt graphs to the minimum number of direct settlement transfers ($\le N-1$).
2. **Zero-Cent Drift Remainder Allocation:**
   When dividing amounts with odd cents (e.g. $100.00 split 3 ways), remainder cents are distributed deterministically so the sum of individual shares equals the total bill exactly.
3. **Proportional Dining Split:**
   Calculates each person's base food subtotal, then distributes sales tax and tips strictly proportional to their share of food.
4. **Direct 100% Loan Mode:**
   When friends fund a loan (e.g., Arslan contributes 4 Lac and Irfan contributes 6 Lac to Usman), the payers are credited their exact contributions and Usman is debited 100%, without any equal 3-way split leakage.

---

## 🧪 Automated Verification Suite

Run the automated mathematical test suite:

```bash
python tests/test_math_engine.py
```

All 8 verification suites run and pass with 100% precision:
* `[PASS]` 3-person transitive debt reduced from 2 transfers to 1 direct transfer.
* `[PASS]` 4-person complex loop resolved to single transfer.
* `[PASS]` 10000 cents split 3 ways: {'Alice': 3334, 'Bob': 3333, 'Charlie': 3333} (Sum: 10000).
* `[PASS]` Proportional dinner bill test passed: {'Alice': 4550, 'Bob': 1950} (Sum: 6500).
* `[PASS]` Direct loan settled directly: You pays Irfan 600k and Arslan 400k without any split leakage.
* `[PASS]` Folder isolation verified: Loan members isolated from Pizza members.
* `[PASS]` Simplify Debts toggle verified: Min-Cash-Flow reduces 2 hops to 1; Bilateral preserves both transfers.
* `[PASS]` Offline queue successfully replayed and flushed with zero ledger discrepancy.
* `[PASS]` Soft delete and restore invariance holds: Restoring deleted bill restores exact prior financial state.

---

## 🚀 Running the App

### 1. Instant In-Browser Run (Zero Setup)
Simply open [`preview.html`](preview.html) directly in any modern web browser (Chrome, Edge, Safari, Firefox).

### 2. Local PWA Server (Mobile Wi-Fi Testing)
Run the bundled zero-dependency local server:
```bash
python serve.py
```
Open the printed local IP URL (e.g. `http://192.168.1.X:8080/preview.html`) on your smartphone connected to the same Wi-Fi. In Safari or Chrome, tap **"Add to Home Screen"** to install FairShare as a native app!

### 3. React Native / Expo Native App
```bash
npm install
npx expo start
```

---

## 📁 Repository Structure

```
F:\Splitwise\
├── app/                              # React Native / Expo Router Screens
│   ├── (tabs)/
│   │   ├── _layout.tsx               # 4-Tab Navigation with elevated center Add button
│   │   ├── index.tsx                 # Main Dashboard, Status Card, Kitty Pool, Activity
│   │   └── balances.tsx              # Min-Cash-Flow Settle Up & Payment Deeplinks
│   ├── expense/
│   │   ├── add.tsx                   # 1-Step Bill Entry (99-Lac keypad, multi-payer)
│   │   └── who-ate.tsx               # Proportional Restaurant Dish Claimer
│   ├── charts.tsx                    # Free spending analytics & budget burn rates
│   └── join/[token].tsx              # Web guest join route with instant balance preview
├── assets/                           # High-resolution branding icons & splash screens
├── src/
│   ├── core/
│   │   ├── math/debt_simplifier.ts   # Core TypeScript integer-cent math engine
│   │   ├── notifications/nudge.ts    # Pre-composed WhatsApp statement alerts
│   │   ├── payments/deeplink.ts      # UPI, JazzCash, Venmo, Cash App deep-links
│   │   └── export/csvExporter.ts     # Client-side spreadsheet export
│   └── stores/useLedgerStore.ts      # Zustand state store with offline sync queue
├── supabase/
│   └── migrations/001_initial_schema.sql # Production PostgreSQL database schema with RLS
├── tests/
│   └── test_math_engine.py           # Automated Python verification test suite
├── manifest.json                     # PWA Web App Manifest
├── sw.js                             # PWA Offline Service Worker
├── serve.py                          # Zero-dependency local mobile Wi-Fi server
├── preview.html                      # Standalone, interactive HTML5/PWA application
└── package.json                      # Expo SDK 51 dependencies
```

---

## 📄 License
MIT License • 100% Open-Source • Built for frictionless, fair expense sharing.
