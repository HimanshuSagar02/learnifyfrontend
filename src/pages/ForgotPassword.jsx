import axios from 'axios'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipLoader } from 'react-spinners'
import { serverUrl } from '../App'
import { toast } from 'react-toastify'

function ForgotPassword() {
    let navigate = useNavigate()
    const [step,setStep] = useState(1)
    const [email,setEmail] = useState("")
    const [otp,setOtp] = useState("")
    const [loading,setLoading]= useState(false)
    const [newpassword,setNewPassword]= useState("")
    const [conPassword,setConpassword]= useState("")

   const handleStep1 = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    
    setLoading(true)
    try {
      console.log("[ForgotPassword] Sending OTP to:", email);
      const result = await axios.post(`${serverUrl}/api/auth/sendotp`, {email}, {withCredentials: true})
      console.log("[ForgotPassword] OTP response:", result.data);
      
      // Check if OTP is in response (development mode)
      if (result.data.otp) {
        console.log(`[ForgotPassword] Development mode - OTP received: ${result.data.otp}`);
        toast.success(`OTP: ${result.data.otp} (Development mode - check console)`, {
          autoClose: 10000
        });
      } else {
        toast.success(result.data.message || "OTP sent successfully to your email");
      }
      
      setStep(2)
      setLoading(false)
      
    } catch (error) {
      console.error("[ForgotPassword] Error sending OTP:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to send OTP. Please try again.";
      toast.error(errorMessage);
      setLoading(false)
    }
    
   }
    const handleStep2 = async () => {
    if (!otp || otp.length !== 4) {
      toast.error("Please enter a valid 4-digit OTP");
      return;
    }
    
    setLoading(true)
    try {
      console.log("[ForgotPassword] Verifying OTP for:", email);
      const result = await axios.post(`${serverUrl}/api/auth/verifyotp`, {email, otp}, {withCredentials: true})
      console.log("[ForgotPassword] OTP verified successfully:", result.data);
      
      toast.success(result.data.message || "OTP verified successfully")
      setLoading(false)
      setStep(3)
    } catch (error) {
      console.error("[ForgotPassword] Error verifying OTP:", error);
      const errorMessage = error.response?.data?.message || error.message || "Invalid OTP. Please try again.";
      toast.error(errorMessage);
      setLoading(false)
    }
    
   }
    const handleStep3 = async () => {
    if(!newpassword || !conPassword){
      toast.error("Please enter both password fields")
      return
    }
    if(newpassword.length < 8){
      toast.error("Password must be at least 8 characters")
      return
    }
    if(newpassword !== conPassword){
      toast.error("Passwords do not match")
      return
    }
    
    setLoading(true)
    try {
      console.log("[ForgotPassword] Resetting password for:", email);
      const result = await axios.post(`${serverUrl}/api/auth/resetpassword`, {email, password: newpassword}, {withCredentials: true})
      console.log("[ForgotPassword] Password reset successfully:", result.data);
      toast.success(result.data.message || "Password reset successfully")
      setLoading(false)
      
      // Small delay before navigation
      setTimeout(() => {
        navigate("/login")
      }, 1000);
    } catch (error) {
      console.error("[ForgotPassword] Error resetting password:", error);
      const errorMessage = error?.response?.data?.message || error.message || "Failed to reset password. Please try again.";
      toast.error(errorMessage);
      setLoading(false)
    }
    
   }


  return (
     <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
     { step==1 && <div className="bg-white shadow-md rounded-xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Forgot Your Password?
        </h2>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleStep1();
            }}
          >
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Enter your email address
              </label>
              <input
                type="email"
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[black]"
                placeholder="you@example.com"
                onChange={(e)=>setEmail(e.target.value)}

                value={email}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[black] hover:bg-[#4b4b4b] text-white py-2 px-4 rounded-md font-medium cursor-pointer" disabled={loading}
            >
              {loading?<ClipLoader size={30} color='white'/>:"Send OTP"}
            </button>
          </form>
        

        <div className="text-sm text-center mt-4" onClick={()=>navigate("/login")} >
        
            Back to Login
        
        </div>
      </div>}


      {step==2 && <div className="bg-white shadow-lg rounded-xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
          Enter OTP
        </h2>
      

        {/* OTP Inputs */}
        
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleStep2();
            }}
          >
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Please enter the 4-digit code sent to your email.
              </label>
              <input
                type="text"
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[black]"
                placeholder="Enter 4-digit OTP"
                onChange={(e)=>{
                  const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setOtp(value);
                }}
                value={otp}
                maxLength={4}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[black] hover:bg-[#4b4b4b] text-white py-2 px-4 rounded-md font-medium cursor-pointer" disabled={loading} 
            >
              {loading?<ClipLoader size={30} color='white'/>:"Verify OTP"}
            </button>
          </form>
        

        <div className="text-sm text-center mt-4" onClick={()=>navigate("/login")} >
        
            Back to Login
        
        </div>
       

      

      </div>}
      {step==3 &&   <div className="bg-white shadow-lg rounded-xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
          Reset Your Password
        </h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Enter a new password below to regain access to your account.
        </p>

        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            handleStep3();
          }}
        >
          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" >
              New Password
            </label>
            <input
              type="password"
              placeholder="Enter new password"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[black] focus:outline-none" onChange={(e)=>setNewPassword(e.target.value)}

                value={newpassword}
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              placeholder="Re-enter new password"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[black] focus:outline-none" onChange={(e)=>setConpassword(e.target.value)}

                value={conPassword}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-[black] hover:bg-[#4b4b4b] text-white py-2 rounded-md font-medium"
          >
            {loading?<ClipLoader size={30} color='white'/>:"Reset Password"}
          </button>
        </form>

        {/* Back to login */}
        <div className="text-center text-sm mt-4" onClick={()=>navigate("/login")}>
          
            Back to Login
          
        </div>
      </div>}
    </div>
  )
}

export default ForgotPassword
