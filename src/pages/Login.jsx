import React, { useState } from 'react'
import logo from '../assets/logo.jpg'
import google from '../assets/google.jpg'
import axios from 'axios'
import { serverUrl } from '../App'
import { MdOutlineRemoveRedEye, MdRemoveRedEye } from "react-icons/md";
import { FaLock, FaEnvelope, FaGraduationCap, FaBook } from "react-icons/fa";
import { useNavigate } from 'react-router-dom'
import { signInWithPopup } from 'firebase/auth'
import { auth, provider } from '../../utils/Firebase'
import { toast } from 'react-toastify'
import { ClipLoader } from 'react-spinners'
import { useDispatch } from 'react-redux'
import { setUserData } from '../redux/userSlice'
import { clearSessionHint, markSessionHint } from '../utils/sessionHint'
import { extractAuthToken, extractAuthUser } from '../utils/authPayload'
import { clearAuthToken, setAuthToken } from '../utils/authToken'

function Login() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const navigate = useNavigate()
    const [show, setShow] = useState(false)
    const [loading, setLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const dispatch = useDispatch()
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
    const finalizeLogin = (user) => {
        dispatch(setUserData(user))
        markSessionHint()
        setTimeout(() => {
            navigate("/")
            toast.success("Login Successfully")
        }, 100)
    }
    const fetchSessionUserWithRetry = async (token = "", tries = 3) => {
        let lastPayload = null

        for (let attempt = 0; attempt < tries; attempt += 1) {
            const response = await axios.get(`${serverUrl}/api/user/currentuser`, {
                withCredentials: true,
                timeout: 10000,
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            })
            lastPayload = response.data

            const user = extractAuthUser(response.data)
            if (user) {
                return {
                    user,
                    token: extractAuthToken(response.data),
                    payload: response.data,
                }
            }

            // Some browsers/proxies apply Set-Cookie right after the first response cycle.
            if (attempt < tries - 1) {
                await wait(350)
            }
        }

        return { user: null, token: "", payload: lastPayload }
    }

    const handleLogin = async () => {
        if (!email.trim()) {
            toast.error("Email is required")
            return
        }
        if (!password.trim()) {
            toast.error("Password is required")
            return
        }

        setLoading(true)
        try {
            const result = await axios.post(
                `${serverUrl}/api/auth/login`,
                { email: email.trim(), password },
                { withCredentials: true }
            )
            const loginToken = extractAuthToken(result.data)
            if (loginToken) {
                setAuthToken(loginToken)
            }

            const directUser = extractAuthUser(result.data)
            if (directUser) {
                finalizeLogin(directUser)
                setLoading(false)
                return
            }

            // Fallback: some deployments return a success envelope without user data.
            const sessionResult = await fetchSessionUserWithRetry(loginToken, 3)
            const sessionUser = sessionResult.user

            if (sessionUser) {
                const sessionToken = sessionResult.token
                if (sessionToken) {
                    setAuthToken(sessionToken)
                }
                finalizeLogin(sessionUser)
                setLoading(false)
                return
            }

            if (import.meta.env.DEV) {
                console.error("[Login] Unexpected response payload", {
                    loginResponse: result.data,
                    currentUserResponse: sessionResult.payload,
                })
            }

            throw new Error(
                result?.data?.message ||
                sessionResult?.payload?.message ||
                "Login succeeded but user session was not created"
            )
        } catch (error) {
            setLoading(false)
            clearAuthToken()
            
            if (error.response) {
                const errorMessage = error.response.data?.message || error.response.data?.error || "Login failed"
                toast.error(errorMessage)
            } else if (error.request) {
                toast.error("Cannot connect to server. Please check your internet connection.")
            } else {
                toast.error(error.message || "Login failed. Please try again.")
            }
            clearSessionHint()
        }
    }

    const googleLogin = async () => {
        setGoogleLoading(true)
        try {
            if (!auth || !provider) {
                toast.error("Google sign-in is not configured. Please check browser console for details.")
                setGoogleLoading(false)
                return
            }
            
            const response = await signInWithPopup(auth, provider)
            
            let user = response.user
            let name = user.displayName || "User";
            let email = user.email
            let photoUrl = user.photoURL || ""
            
            if (!email) {
                toast.error("Email not provided by Google")
                setGoogleLoading(false)
                return
            }
            
            const result = await axios.post(serverUrl + "/api/auth/googlesignup", {
                name, 
                email, 
                photoUrl
            }, {withCredentials: true})
            const loginToken = extractAuthToken(result.data)
            if (loginToken) {
                setAuthToken(loginToken)
            }
            
            dispatch(setUserData(extractAuthUser(result.data) || result.data))
            markSessionHint()
            
            setTimeout(() => {
                navigate("/")
                toast.success("Login Successfully")
            }, 100);
            setGoogleLoading(false)
        } catch (error) {
            setGoogleLoading(false)
            clearSessionHint()
            clearAuthToken()
            
            if (error.code === 'auth/popup-closed-by-user') {
                toast.error("Sign-in popup was closed. Please try again.")
            } else if (error.code === 'auth/popup-blocked') {
                toast.error("Popup was blocked. Please allow popups for this site and try again.")
            } else if (error.code === 'auth/cancelled-popup-request') {
                return
            } else if (error.code === 'auth/operation-not-allowed') {
                toast.error("Google sign-in is not enabled. Please enable it in Firebase Console.")
            } else if (error.code === 'auth/unauthorized-domain') {
                toast.error("This domain is not authorized. Please add it to Firebase authorized domains.")
            } else if (error.code === 'auth/invalid-api-key') {
                toast.error("Invalid Firebase API key. Please check your Firebase configuration.")
            } else if (error.code === 'auth/network-request-failed') {
                toast.error("Network error. Please check your internet connection.")
            } else if (error.code) {
                toast.error(`Google sign-in error: ${error.message || error.code}`)
            } else if (error.response?.data?.message) {
                toast.error(error.response.data.message)
            } else {
                toast.error(`Google sign-in failed: ${error.message || "Please try again"}`)
            }
        }
    }

    return (
        <div className='min-h-screen w-full bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-3 sm:p-4'>
            <div className='w-full max-w-6xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row'>
                {/* Left Side - Form */}
                <div className='w-full md:w-[60%] p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col justify-center'>
                    {/* Header */}
                    <div className='mb-6 md:mb-8'>
                        <div className='flex items-center gap-2 sm:gap-3 mb-2'>
                            <div className='w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl overflow-hidden border border-gray-200 flex items-center justify-center bg-white'>
                                <img src={logo} alt="Learnify Logo" className='w-full h-full object-cover' />
                            </div>
                            <div>
                                <h1 className='text-2xl sm:text-3xl font-bold text-gray-900'>Welcome Back</h1>
                                <p className='text-sm sm:text-base text-gray-600'>Login to your Learnify technical account</p>
                            </div>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className='bg-gradient-to-r from-[#3B82F6] to-blue-100 border-2 border-[#3B82F6] rounded-xl p-4 mb-6'>
                        <div className='flex items-start gap-3'>
                            <FaBook className='text-[#3B82F6] text-xl mt-0.5 flex-shrink-0' />
                            <div>
                                <p className='font-bold text-gray-900 mb-1'>Learnify</p>
                                <p className='text-sm text-gray-700'>
                                    Built for <strong>technical learning</strong> across software development, data, AI and cloud domains.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <form 
                        className='space-y-5'
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleLogin();
                        }}
                    >
                        {/* Email */}
                        <div>
                            <label htmlFor="email" className='block text-sm font-semibold text-gray-700 mb-2'>
                                Email Address <span className='text-red-500'>*</span>
                            </label>
                            <div className='relative'>
                                <FaEnvelope className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400' />
                                <input 
                                    id='email' 
                                    name='email'
                                    type="email" 
                                    className='w-full h-12 pl-12 pr-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#3B82F6] transition-colors text-gray-900' 
                                    placeholder='your.email@example.com' 
                                    onChange={(e) => setEmail(e.target.value)} 
                                    value={email}
                                    autoComplete='email'
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className='block text-sm font-semibold text-gray-700 mb-2'>
                                Password <span className='text-red-500'>*</span>
                            </label>
                            <div className='relative'>
                                <FaLock className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400' />
                                <input 
                                    id='password' 
                                    name='password'
                                    type={show ? "text" : "password"} 
                                    className='w-full h-12 pl-12 pr-12 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#3B82F6] transition-colors text-gray-900' 
                                    placeholder='Enter your password' 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    value={password}
                                    autoComplete='current-password'
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShow(prev => !prev)}
                                    className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700'
                                >
                                    {show ? <MdRemoveRedEye className='w-5 h-5' /> : <MdOutlineRemoveRedEye className='w-5 h-5' />}
                                </button>
                            </div>
                        </div>

                        {/* Forgot Password */}
                        <div className='flex justify-end'>
                            <span 
                                className='text-sm text-gray-600 hover:text-[#3B82F6] cursor-pointer font-medium transition-colors' 
                                onClick={() => navigate("/forgotpassword")}
                            >
                                Forgot your password?
                            </span>
                        </div>
                    

                        {/* Submit Button */}
                        <button 
                            type='submit'
                            className='w-full h-12 bg-black text-[#3B82F6] font-bold rounded-xl hover:bg-gray-900 transition-all mt-6 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed' 
                            disabled={loading} 
                        >
                            {loading ? (
                                <>
                                    <ClipLoader size={20} color='#3B82F6' />
                                    <span>Logging in...</span>
                                </>
                            ) : (
                                "Login"
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className='flex items-center gap-4 my-6'>
                        <div className='flex-1 h-px bg-gray-300'></div>
                        <span className='text-sm text-gray-500'>Or continue with</span>
                        <div className='flex-1 h-px bg-gray-300'></div>
                    </div>

                    {/* Google Login */}
                    <button
                        type="button"
                        className='w-full h-12 border-2 border-gray-300 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                        onClick={googleLogin}
                        disabled={googleLoading}
                    >
                        {googleLoading ? (
                            <ClipLoader size={20} color='gray' />
                        ) : (
                            <>
                                <img src={google} alt="Google" className='w-6 h-6' />
                                <span className='text-gray-700 font-medium'>Sign in with Google</span>
                            </>
                        )}
                    </button>

                    {/* Sign Up Link */}
                    <p className='text-center mt-6 text-gray-600'>
                        Don't have an account?{' '}
                        <span 
                            className='text-black font-semibold hover:text-[#3B82F6] cursor-pointer underline underline-offset-2' 
                            onClick={() => navigate("/signup")}
                        >
                            Sign up here
                        </span>
                    </p>
                </div>

                {/* Right Side - Branding */}
                <div className='w-full md:w-[40%] bg-gradient-to-br from-black via-gray-900 to-black p-6 sm:p-8 md:p-12 flex flex-col items-center justify-center text-center relative overflow-hidden'>
                    {/* Decorative Elements */}
                    <div className='absolute top-0 right-0 w-32 h-32 md:w-64 md:h-64 bg-[#3B82F6] opacity-10 rounded-full blur-3xl'></div>
                    <div className='absolute bottom-0 left-0 w-32 h-32 md:w-64 md:h-64 bg-[#3B82F6] opacity-10 rounded-full blur-3xl'></div>
                    
                    <div className='relative z-10'>
                        <img src={logo} className='w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 mx-auto mb-4 md:mb-6 rounded-xl sm:rounded-2xl border-4 border-[#3B82F6] shadow-2xl' alt="Learnify Logo" />
                        <h2 className='text-3xl sm:text-4xl md:text-5xl font-bold text-[#3B82F6] mb-2 md:mb-3'>Learnify</h2>
                        <p className='text-base sm:text-lg md:text-xl text-white mb-4 md:mb-6 font-semibold'>Technical Learning Platform</p>
                        <div className='bg-black bg-opacity-50 rounded-2xl p-6 border border-[#3B82F6] border-opacity-30'>
                            <div className='flex items-center justify-center gap-2 mb-4'>
                                <FaGraduationCap className='text-[#3B82F6] text-2xl' />
                                <p className='text-white text-lg font-semibold'>Your Tech Journey Starts Here</p>
                            </div>
                            <p className='text-white text-sm leading-relaxed mb-4'>
                                Access guided courses for <strong className='text-[#3B82F6]'>Data Structures</strong>, <strong className='text-[#3B82F6]'>Web Development</strong>, AI and more.
                            </p>
                            <div className='flex flex-wrap gap-2 justify-center'>
                                <span className='px-3 py-1 bg-[#3B82F6] text-black rounded-full text-xs font-semibold'>Project-Based</span>
                                <span className='px-3 py-1 bg-[#3B82F6] text-black rounded-full text-xs font-semibold'>Mentor-Led</span>
                                <span className='px-3 py-1 bg-[#3B82F6] text-black rounded-full text-xs font-semibold'>Career-Focused</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login




