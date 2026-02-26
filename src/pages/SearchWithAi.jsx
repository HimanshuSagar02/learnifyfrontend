import React, { useEffect, useRef, useState } from 'react'
import ai from "../assets/ai.png"
import ai1 from "../assets/SearchAi.png"
import { RiMicAiFill } from "react-icons/ri";
import axios from 'axios';
import { serverUrl } from '../App';
import { useNavigate } from 'react-router-dom';
import start from "../assets/start.mp3"
import { FaArrowLeftLong } from "react-icons/fa6";
import { toast } from 'react-toastify';
function SearchWithAi() {
  const [input, setInput] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [listening,setListening] = useState(false)
  const navigate = useNavigate();
  const startSoundRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    startSoundRef.current = new Audio(start);
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
      }
    }
  }, []);

  function speak(message) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    let utterance = new SpeechSynthesisUtterance(message);
    window.speechSynthesis.speak(utterance);
  }

  const handleSearch = async () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      toast.error("Voice search is not supported in this browser.");
      return;
    }
    setListening(true)
    if (startSoundRef.current) {
      startSoundRef.current.currentTime = 0;
      startSoundRef.current.play().catch(() => {});
    }
    recognition.start();
    recognition.onresult = async (e) => {
      const transcript = e.results[0][0].transcript.trim();
      setInput(transcript);
      await handleRecommendation(transcript);
    };
    recognition.onerror = () => {
      setListening(false);
      toast.error("Voice recognition failed. Please try typing.");
    };
  };

  const handleRecommendation = async (query) => {
    try {
      const result = await axios.post(`${serverUrl}/api/ai/search`, { input: query }, { withCredentials: true });
      setRecommendations(result.data);
      if(result.data.length>0){
 speak("These are the top courses I found for you")
      }else{
         speak("No courses found")
      }
     
      setListening(false)
    } catch (error) {
      setListening(false);
      toast.error(error?.response?.data?.message || "AI search failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:py-10 md:px-8">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-4 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
        >
          <FaArrowLeftLong className="w-4 h-4" />
          Back
        </button>

        <div className="bg-white shadow-xl rounded-2xl border border-gray-200 p-6 sm:p-8 relative">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <img src={ai} className="w-8 h-8 sm:w-9 sm:h-9" alt="AI" />
            Search with <span className="text-[#1E40AF]">AI</span>
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            Ask any topic and get relevant course recommendations instantly.
          </p>

          <div className="flex items-center rounded-xl border border-gray-300 bg-gray-100 shadow-sm relative">
            <input
              type="text"
              className="w-full px-4 py-3 pr-24 bg-transparent text-gray-900 placeholder-gray-500 focus:outline-none text-sm sm:text-base"
              placeholder="Try: 11th chemistry, NEET biology, JEE physics..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />

            {input && (
              <button
                type="button"
                onClick={() => handleRecommendation(input)}
                className="absolute right-14 sm:right-16 rounded-full w-9 h-9 flex items-center justify-center bg-black text-[#3B82F6] hover:bg-gray-900"
              >
                <img src={ai} className="w-5 h-5" alt="Search" />
              </button>
            )}

            <button
              type="button"
              className="absolute right-2 rounded-full w-9 h-9 flex items-center justify-center bg-black text-[#3B82F6] hover:bg-gray-900"
              onClick={handleSearch}
            >
              <RiMicAiFill className="w-5 h-5" />
            </button>
          </div>
        </div>

        {recommendations.length > 0 ? (
          <div className="mt-10">
            <h2 className="text-xl sm:text-2xl font-bold mb-5 text-gray-900 flex items-center gap-3">
              <img src={ai1} className="w-10 h-10 p-1 rounded-full" alt="AI Results" />
              AI Search Results
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {recommendations.map((course, index) => (
                <div
                  key={index}
                  className="bg-white p-5 rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 border border-gray-200 cursor-pointer hover:border-[#3B82F6]"
                  onClick={() => navigate(`/viewcourse/${course._id}`)}
                >
                  <h3 className="text-lg font-bold text-gray-900">{course.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{course.category}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border border-dashed border-gray-300 bg-white py-10 text-center text-gray-500">
            <h2 className="text-lg font-semibold text-gray-700">
              {listening ? "Listening..." : "No Courses Found"}
            </h2>
            <p className="mt-1 text-sm">
              {listening ? "Speak clearly near your microphone." : "Try searching with a different keyword."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchWithAi;
