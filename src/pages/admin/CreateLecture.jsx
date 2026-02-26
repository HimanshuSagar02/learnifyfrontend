/* eslint-disable react-hooks/exhaustive-deps */
import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { FaArrowLeft, FaEdit, FaPlay, FaVideo, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { serverUrl } from '../../App';
import { ClipLoader } from 'react-spinners';
import { useDispatch, useSelector } from 'react-redux';
import { setLectureData } from '../../redux/lectureSlice';

function CreateLecture() {
    const navigate = useNavigate()
    const {courseId} = useParams()
    const [lectureTitle , setLectureTitle] = useState("")
    const [loading,setLoading] = useState(false)
    const [loadingLectures, setLoadingLectures] = useState(true)
    const [selectedVideo, setSelectedVideo] = useState(null)
    const dispatch = useDispatch()
    const {lectureData} = useSelector(state=>state.lecture)
    

    const createLectureHandler = async () => {
      setLoading(true)
      try {
        const result = await axios.post(serverUrl + `/api/course/createlecture/${courseId}` ,{lectureTitle} , {withCredentials:true})
        console.log(result.data)
      dispatch(setLectureData([...lectureData,result.data.lecture]))
        toast.success("Lecture Created")
        setLoading(false)
        setLectureTitle("")
        // Refresh lectures
        await fetchLectures()
      } catch (error) {
        console.log(error)
        toast.error(error.response?.data?.message || "Failed to create lecture")
        setLoading(false)
      }
    }

    const fetchLectures = async () => {
      setLoadingLectures(true)
      try {
        const result = await axios.get(serverUrl + `/api/course/getcourselecture/${courseId}`,{withCredentials:true})
        if (result.data && result.data.lectures) {
          dispatch(setLectureData(result.data.lectures))
        } else {
          dispatch(setLectureData([]))
        }
      } catch {
        dispatch(setLectureData([]))
      } finally {
        setLoadingLectures(false)
      }
    }

    useEffect(()=>{
      fetchLectures()
    },[courseId])

    const testVideoUrl = async (videoUrl) => {
      if (!videoUrl) {
        toast.error("No video URL available")
        return
      }
      setSelectedVideo(videoUrl)
      toast.info("Testing video playback...")
    }

   
  
  return (
     <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow-xl rounded-xl p-6 mb-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-800 mb-1">Manage Lectures</h1>
            <p className="text-sm text-gray-500">Create and manage your video lectures. Test video playback to ensure they're working correctly.</p>
          </div>

          {/* Input */}
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              placeholder="e.g. Introduction to Physics - Chapter 1"
              className="flex-1 border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              onChange={(e)=>setLectureTitle(e.target.value)}
              value={lectureTitle}
              onKeyPress={(e) => e.key === 'Enter' && createLectureHandler()}
            />
            <button className="px-5 py-2 rounded-md bg-black text-white hover:bg-gray-700 transition-all text-sm font-medium shadow" disabled={loading} onClick={createLectureHandler}>
             {loading?<ClipLoader size={20} color='white'/>: "+ Create Lecture"}
            </button>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-sm font-medium" onClick={()=>navigate(`/addcourses/${courseId}`)}>
              <FaArrowLeft /> Back to Course
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium" onClick={fetchLectures} disabled={loadingLectures}>
              {loadingLectures ? <ClipLoader size={16} color='white'/> : "🔄 Refresh Lectures"}
            </button>
          </div>
        </div>

        {/* Video Preview Section */}
        {selectedVideo && (
          <div className="bg-white shadow-xl rounded-xl p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Video Preview</h2>
              <button onClick={() => setSelectedVideo(null)} className="text-gray-500 hover:text-gray-700">
                <FaTimesCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video 
                src={selectedVideo} 
                controls 
                className="w-full h-full"
                onError={(e) => {
                  toast.error("Video failed to load. Please check the video URL.");
                  console.error("Video error:", e);
                }}
                onLoadedData={() => {
                  toast.success("Video loaded successfully!");
                }}
              >
                Your browser does not support the video tag.
              </video>
            </div>
            <p className="text-xs text-gray-500 mt-2 break-all">Video URL: {selectedVideo}</p>
          </div>
        )}

        {/* Lecture List */}
        <div className="bg-white shadow-xl rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              All Lectures ({lectureData?.length || 0})
            </h2>
            {loadingLectures && <ClipLoader size={20} />}
          </div>

          {loadingLectures ? (
            <div className="text-center py-8">
              <ClipLoader size={40} />
              <p className="text-gray-500 mt-2">Loading lectures...</p>
            </div>
          ) : lectureData && lectureData.length > 0 ? (
            <div className="space-y-4">
              {lectureData.map((lecture, index) => (
                <div key={lecture._id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-black text-white px-3 py-1 rounded-full text-xs font-semibold">
                          Lecture {index + 1}
                        </span>
                        {lecture.videoUrl ? (
                          <span className="flex items-center gap-1 text-green-600 text-xs">
                            <FaCheckCircle /> Video Uploaded
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600 text-xs">
                            <FaTimesCircle /> No Video
                          </span>
                        )}
                        {lecture.isPreviewFree && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            Free Preview
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-800 mb-2">
                        {lecture.lectureTitle || "Untitled Lecture"}
                      </h3>
                      {lecture.videoUrl && (
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => testVideoUrl(lecture.videoUrl)}
                            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-700 text-sm transition-all"
                          >
                            <FaPlay /> Test Video Playback
                          </button>
                          <a
                            href={lecture.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm transition-all"
                          >
                            <FaVideo /> Open in New Tab
                          </a>
                        </div>
                      )}
                      {lecture.videoUrl && (
                        <p className="text-xs text-gray-500 mt-2 break-all">
                          URL: {lecture.videoUrl.substring(0, 80)}...
                        </p>
                      )}
                    </div>
                    <button
                      onClick={()=>navigate(`/editlecture/${courseId}/${lecture._id}`)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm transition-all"
                    >
                      <FaEdit /> Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FaVideo className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No lectures created yet. Create your first lecture above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
    
  )
}

export default CreateLecture
