---
name: Referral & Earn System
overview: Implement admin-controlled referral rewards for Food User and Delivery Partner, integrated into existing OTP/registration + wallet/pocket flows without changing folder structure or refactoring working systems.
todos:
  - id: backend-admin-referral-settings
    content: Add `FoodReferralSettings` model + admin GET/PUT endpoints + public GET endpoint in landing routes.
    status: completed
  - id: backend-referral-log-and-models
    content: Extend `FoodUser` + `FoodDeliveryPartner` with referral fields; add `ReferralLog` model with uniqueness constraints.
    status: completed
  - id: backend-crediting-logic
    content: Implement user credit-on-creation in `verifyUserOtpAndLogin`; implement delivery credit-on-approval via existing admin approval flow; credit using existing wallet/bonus transaction systems.
    status: completed
  - id: backend-referral-stats
    content: Add user + delivery referral stats endpoints returning counts, earnings, and current reward amount.
    status: completed
  - id: frontend-ref-capture
    content: Capture `ref` from URL during user login and delivery signup; pass through to backend via existing request shapes.
    status: completed
  - id: frontend-profile-ui
    content: Replace referral UI inside `Profile.jsx` and `delivery/ProfilePage.jsx` with single Share button + dynamic ₹X from backend; remove navigation to old referral pages.
    status: completed
isProject: false
---

## Architecture fit (what exists today)

- **User “registration”** happens inside OTP verify: `Backend/src/core/auth/auth.service.js` (`verifyUserOtpAndLogin`) creates `FoodUser` if not found.
- **Delivery Partner registration** is explicit: `POST /food/delivery/register` handled by `Backend/src/modules/food/delivery/`* and partner is later **approved by admin**.
- **User wallet** is `Backend/src/modules/food/user/models/userWallet.model.js` + `.../services/userWallet.service.js`.
- **Delivery “pocket balance”** is computed from `DeliveryBonusTransaction` totals in `Backend/src/modules/food/delivery/services/delivery.service.js` (no separate pocket table).
- **Admin settings pattern** already exists (e.g. fee settings): `Backend/src/modules/food/admin/models/*.model.js` + `admin.service.js` + `admin.controller.js` + `admin.routes.js`.

## Data model changes (extend only)

- **User model**: extend `Backend/src/core/users/user.model.js` to add:
  - `referredBy: ObjectId?` (ref to `FoodUser`)
  - `referralCount: number` (default 0)
  - keep existing `referralCode` (populate automatically)
- **Delivery partner model**: extend `Backend/src/modules/food/delivery/models/deliveryPartner.model.js` to add:
  - `referralCode: string`
  - `referredBy: ObjectId?` (ref to `FoodDeliveryPartner`)
  - `referralCount: number` (default 0)
- **Referral log** (new collection, naming consistent with admin models):
  - add `Backend/src/modules/food/admin/models/referralLog.model.js` with fields:
    - `referrerId` (ObjectId)
    - `refereeId` (ObjectId)
    - `role` (`USER` | `DELIVERY_PARTNER`)
    - `rewardAmount` (number)
    - `status` (`pending` | `credited` | `rejected`)
    - unique compound index on `(refereeId, role)` to prevent duplicate credit

## Admin-controlled referral settings

- Add model `Backend/src/modules/food/admin/models/referralSettings.model.js`:
  - `referralRewardUser`, `referralRewardDelivery`, `referralLimitUser`, `referralLimitDelivery`, `isActive` (+ timestamps)
  - pattern same as `FoodFeeSettings`.
- Add admin service methods in `Backend/src/modules/food/admin/services/admin.service.js`:
  - `getReferralSettings()` (latest active)
  - `createOrUpdateReferralSettings(body)` (upsert / create newest active)
- Add admin controller endpoints in `Backend/src/modules/food/admin/controllers/admin.controller.js` and routes in `Backend/src/modules/food/admin/routes/admin.routes.js`:
  - `GET /food/admin/referral-settings`
  - `PUT /food/admin/referral-settings`
- Add **public** endpoint (no auth) inside existing landing public router `Backend/src/modules/food/landing/routes/landing.routes.js`:
  - `GET /food/referral-settings` (used by profile UIs to show ₹X)

## Referral awarding logic (per your selections)

### User (credit **immediately on successful OTP when new user is created**)

- Frontend captures `ref` query param and passes it into OTP verify request.
- Backend flow:
  - Extend `Backend/src/dtos/auth/userOtpVerify.dto.js` to accept optional `ref`.
  - Update `Backend/src/core/auth/auth.controller.js` to read `ref` and pass into `verifyUserOtpAndLogin(phone, otp, ref)`.
  - In `verifyUserOtpAndLogin` (only when `FoodUser` is newly created):
    - validate `ref` is a valid ObjectId of an existing `FoodUser` and not self.
    - load admin referral settings to get `referralRewardUser` and `referralLimitUser`.
    - enforce limit using referrer’s `referralCount` (and/or count credited logs).
    - create a `ReferralLog` record (status `credited` if success; `rejected` otherwise).
    - credit referrer’s wallet using existing wallet collection:
      - add a small helper in `Backend/src/modules/food/user/services/userWallet.service.js` (e.g. `creditReferralReward(userId, amount, metadata)`) that:
        - ensures wallet
        - increments `balance` and `referralEarnings`
        - pushes a normal `transactions` item (`type: 'addition'`, `description: 'Referral reward'`, metadata with refereeId/logId)
    - increment referrer `referralCount` atomically.

### Delivery Partner (credit **when admin approves partner**)

- Frontend captures `ref` and includes it in the existing `FormData` for `deliveryAPI.register`.
- Backend flow:
  - Extend `Backend/src/modules/food/delivery/validators/delivery.validator.js` register schema to accept optional `ref`.
  - In `Backend/src/modules/food/delivery/services/delivery.service.js` `registerDeliveryPartner(payload, files)`:
    - if `ref` present and valid: set `referredBy` on partner (do not credit yet), and set/ensure `referralCode`.
  - On approval path in `Backend/src/modules/food/admin/controllers/admin.controller.js` (the existing approve delivery partner handler):
    - if partner has `referredBy` and not already credited (check `ReferralLog` unique for this refereeId+role):
      - load referral settings (`referralRewardDelivery`, `referralLimitDelivery`)
      - enforce limit via referrer partner’s `referralCount`
      - create `DeliveryBonusTransaction` with `amount=reward`, `reference='Referral bonus'` (this automatically affects pocket balance)
      - create `ReferralLog` status `credited`
      - increment referrer `referralCount`

## API for referral stats (profile screens)

- Add authenticated endpoints:
  - `GET /food/user/referrals/stats` (in `Backend/src/modules/food/user/routes/user.routes.js` + controller/service file in same module)
  - `GET /food/delivery/referrals/stats` (in `Backend/src/modules/food/delivery/routes/delivery.routes.js` + controller/service file in same module)
- Stats payload:
  - `referralCount` (from model)
  - `totalReferralEarnings` (User from wallet.referralEarnings; Delivery from sum of `DeliveryBonusTransaction` where reference contains referral OR from referral logs)
  - `rewardAmount` (from referral settings)

## Frontend integration (NO new pages)

### Capture `ref` param during registration

- **User**: in `Frontend/src/modules/Food/pages/user/auth/SignIn.jsx` read `ref` from URL and store in `sessionStorage.userAuthData.referralCode` before navigating to OTP.
- Update `Frontend/src/services/api/index.js` `authAPI.verifyOTP(...)` to actually send `ref` in request body to backend (currently it ignores `_referralCode`).
- **Delivery**: in `Frontend/src/modules/Food/pages/delivery/auth/Signup.jsx` (and/or `SignupStep1.jsx`) read `ref` from URL and store into `sessionStorage.deliverySignupDetails.ref` so `SignupStep2.jsx` appends it into `FormData`.

### Replace referral UI inside profiles

- **User profile**: `Frontend/src/modules/Food/pages/user/profile/Profile.jsx`
  - remove referral code copy UI
  - add a single “Share & Earn ₹X” button
  - fetch `GET /food/referral-settings` (public) + `GET /food/user/referrals/stats` (auth) to show dynamic values
  - share link format: `${origin}/food/user/auth/login?ref=<userId_or_referralCode>` (per your choice)
- **Delivery profile**: `Frontend/src/modules/Food/pages/delivery/ProfilePage.jsx`
  - replace current card that navigates to `/food/delivery/refer-and-earn` with inline share button
  - show dynamic reward amount from backend
  - share link format: `${origin}/food/delivery/signup?ref=<deliveryPartnerId_or_referralCode>` (keep within existing routing)
- De-emphasize existing old referral pages by removing profile navigation links to them (routes can remain to avoid breaking deep links).

## Validation & security

- Validate `ref`:
  - must be valid ObjectId
  - must exist for correct role
  - must not equal newly created user/partner id
- Prevent duplicates:
  - `ReferralLog` unique `(refereeId, role)` ensures one credit per account.
- Prevent limit abuse:
  - check `referralCount < referralLimit`* before credit

## Test plan (manual)

- User referral:
  - open `.../food/user/auth/login?ref=<existingUserId>` → login new number → verify referrer wallet increases and stats update.
  - self-referral attempt rejected.
  - limit enforcement stops further credits.
- Delivery referral:
  - open `.../food/delivery/signup?ref=<existingPartnerId>` → register new partner → admin approve → pocket balance increases for referrer (via `DeliveryBonusTransaction`).
- Admin settings:
  - set rewards/limits in admin → profile screens reflect updated ₹X.

