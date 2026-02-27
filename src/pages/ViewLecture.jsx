import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { serverUrl } from "../App";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { FaPlayCircle } from "react-icons/fa";
import { FaArrowLeftLong } from "react-icons/fa6";
import { GiAchievement } from "react-icons/gi";
import Confetti from "react-confetti";
import { useWindowSize } from "@uidotdev/usehooks";
import { toast } from "react-toastify";
import { getAxiosErrorMessage } from "../utils/blobError";

function ViewLecture() {
  const { courseId } = useParams();
  const { courseData } = useSelector((state) => state.course);
  const { userData } = useSelector((state) => state.user);

  const selectedCourse = courseData?.find((c) => c._id === courseId);
  const selectedCourseLectures = useMemo(() => selectedCourse?.lectures ?? [], [selectedCourse]);
  const [selectedLecture, setSelectedLecture] = useState(null);
  const videoRef = useRef(null);

  const [progress, setProgress] = useState(0);

  // dark mode
  const [dark, setDark] = useState(localStorage.getItem("theme") === "dark");
  useEffect(() => localStorage.setItem("theme", dark ? "dark" : "light"), [dark]);

  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState("");
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  useEffect(() => {
    if (!selectedCourseLectures.length) {
      setSelectedLecture(null);
      return;
    }

    setSelectedLecture((prevLecture) => {
      if (prevLecture && selectedCourseLectures.some((lecture) => lecture._id === prevLecture._id)) {
        return prevLecture;
      }
      return selectedCourseLectures[0];
    });
  }, [selectedCourseLectures]);

  const currentLectureIndex = selectedLecture
    ? selectedCourseLectures.findIndex((lecture) => lecture._id === selectedLecture._id)
    : -1;


  // congrats popup
  const [showCongrats, setShowCongrats] = useState(false);
  const { width, height } = useWindowSize();
  const navigate = useNavigate();
  const answeredCount = useMemo(() => Object.keys(quizAnswers).length, [quizAnswers]);
  const quizScore = useMemo(() => {
    if (!quizQuestions.length) return 0;
    return quizQuestions.reduce((score, question, index) => {
      return quizAnswers[index] === question.answer ? score + 1 : score;
    }, 0);
  }, [quizQuestions, quizAnswers]);

  /*------------------ AI Quiz Universal Handler ------------------*/
const generateQuiz = async () => {
  const topic = selectedLecture?.lectureTitle || selectedCourse?.title;
  if (!topic) {
    setQuizError("Topic not available for this lecture.");
    return;
  }

  setQuizLoading(true);
  setQuizError("");
  setQuizQuestions([]);
  setQuizAnswers({});
  setQuizSubmitted(false);

  try {
    const res = await axios.post(
      `${serverUrl}/api/ai/generate-quiz`,
      { topic },
      { withCredentials: true }
    );

    let quizPayload = res.data?.quiz;
    if (!quizPayload && Array.isArray(res.data)) {
      quizPayload = res.data;
    }
    if (typeof quizPayload === "string") {
      try {
        const cleaned = quizPayload.replace(/```json|```/gi, "").trim();
        quizPayload = JSON.parse(cleaned);
      } catch {
        quizPayload = [];
      }
    }

    const quiz = Array.isArray(quizPayload) ? quizPayload : [];
    const normalizedQuiz = quiz
      .map((item) => {
        const question = String(item?.question || "").trim();
        const options = Array.isArray(item?.options)
          ? item.options.map((opt) => String(opt || "").trim()).filter(Boolean)
          : [];
        const answer = String(item?.answer || "").trim();
        if (!question || options.length < 2 || !answer) return null;
        return { question, options, answer };
      })
      .filter(Boolean);

    if (!normalizedQuiz.length) {
      setQuizError("Quiz generated, but response format was invalid. Please try again.");
      return;
    }

    setQuizQuestions(normalizedQuiz);
  } catch (err) {
    console.log("Quiz generation error:", err);
    const apiError =
      err.response?.data?.details ||
      err.response?.data?.error ||
      err.message ||
      "Request failed";
    setQuizError(apiError);
  } finally {
    setQuizLoading(false);
  }
};





  const handleQuizOptionSelect = (questionIndex, selectedOption) => {
    if (quizSubmitted) return;
    setQuizAnswers((prev) => ({
      ...prev,
      [questionIndex]: selectedOption,
    }));
  };

  const handleQuizSubmit = () => {
    if (!quizQuestions.length) return;
    if (answeredCount < quizQuestions.length) {
      toast.info("Please answer all questions before submitting.");
      return;
    }
    setQuizSubmitted(true);
  };

  const handleQuizRetry = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
  };

  /*------------------ Video Save/Resume ------------------*/
  useEffect(() => {
    if (!selectedLecture?._id) return;
    const savedTime = localStorage.getItem(`progress_${selectedLecture._id}`);
    if (savedTime && videoRef.current) videoRef.current.currentTime = savedTime;
  }, [selectedLecture]);

  /*------------------ Fetch Progress ------------------*/
  useEffect(() => {
    if (!userData?._id || !selectedCourse?._id) return;
    axios
      .get(`${serverUrl}/api/progress/get/${userData._id}/${selectedCourse._id}`)
      .then((res) => setProgress(res.data?.completion || 0))
      .catch(() => {});
  }, [selectedCourse?._id, userData?._id]);

  /*------------------ Update on Complete ------------------*/
  const updateProgress = async () => {
    if (!userData?._id || !selectedCourse?._id || !selectedLecture?._id || !selectedCourseLectures.length) {
      return;
    }

    const res = await axios.post(
      `${serverUrl}/api/progress/update`,
      {
        userId: userData._id,
        courseId: selectedCourse._id,
        lectureId: selectedLecture._id,
        totalLectures: selectedCourseLectures.length,
      },
      { withCredentials: true }
    );

    setProgress(res.data.completion);

    if (res.data.completion === 100) {
      setShowCongrats(true);
      setTimeout(() => setShowCongrats(false), 5000);
    }
  };

  const hasCourseDataLoaded = Array.isArray(courseData) && courseData.length > 0;
  if (!selectedCourse) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center gap-4 bg-[#F7F7FC] px-4 text-center">
        <p className="text-lg font-medium text-gray-700">
          {hasCourseDataLoaded ? "Course not found for this link." : "Loading lecture..."}
        </p>
        {hasCourseDataLoaded && (
          <button
            onClick={() => navigate("/allcourses")}
            className="rounded-lg border border-[#3B82F6] bg-black px-4 py-2 font-semibold text-[#3B82F6] hover:bg-gray-900"
          >
            Go to Courses
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen w-full p-4 md:p-8 flex gap-6 flex-col md:flex-row transition
      ${dark ? "bg-[#0c0c0c] text-white" : "bg-[#F7F7FC] text-black"}`}
    >

      {/* 🎉 Popup */}
      {showCongrats && (
        <>
          <Confetti width={width} height={height} />
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
            <div className="bg-white text-black p-7 rounded-xl shadow-xl text-center">
              <h2 className="text-2xl font-bold text-green-600">🎉 Congratulations!</h2>
              <p>You completed this course!</p>

              <button
	    onClick={async () => {
                  try {
                    const response = await axios.get(
                      `${serverUrl}/api/cert/generate/${selectedCourse._id}`,
                      {
                        responseType: "blob",
                        withCredentials: true
                      }
                    );
                    const blob = new Blob([response.data], { type: "application/pdf" });
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `${selectedCourse.title}-certificate.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                  } catch (error) {
                    console.error("Certificate download error:", error);
                    toast.error(await getAxiosErrorMessage(error, "Failed to download certificate"));
                  }
                }}
                className="bg-green-600 mt-4 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition-all"
              >
                Download Certificate
              </button>
            </div>
          </div>
        </>
      )}

      {/* LEFT */}
      <div className={`w-full md:w-3/4 p-6 rounded-2xl shadow-lg border ${dark ? "bg-[#1a1a1a] border-[#444]" : "bg-white"}`}>
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <FaArrowLeftLong onClick={() => navigate("/")} className="cursor-pointer text-xl" />

          <h1 className={`text-2xl font-bold ${dark?"text-white":"text-[#111]"}`}>
            {selectedCourse?.title}
          </h1>

          <button onClick={() => setDark(!dark)} className="ml-auto border px-3 py-1 rounded-lg">
            {dark?"🌞 Light":"🌙 Dark"}
          </button>
        </div>

        {/* Progress */}
        <div>
          <div className="h-2 w-full bg-gray-300 rounded-full overflow-hidden">
            <div className="bg-green-600 h-full transition-all duration-500" style={{ width:`${progress}%` }}></div>
          </div>
          <p className="text-sm mt-1">{progress}% Completed</p>
        </div>

        {/* Video */}
        <div className="aspect-video rounded-xl overflow-hidden mt-5 border bg-black">
          <video
            ref={videoRef}
            src={selectedLecture?.videoUrl}
            controls
            onEnded={() => {
              void updateProgress();
            }}
            onTimeUpdate={() => {
              if (!selectedLecture?._id || !videoRef.current) return;
              localStorage.setItem(`progress_${selectedLecture._id}`, videoRef.current.currentTime);
            }}
            className="w-full h-full"
          />
        </div>

        <h2 className="text-xl font-semibold mt-3">{selectedLecture?.lectureTitle}</h2>

        {/* Next/Prev */}
        <div className="flex justify-between mt-4">
          <button
            disabled={currentLectureIndex <= 0}
            onClick={() => setSelectedLecture(selectedCourseLectures[currentLectureIndex - 1] || null)}
            className="px-4 py-2 border rounded-lg disabled:opacity-40"
          >
            ⬅ Previous
          </button>
          <button
            disabled={currentLectureIndex < 0 || currentLectureIndex >= selectedCourseLectures.length - 1}
            onClick={() => setSelectedLecture(selectedCourseLectures[currentLectureIndex + 1] || null)}
            className="px-4 py-2 border rounded-lg disabled:opacity-40"
          >
            Next ➡
          </button>
        </div>

        {/* Certificate */}
       {progress === 100 && (
  <button
    onClick={async () => {
      try {
        const response = await axios.get(
          `${serverUrl}/api/cert/generate/${selectedCourse._id}`,
          {
            responseType: "blob",
            withCredentials: true
          }
        );
        const blob = new Blob([response.data], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${selectedCourse.title}-certificate.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success("Certificate downloaded successfully!");
	      } catch (error) {
	        console.error("Certificate download error:", error);
	        toast.error(await getAxiosErrorMessage(error, "Failed to download certificate"));
	      }
		    }}
		    className="mt-6 px-6 py-3 rounded-xl border border-[#3B82F6] bg-black text-[#3B82F6] font-semibold shadow-lg transition-all duration-300 hover:bg-gray-900 hover:shadow-xl flex items-center gap-2"
		  >
	    <GiAchievement className="text-[#3B82F6]" />
	    Download Certificate
	  </button>
)}


      {/* ================= AI QUIZ SECTION (NEW) ================= */}
<div
  className={`mt-8 shadow-lg border rounded-2xl p-6 hover:shadow-xl ${
    dark ? "bg-[#141414] border-[#3a3a3a]" : "bg-white border-gray-200"
  }`}
>
	  <div className="flex items-center gap-3 mb-4">
	    <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/25 border border-[#3B82F6] flex items-center justify-center text-[#1E40AF] text-2xl font-bold">
	      ?
	    </div>
    <div>
      <h3 className={`text-xl font-bold ${dark ? "text-white" : "text-gray-800"}`}>AI Auto-Generated Quiz</h3>
      <p className={`text-sm ${dark ? "text-gray-300" : "text-gray-500"}`}>
        Based on: <span className="font-semibold">{selectedLecture?.lectureTitle || selectedCourse?.title}</span>
      </p>
    </div>
  </div>

  <button
    onClick={generateQuiz}
    disabled={quizLoading}
    className="w-full py-3 bg-black text-[#3B82F6] font-semibold rounded-lg hover:bg-gray-900 
    disabled:bg-gray-500 disabled:text-gray-200 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
  >
    {quizLoading ? "Generating Quiz..." : "Generate Quiz"}
  </button>

	  {quizError && <p className="text-red-600 text-sm mt-3 font-medium">{quizError}</p>}

  {!!quizQuestions.length && (
    <div className="mt-5 space-y-4">
      {quizQuestions.map((item, index) => {
        const selectedOption = quizAnswers[index];
        const correctAnswer = item.answer;
        return (
          <div
            key={`quiz-q-${index}`}
            className={`p-4 border rounded-xl ${
              dark ? "bg-[#1a1a1a] border-[#3a3a3a]" : "bg-gray-50 border-gray-200"
            }`}
          >
            <p className={`font-semibold mb-3 ${dark ? "text-white" : "text-gray-800"}`}>
              Q{index + 1}. {item.question}
            </p>
            <div className="space-y-2">
              {item.options.map((option, optionIndex) => {
                const isSelected = selectedOption === option;
                const isCorrect = option === correctAnswer;
                let optionClass = dark
                  ? "border-[#4a4a4a] bg-[#222] text-gray-200 hover:bg-[#2b2b2b]"
                  : "border-gray-300 bg-white text-gray-800 hover:bg-gray-100";
                if (quizSubmitted) {
                  if (isCorrect) optionClass = "border-green-500 bg-green-50 text-green-800";
                  else if (isSelected && !isCorrect) optionClass = "border-red-500 bg-red-50 text-red-700";
                } else if (isSelected) {
                  optionClass = "border-blue-500 bg-blue-50 text-blue-800";
                }

                return (
                  <button
                    key={`quiz-q-${index}-opt-${optionIndex}`}
                    type="button"
                    onClick={() => handleQuizOptionSelect(index, option)}
                    className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${optionClass}`}
                  >
                    <span className="font-medium mr-2">{String.fromCharCode(65 + optionIndex)}.</span>
                    {option}
                  </button>
                );
              })}
            </div>
            {quizSubmitted && (
              <p className="mt-3 text-sm font-medium text-green-700">
                Correct answer: {correctAnswer}
              </p>
            )}
          </div>
        );
      })}

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pt-1">
        <p className={`text-sm ${dark ? "text-gray-300" : "text-gray-600"}`}>
          Answered: {answeredCount}/{quizQuestions.length}
        </p>
        {!quizSubmitted ? (
          <button
            type="button"
            onClick={handleQuizSubmit}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            Submit Quiz
          </button>
        ) : (
          <button
            type="button"
            onClick={handleQuizRetry}
            className="px-4 py-2 rounded-lg bg-gray-700 text-white font-semibold hover:bg-gray-800 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>

      {quizSubmitted && (
        <div
          className={`rounded-xl border px-4 py-3 font-semibold ${
            dark ? "border-[#3a3a3a] bg-[#111] text-white" : "border-gray-200 bg-white text-gray-900"
          }`}
        >
          Score: {quizScore} / {quizQuestions.length}
        </div>
      )}
    </div>
  )}
</div>

      </div>

      {/* RIGHT Sidebar */}
      <div className={`w-full md:w-1/4 p-5 rounded-2xl shadow-lg border h-fit 
      ${dark?"bg-[#161616] border-[#444]":"bg-white"}`}>
        <h2 className="text-lg font-bold mb-3">All Lectures</h2>

        <div className="flex flex-col gap-2 max-h-[75vh] overflow-y-auto">
          {selectedCourseLectures.map((lec)=>(
            <button key={lec._id}
            onClick={()=>setSelectedLecture(lec)}
            className={`p-3 border rounded-lg flex justify-between 
            ${selectedLecture?._id===lec._id?
            "bg-black text-white":"hover:bg-gray-200 dark:hover:bg-[#333]"}`}>
              {lec.lectureTitle} <FaPlayCircle/>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ViewLecture;

