import React, { useState } from 'react'
import logo from "../assets/logo.jpg"
import { IoMdPerson } from "react-icons/io";
import { GiHamburgerMenu, GiSplitCross } from "react-icons/gi";
import { FaTachometerAlt } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { serverUrl } from '../App';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { setUserData } from '../redux/userSlice';
import { clearSessionHint } from '../utils/sessionHint';
import { clearAuthToken } from '../utils/authToken';

function Nav() {
  const [showHam, setShowHam] = useState(false)
  const [showPro, setShowPro] = useState(false)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { userData } = useSelector(state => state.user)

  const handleLogout = async () => {
    try {
      await axios.post(serverUrl + "/api/auth/logout", {}, { withCredentials: true })
      toast.success("LogOut Successfully")
    } catch (error) {
      // Fallback for older backend deployments that only support GET
      try {
        await axios.get(serverUrl + "/api/auth/logout", { withCredentials: true })
        toast.success("LogOut Successfully")
      } catch {
        console.log(error.response?.data?.message)
      }
    } finally {
      await dispatch(setUserData(null))
      clearSessionHint()
      clearAuthToken()
      navigate("/")
    }
  }

  return (
    <div>
      {/* Main Navigation Bar */}
      <div className='w-full h-[80px] fixed top-0 px-4 md:px-8 py-3 flex items-center justify-between bg-black bg-opacity-95 backdrop-blur-sm z-50 border-b-2 border-[#3B82F6] shadow-lg'>
        {/* Logo Section */}
        <div className='flex items-center gap-3 cursor-pointer' onClick={() => navigate("/")}>
          <img src={logo} className='w-14 h-14 rounded-lg border-2 border-[#3B82F6] shadow-lg' alt="Learnify Logo" />
          <div className='hidden md:block'>
            <span className='text-[#3B82F6] text-2xl font-bold block'>Learnify</span>
            <span className='text-white text-xs'>Learnify</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className='hidden lg:flex items-center justify-center gap-4'>
          {!userData ? (
            <IoMdPerson className='w-12 h-12 fill-[#3B82F6] cursor-pointer border-2 border-[#3B82F6] bg-black rounded-full p-2 hover:bg-[#3B82F6] hover:fill-black transition-all' onClick={() => setShowPro(prev => !prev)} />
          ) : (
            <div className='w-12 h-12 rounded-full text-white flex items-center justify-center text-xl font-bold border-2 border-[#3B82F6] bg-black cursor-pointer hover:border-[#2563EB] transition-all' onClick={() => setShowPro(prev => !prev)}>
              {userData.photoUrl ? (
                <img src={userData.photoUrl} className='w-full h-full rounded-full object-cover' alt="" />
              ) : (
                <span className='text-[#3B82F6]'>{userData?.name?.slice(0, 1).toUpperCase()}</span>
              )}
            </div>
          )}

          {userData?.role === "educator" && (
            <button
              className='px-6 py-2 bg-[#3B82F6] text-black font-semibold rounded-xl hover:bg-[#2563EB] transition-all shadow-md'
              onClick={() => navigate("/dashboard")}
            >
              Dashboard
            </button>
          )}
          {userData?.role === "admin" && (
            <button
              className='px-6 py-2 bg-[#3B82F6] text-black font-semibold rounded-xl hover:bg-[#2563EB] transition-all shadow-md'
              onClick={() => navigate("/admin/users")}
            >
              Admin Panel
            </button>
          )}
          {userData?.role === "student" && (
            <button
              className='px-6 py-2 bg-[#3B82F6] text-black font-semibold rounded-xl hover:bg-[#2563EB] transition-all shadow-md'
              onClick={() => navigate("/student-dashboard")}
            >
              Dashboard
            </button>
          )}

          {!userData && (
            <button
              className='px-6 py-2 border-2 border-[#3B82F6] text-[#3B82F6] font-semibold rounded-xl hover:bg-[#3B82F6] hover:text-black transition-all'
              onClick={() => navigate("/login")}
            >
              Login
            </button>
          )}
          {userData && (
            <button
              className='px-6 py-2 bg-[#3B82F6] text-black font-semibold rounded-xl hover:bg-[#2563EB] transition-all shadow-md'
              onClick={handleLogout}
            >
              Logout
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <GiHamburgerMenu
          className='w-8 h-8 lg:hidden fill-[#3B82F6] cursor-pointer hover:fill-[#2563EB] transition-colors'
          onClick={() => setShowHam(prev => !prev)}
        />
      </div>

      {/* Profile Dropdown (Desktop) - Only My Profile */}
      {showPro && userData && (
        <div className='absolute top-[90px] right-4 lg:right-8 z-50 bg-white rounded-2xl shadow-2xl border-2 border-[#3B82F6] p-4 min-w-[200px]'>
          <div className='space-y-2'>
            <button
              className='w-full text-left px-4 py-3 bg-black text-[#3B82F6] rounded-xl hover:bg-[#3B82F6] hover:text-black transition-all font-semibold flex items-center gap-2'
              onClick={() => { navigate("/profile"); setShowPro(false); }}
            >
              <IoMdPerson className='w-5 h-5' />
              My Profile
            </button>
          </div>
        </div>
      )}

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 w-full h-full bg-black bg-opacity-95 z-50 flex flex-col items-center justify-center gap-6 transition-transform duration-300 overflow-y-auto px-4 py-8 ${showHam ? "translate-x-0" : "translate-x-[-100%]"}`}>
        <GiSplitCross
          className='absolute top-6 right-6 w-10 h-10 fill-[#3B82F6] cursor-pointer hover:fill-[#2563EB]'
          onClick={() => setShowHam(prev => !prev)}
        />

        {!userData ? (
          <IoMdPerson className='w-16 h-16 fill-[#3B82F6] border-2 border-[#3B82F6] rounded-full p-3' />
        ) : (
          <div className='w-16 h-16 rounded-full text-white flex items-center justify-center text-2xl font-bold border-2 border-[#3B82F6] bg-black'>
            {userData.photoUrl ? (
              <img src={userData.photoUrl} className='w-full h-full rounded-full object-cover' alt="" />
            ) : (
              <span className='text-[#3B82F6]'>{userData?.name?.slice(0, 1).toUpperCase()}</span>
            )}
          </div>
        )}

        <div className='flex flex-col gap-4 w-full max-w-sm px-8'>
          {userData?.role === "educator" && (
            <button
              className='w-full px-6 py-4 bg-[#3B82F6] text-black font-bold rounded-xl hover:bg-[#2563EB] transition-all text-lg flex items-center justify-center gap-2'
              onClick={() => { navigate("/dashboard"); setShowHam(false); }}
            >
              <FaTachometerAlt className='w-5 h-5' />
              Dashboard
            </button>
          )}
          {userData?.role === "admin" && (
            <>
              <button
                className='w-full px-6 py-4 bg-[#3B82F6] text-black font-bold rounded-xl hover:bg-[#2563EB] transition-all text-lg flex items-center justify-center gap-2'
                onClick={() => { navigate("/admin/users"); setShowHam(false); }}
              >
                <FaTachometerAlt className='w-5 h-5' />
                Admin Users
              </button>
              <button
                className='w-full px-6 py-4 bg-[#3B82F6] text-black font-bold rounded-xl hover:bg-[#2563EB] transition-all text-lg flex items-center justify-center gap-2'
                onClick={() => { navigate("/admin/portal"); setShowHam(false); }}
              >
                <FaTachometerAlt className='w-5 h-5' />
                Admin Portal
              </button>
            </>
          )}
          {userData?.role === "student" && (
            <button
              className='w-full px-6 py-4 bg-[#3B82F6] text-black font-bold rounded-xl hover:bg-[#2563EB] transition-all text-lg flex items-center justify-center gap-2'
              onClick={() => { navigate("/student-dashboard"); setShowHam(false); }}
            >
              <FaTachometerAlt className='w-5 h-5' />
              Dashboard
            </button>
          )}
          {userData && (
            <button
              className='w-full px-6 py-4 bg-[#3B82F6] text-black font-bold rounded-xl hover:bg-[#2563EB] transition-all text-lg flex items-center justify-center gap-2'
              onClick={() => { navigate("/profile"); setShowHam(false); }}
            >
              <IoMdPerson className='w-5 h-5' />
              My Profile
            </button>
          )}
          {!userData ? (
            <button
              className='w-full px-6 py-4 border-2 border-[#3B82F6] text-[#3B82F6] font-bold rounded-xl hover:bg-[#3B82F6] hover:text-black transition-all text-lg'
              onClick={() => { navigate("/login"); setShowHam(false); }}
            >
              Login
            </button>
          ) : (
            <button
              className='w-full px-6 py-4 bg-[#3B82F6] text-black font-bold rounded-xl hover:bg-[#2563EB] transition-all text-lg'
              onClick={() => { handleLogout(); setShowHam(false); }}
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Nav
