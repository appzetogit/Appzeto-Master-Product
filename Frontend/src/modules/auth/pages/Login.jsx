import React, { useState, useRef } from "react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { Phone, Lock, ArrowRight, ShieldCheck, Mail, Globe, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { authAPI } from "@food/api"
import { setAuthData } from "@food/utils/auth"

export default function UnifiedOTPFastLogin() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const navigate = useNavigate()
  const submitting = useRef(false)

  const normalizedPhone = () => {
    const digits = String(phoneNumber).replace(/\D/g, "").slice(-15)
    return digits.length >= 8 ? digits : ""
  }

  const handleSendOTP = async (e) => {
    e.preventDefault()
    const phone = normalizedPhone()
    if (phone.length < 8) {
      toast.error("Please enter a valid phone number (at least 8 digits)")
      return
    }
    if (submitting.current) return
    submitting.current = true
    setLoading(true)
    try {
      await authAPI.sendOTP(phoneNumber, "login", null)
      setOtpSent(true)
      setStep(2)
      toast.success("OTP sent! Check your phone.")
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to send OTP."
      toast.error(msg)
    } finally {
      setLoading(false)
      submitting.current = false
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    const phone = normalizedPhone()
    const otpDigits = String(otp).replace(/\D/g, "").slice(0, 4)
    if (otpDigits.length !== 4) {
      toast.error("Please enter the 4-digit OTP")
      return
    }
    if (submitting.current) return
    submitting.current = true
    setLoading(true)
    try {
      // Try to get FCM token before verifying OTP
      let fcmToken = null;
      let platform = "web";
      try {
        if (typeof window !== "undefined") {
          if (window.flutter_inappwebview) {
            platform = "mobile";
            const handlerNames = ["getFcmToken", "getFCMToken", "getPushToken", "getFirebaseToken"];
            for (const handlerName of handlerNames) {
              try {
                const t = await window.flutter_inappwebview.callHandler(handlerName, { module: "user" });
                if (t && typeof t === "string" && t.length > 20) {
                  fcmToken = t.trim();
                  break;
                }
              } catch (e) {}
            }
          } else {
            fcmToken = localStorage.getItem("fcm_web_registered_token_user") || null;
          }
        }
      } catch (e) {
        console.warn("Failed to get FCM token during login", e);
      }

      const response = await authAPI.verifyOTP(phoneNumber, otpDigits, "login", null, null, "user", null, null, fcmToken, platform)
      const data = response?.data?.data || response?.data || {}
      const accessToken = data.accessToken
      const refreshToken = data.refreshToken || null
      const user = data.user

      if (!accessToken || !user) {
        throw new Error("Invalid response from server")
      }

      setAuthData("user", accessToken, user, refreshToken)
      toast.success("Login successful!")
      navigate("/food/user", { replace: true })
    } catch (err) {
      const status = err?.response?.status
      let msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Invalid OTP. Please try again."
      if (status === 401) {
        if (/deactivat(ed|e)/i.test(String(msg))) {
          msg = "Your account is deactivated. Please contact support."
        } else {
          msg = "Invalid or expired code, or account not active."
        }
      }
      toast.error(msg)
    } finally {
      setLoading(false)
      submitting.current = false
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-[#EB590E]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-[440px] relative z-10"
      >
        {/* Branding */}
        <div className="text-center mb-8 md:mb-10 space-y-3">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-20 h-20 bg-white dark:bg-[#1a1a1a] rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-gray-200 dark:shadow-none border border-gray-100 dark:border-gray-800 p-2"
          >
            <div className="w-full h-full bg-gradient-to-br from-[#EB590E] to-[#FF8C00] rounded-xl flex items-center justify-center text-white font-black text-3xl shadow-inner">
              A
            </div>
          </motion.div>
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Access <span className="text-[#EB590E]">AppZeto</span>
            </h1>
            <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 font-medium">
              One secure login for all services
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-gray-800 p-6 sm:p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:shadow-none relative">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gray-50 dark:bg-gray-900">
            <motion.div
              layoutId="progress-bar"
              animate={{ width: step === 1 ? "50%" : "100%" }}
              className="h-full bg-gradient-to-r from-[#EB590E] to-[#FF8C00] shadow-[0_0_10px_rgba(235,89,14,0.3)]"
            />
          </div>

          <form onSubmit={step === 1 ? handleSendOTP : handleVerifyOTP} className="space-y-6 md:space-y-8">
            {step === 1 ? (
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Phone Number</label>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none border-r border-gray-100 dark:border-gray-800 pr-3">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">+91</span>
                    </div>
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                      maxLength={15}
                      className="block w-full pl-[4.5rem] pr-4 py-4 bg-gray-50 dark:bg-[#2a2a2a] border border-transparent focus:bg-white dark:focus:bg-[#1a1a1a] border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-[#EB590E]/20 focus:border-[#EB590E] transition-all outline-none placeholder:text-gray-400 text-gray-900 dark:text-white font-medium text-lg"
                      placeholder="Enter mobile number"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 px-1 text-gray-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#EB590E]" />
                  <p className="text-xs font-medium">We'll send a 6-digit verification code</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Verification Code</label>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-xs text-[#EB590E] font-bold hover:underline"
                    >
                      Change Number
                    </button>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-gray-300 group-focus-within:text-[#EB590E] transition-colors" />
                    </div>
                    <input
                      type="password"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      maxLength={4}
                      className="block w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-[#2a2a2a] border border-transparent focus:bg-white dark:focus:bg-[#1a1a1a] border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-[#EB590E]/20 focus:border-[#EB590E] transition-all outline-none placeholder:text-gray-400 tracking-[0.8em] text-gray-900 dark:text-white font-bold text-xl"
                      placeholder="••••"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-green-500 font-bold bg-green-50 dark:bg-green-900/10 py-2.5 px-4 rounded-xl">
                  <ShieldCheck className="w-4 h-4" />
                  Sent to +91 {phoneNumber}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all relative overflow-hidden shadow-lg shadow-[#EB590E]/20 ${
                loading
                  ? "bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-50"
                  : "bg-gradient-to-r from-[#EB590E] to-[#FF8C00] text-white hover:shadow-xl hover:shadow-[#EB590E]/30 active:scale-[0.98] hover:-translate-y-0.5"
              }`}
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  {step === 1 ? "Send OTP" : "Verify & Login"} <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Social login separator */}
          <div className="relative pt-4">
            <div className="absolute inset-0 flex items-center pt-4">
              <span className="w-full border-t border-gray-100 dark:border-gray-800" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-[0.2em]">
              <span className="bg-white dark:bg-[#1a1a1a] px-4 text-gray-400">
                or continue with
              </span>
            </div>
          </div>

          {/* Social buttons simplified */}
          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center h-12 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.14-4.53z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              </svg>
            </button>
            <button className="flex items-center justify-center h-12 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <Mail className="w-5 h-5 text-gray-400 group-hover:text-[#EB590E]" />
            </button>
          </div>

          <div className="pt-8 text-center">
            <p className="text-xs text-gray-400 leading-relaxed">
              By continuing, you agree to our <br />
              <button type="button" className="text-gray-900 dark:text-white font-bold hover:underline">Terms of Service</button> & <button type="button" className="text-gray-900 dark:text-white font-bold hover:underline">Privacy Policy</button>
            </p>
          </div>
        </div>

        {/* Support Link */}
        <div className="mt-8 text-center flex items-center justify-center gap-2 text-sm text-gray-500 font-medium">
           <Globe className="w-4 h-4" />
           English
           <span className="w-1.5 h-1.5 rounded-full bg-gray-200 dark:bg-gray-800" />
           Support
        </div>
      </motion.div>
    </div>
  )
}
