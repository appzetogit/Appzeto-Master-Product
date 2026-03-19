import { AnimatePresence, motion } from "framer-motion";

export default function DeliveryRejectOrderModal({
  isOpen,
  rejectReasons,
  rejectReason,
  setRejectReason,
  onCancel,
  onConfirm,
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-120 bg-black/60 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
          >
            <motion.div
              className="w-[90%] max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Can't Accept Order</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Please select a reason for not accepting this order
                </p>
              </div>

              <div className="px-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  {rejectReasons.map((reason) => (
                    <button
                      key={reason}
                      onClick={() => setRejectReason(reason)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        rejectReason === reason
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{reason}</span>
                        {rejectReason === reason && (
                          <span className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs">
                            ✓
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-4 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex gap-3">
                  <button
                    onClick={onCancel}
                    className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onConfirm}
                    disabled={!rejectReason}
                    className="flex-1 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reject Order
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

