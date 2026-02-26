import React from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { FaArrowLeftLong } from "react-icons/fa6";

function Profile() {
  let {userData} = useSelector(state=>state.user)
  let navigate = useNavigate()

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-100 px-4 py-10 flex items-center justify-center">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100 px-4 py-10 flex items-center justify-center ">
      
      <div className="bg-white shadow-lg rounded-2xl p-5 sm:p-8 max-w-xl w-full relative">
        <FaArrowLeftLong  className='absolute top-5 left-5 w-[20px] h-[20px] sm:w-[22px] sm:h-[22px] cursor-pointer' onClick={()=>navigate("/")}/>
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center">
          {userData?.photoUrl ? <img
            src={userData?.photoUrl}
            alt=""
            className="w-24 h-24 rounded-full object-cover border-4 border-[black]"
          /> : <div className='w-24 h-24 rounded-full text-white flex items-center justify-center text-[30px] border-2 bg-black  border-white cursor-pointer'>
         {userData?.name?.slice(0,1).toUpperCase()}
          </div>}
          <h2 className="text-2xl font-bold mt-4 text-gray-800 break-words">{userData?.name}</h2>
          <p className="text-sm text-gray-500 capitalize">{userData?.role}</p>
        </div>

        {/* Profile Info */}
        <div className="mt-6 space-y-4">
          <div className="text-sm">
            <span className="font-semibold text-gray-700">Email: </span>
            <span className="break-all">{userData?.email}</span>
          </div>

          <div className="text-sm">
            <span className="font-semibold text-gray-700">Bio: </span>
            <span>{userData.description || "No bio available"}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-center gap-4">
          <button className="px-5 py-2 rounded bg-[black] text-white active:bg-[#4b4b4b] cursor-pointer transition" onClick={()=>navigate("/editprofile")}>
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  )
}

export default Profile
