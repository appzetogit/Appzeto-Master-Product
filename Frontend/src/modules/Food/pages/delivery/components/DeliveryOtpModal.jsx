import { Lock } from "lucide-react";
import BottomPopup from "@food/components/delivery/BottomPopup";

export default function DeliveryOtpModal({
  isOpen,
  otpLength,
  otpValue,
  otpError,
  otpInputRef,
  onClose,
  onChange,
  onPaste,
  onSubmit,
}) {
  return (
    <BottomPopup
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={false}
      closeOnBackdropClick={false}
      maxHeight="78vh"
      showHandle={false}
      disableSwipeToClose={true}
    >
      <div className="px-1 min-h-full flex flex-col">
        <div className="text-center mb-5">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-emerald-100 flex items-center justify-center">
            <Lock className="w-7 h-7 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Verify Delivery OTP</h3>
          <p className="text-sm text-gray-600 mt-1">
            Enter the {otpLength}-digit OTP from customer (or paste it)
          </p>
        </div>

        <div className="mb-4">
          <input
            ref={otpInputRef}
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            maxLength={otpLength}
            value={otpValue}
            onChange={onChange}
            onPaste={onPaste}
            onFocus={(e) => e.currentTarget.scrollIntoView({ block: "center", behavior: "smooth" })}
            placeholder={"0".repeat(Math.max(1, otpLength))}
            className="w-full h-14 rounded-xl border border-gray-300 text-center text-2xl font-bold text-gray-900 tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            aria-label="Delivery OTP"
          />
        </div>

        {otpError ? <p className="text-center text-sm text-red-500 mb-4">{otpError}</p> : null}

        <div className="mt-auto sticky bottom-0 bg-white pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-12 rounded-xl border border-gray-300 text-gray-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={String(otpValue || "").length !== otpLength}
              className="h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold"
            >
              Verify OTP
            </button>
          </div>
        </div>
      </div>
    </BottomPopup>
  );
}

