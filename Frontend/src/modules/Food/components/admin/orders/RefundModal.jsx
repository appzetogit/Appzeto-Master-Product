import { useEffect, useState } from "react"
import { Wallet } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@food/components/ui/dialog"
import { Button } from "@food/components/ui/button"

export default function RefundModal({ isOpen, onOpenChange, order, onConfirm, isProcessing }) {
  const [refundAmount, setRefundAmount] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (order && isOpen) {
      setRefundAmount(String(order.totalAmount || 0))
      setError("")
    }
  }, [order, isOpen])

  const handleAmountChange = (e) => {
    const value = e.target.value
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setRefundAmount(value)
      setError("")
    }
  }

  const handleConfirm = () => {
    const amount = parseFloat(refundAmount)
    const maxAmount = order?.totalAmount || 0

    if (!refundAmount || refundAmount.trim() === "") {
      setError("Refund amount is required")
      return
    }

    if (Number.isNaN(amount) || amount <= 0) {
      setError("Please enter a valid refund amount")
      return
    }

    if (amount > maxAmount) {
      setError(`Refund amount cannot exceed ₹${maxAmount.toFixed(2)}`)
      return
    }

    onConfirm(amount)
  }

  const handleClose = () => {
    if (!isProcessing) {
      setRefundAmount("")
      setError("")
      onOpenChange(false)
    }
  }

  if (!order) return null

  const maxAmount = order.totalAmount || 0
  const isWalletPayment = order.paymentType === "Wallet" || order.payment?.method === "wallet"
  const isPartialOnlineRefund = order.refundPolicy?.allowPartialRefund

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Wallet className="w-5 h-5 text-purple-600" />
            {isWalletPayment ? "Wallet Refund" : "Refund"}
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Order ID: <span className="font-semibold">{order.orderId}</span>
            <span className="block mt-1">
              {isPartialOnlineRefund
                ? "User cancelled after 30 seconds, so you can choose a partial or full refund."
                : "This order is full-refund only."}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Refund Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
                ₹
              </span>
              <input
                type="text"
                value={refundAmount}
                onChange={handleAmountChange}
                placeholder="0.00"
                disabled={isProcessing}
                className={`w-full rounded-lg border-2 py-2.5 pl-8 pr-4 transition-colors focus:outline-none focus:ring-2 ${
                  error
                    ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                    : "border-slate-300 focus:border-purple-500 focus:ring-purple-200"
                } ${isProcessing ? "cursor-not-allowed bg-slate-100" : "bg-white"}`}
              />
            </div>
            {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
            <p className="text-xs text-slate-500">Maximum refundable amount: ₹{maxAmount.toFixed(2)}</p>
          </div>

          <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
            <p className="text-sm text-purple-800">
              <span className="font-semibold">Note:</span>{" "}
              {isWalletPayment
                ? "Wallet orders are refunded back to the customer's wallet."
                : "Online refunds go back to the customer's original payment method."}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isProcessing}
            className="px-4 py-2"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isProcessing || !refundAmount || parseFloat(refundAmount) <= 0}
            className="bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
          >
            {isProcessing ? "Processing..." : "Refund"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
