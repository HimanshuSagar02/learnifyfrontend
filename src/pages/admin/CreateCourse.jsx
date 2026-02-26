import axios from "axios";
import React, { useState } from "react";
import { FaArrowLeftLong } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import { serverUrl } from "../../App";
import { toast } from "react-toastify";
import { ClipLoader } from "react-spinners";
const CreateCourse = () => {
    let navigate = useNavigate()
    let [loading,setLoading]=useState(false)
    const [title,setTitle] = useState("")
    const [category,setCategory] = useState("")
    const [courseClass,setCourseClass] = useState("")
    const [subject,setSubject] = useState("")

    const CreateCourseHandler = async () => {
        if (!title.trim()) {
            toast.error("Course title is required")
            return
        }
        if (!category) {
            toast.error("Category is required")
            return
        }
        if (!courseClass) {
            toast.error("Class/Grade is required (9th, 10th, 11th, 12th, or NEET Dropper)")
            return
        }
        if (!subject.trim()) {
            toast.error("Subject is required")
            return
        }
        
        setLoading(true)
        try {
            const result = await axios.post(serverUrl + "/api/course/create" , {
                title, 
                category,
                class: courseClass,
                subject
            } , {withCredentials:true})
            console.log(result.data)
            toast.success("Course Created")
            navigate("/courses")
            setTitle("")
            setCategory("")
            setCourseClass("")
            setSubject("")
            setLoading(false)
        } catch (error) {
            console.log(error)
            setLoading(false)
            toast.error(error.response.data.message)
        }
        
    }

    return (
        
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-10">
            <div className="max-w-xl w-[600px] mx-auto p-6 bg-white shadow-md rounded-md mt-10 relative">
                <FaArrowLeftLong  className='top-[8%] absolute left-[5%] w-[22px] h-[22px] cursor-pointer' onClick={()=>navigate("/courses")}/>
                <h2 className="text-2xl font-semibold mb-6 text-center">Create Course</h2>

                <form className="space-y-5" onSubmit={(e)=>e.preventDefault()}>
                    {/* Course Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Course Title
                        </label>
                        <input
                            type="text"
                            placeholder="Enter course title"
                            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[black]"
                            onChange={(e)=>setTitle(e.target.value)} value={title}
                        />
                    </div>

                    {/* Class/Grade - Required */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Class/Grade <span className="text-red-500">*</span>
                        </label>
                        <select
                            className="w-full border border-gray-300 rounded-md px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[black]"
                            onChange={(e)=>setCourseClass(e.target.value)}
                            value={courseClass}
                            required
                        >
                            <option value="">Select class</option>
                            <option value="9th">9th Grade</option>
                            <option value="10th">10th Grade</option>
                            <option value="11th">11th Grade</option>
                            <option value="12th">12th Grade</option>
                            <option value="NEET Dropper">NEET Dropper</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Learnify courses are organized by class (9th-12th) and NEET Dropper</p>
                    </div>

                    {/* Subject - Required */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Subject <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="e.g., Physics, Chemistry, Biology, Mathematics, etc."
                            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[black]"
                            onChange={(e)=>setSubject(e.target.value)}
                            value={subject}
                            required
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category <span className="text-red-500">*</span>
                        </label>
                        <select
                            className="w-full border border-gray-300 rounded-md px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[black]"
                            onChange={(e)=>setCategory(e.target.value)}
                            value={category}
                            required
                        >
                            <option value="">Select category</option>
                            <option value="Physics">Physics</option>
                            <option value="Chemistry">Chemistry</option>
                            <option value="Biology">Biology</option>
                            <option value="Mathematics">Mathematics</option>
                            <option value="NEET Preparation">NEET Preparation</option>
                            <option value="JEE Preparation">JEE Preparation</option>
                            <option value="Board Exam Preparation">Board Exam Preparation</option>
                            <option value="Others">Others</option>
                        </select>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full bg-[black] text-white py-2 px-4 rounded-md active:bg-[#3a3a3a] transition" disabled={loading} onClick={CreateCourseHandler}
                    >
                        {loading?<ClipLoader size={30} color='white' /> : "Create"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateCourse;
