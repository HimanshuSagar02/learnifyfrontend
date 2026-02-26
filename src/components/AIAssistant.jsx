import React, { useState, useRef, useEffect } from "react";
import { FaRobot, FaTimes, FaMicrophone, FaMicrophoneSlash, FaQuestionCircle, FaGraduationCap } from "react-icons/fa";
import axios from "axios";
import { serverUrl } from "../App";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";

function AIAssistant() {
  const { userData } = useSelector((state) => state.user);
  const { courseData } = useSelector((state) => state.course);

  const [isOpen, setIsOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState("tutor"); // tutor, practice
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Tutor chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [currentTopic, setCurrentTopic] = useState("");

  // Practice questions state
  const [practiceTopic, setPracticeTopic] = useState("");
  const [practiceDifficulty, setPracticeDifficulty] = useState("medium");
  const [practiceQuestionType, setPracticeQuestionType] = useState("mixed");
  const [practiceQuestions, setPracticeQuestions] = useState(null);
  const [isLoadingPractice, setIsLoadingPractice] = useState(false);

  const recognitionRef = useRef(null);
  const synthRef = useRef(null);

  const tutorSuggestionTemplates = [
    { label: "Concept", prompt: 'Explain "{topic}" in simple language with one real-life example.' },
    { label: "MCQ", prompt: 'Create 5 MCQs on "{topic}" with answers and short explanations.' },
    { label: "Revision", prompt: 'Give me a quick revision sheet for "{topic}" with key points.' },
    { label: "Numerical", prompt: 'Give me 3 numerical questions on "{topic}" and solve step-by-step.' },
    { label: "Exam Tips", prompt: 'Share exam strategy for "{topic}" including common mistakes to avoid.' },
  ];

  useEffect(() => {
    // Initialize speech recognition
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (activeFeature === "tutor") {
          setChatInput(transcript);
        }
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        toast.error("Speech recognition error");
      };
    }

    // Initialize speech synthesis
    if ("speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [activeFeature]);

  const startListening = () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition not supported in your browser");
      return;
    }
    setIsListening(true);
    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const speakText = (text) => {
    if (!synthRef.current) {
      toast.error("Text-to-speech not supported in your browser");
      return;
    }
    synthRef.current.cancel(); // Cancel any ongoing speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    setIsSpeaking(false);
  };

  const copyToClipboard = async (value) => {
    if (!value) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = value;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  // Tutor Chat
  const handleTutorChat = async (inputMessage) => {
    const rawInput =
      typeof inputMessage === "string"
        ? inputMessage
        : typeof chatInput === "string"
        ? chatInput
        : "";

    const userMessage = rawInput.trim();
    if (!userMessage) return;
    setChatInput("");
    setIsLoadingChat(true);

    const newMessages = [...chatMessages, { role: "user", content: userMessage }];
    setChatMessages(newMessages);

    try {
      const res = await axios.post(
        `${serverUrl}/api/ai-assistant/tutor/chat`,
        {
          message: userMessage,
          conversationHistory: chatMessages,
          topic: currentTopic,
          language: "English",
        },
        { withCredentials: true }
      );

      setChatMessages(res.data.conversationHistory);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to get AI response");
      setChatMessages(newMessages);
    } finally {
      setIsLoadingChat(false);
    }
  };

  const applyTutorSuggestion = (template) => {
    const topic = currentTopic.trim() || "this topic";
    setChatInput(template.replace("{topic}", topic));
  };

  // Generate Practice Questions
  const handleGeneratePractice = async () => {
    if (!practiceTopic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    setIsLoadingPractice(true);
    try {
      const res = await axios.post(
        `${serverUrl}/api/ai-assistant/tutor/practice-questions`,
        {
          topic: practiceTopic,
          difficulty: practiceDifficulty,
          questionType: practiceQuestionType,
          count: 5,
        },
        { withCredentials: true }
      );

      setPracticeQuestions(res.data.questions);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to generate practice questions");
    } finally {
      setIsLoadingPractice(false);
    }
  };

  const courseCount = Array.isArray(courseData) ? courseData.length : 0;

  return (
    <>
      {/* Floating AI Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-black border-2 border-[#3B82F6] text-[#3B82F6] p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all hover:scale-110 hover:bg-[#3B82F6] hover:text-black flex items-center justify-center"
        title="AI Assistant"
      >
        <FaRobot className="w-6 h-6" />
      </button>

      {/* AI Assistant Sidebar */}
      {isOpen && (
        <div className="fixed bottom-3 right-3 left-3 sm:left-auto sm:bottom-6 sm:right-6 z-50 w-auto sm:w-96 h-[80vh] sm:h-[85vh] max-h-[85vh] bg-white rounded-lg shadow-2xl flex flex-col border-2 border-gray-200">
          {/* Header */}
          <div className="bg-black border-b-2 border-[#3B82F6] text-[#3B82F6] p-4 rounded-t-lg flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FaRobot className="w-5 h-5" />
              <h2 className="font-bold text-lg">AI Assistant</h2>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>

          {/* Feature Tabs */}
          <div className="flex border-b overflow-x-auto">
            <button
              onClick={() => setActiveFeature("tutor")}
              className={`px-3 py-2 text-sm font-medium whitespace-nowrap ${
                activeFeature === "tutor"
                  ? "bg-[#3B82F6] text-black border-b-2 border-[#3B82F6]"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <FaQuestionCircle className="inline mr-1" /> Tutor
            </button>
            <button
              onClick={() => setActiveFeature("practice")}
              className={`px-3 py-2 text-sm font-medium whitespace-nowrap ${
                activeFeature === "practice"
                  ? "bg-[#3B82F6] text-black border-b-2 border-[#3B82F6]"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <FaGraduationCap className="inline mr-1" /> Practice
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* AI Tutor Chat */}
            {activeFeature === "tutor" && (
              <div className="space-y-4 h-full flex flex-col">
                <p className="text-xs text-gray-500">
                  Context: {userData?.role || "user"} mode, {courseCount} courses loaded
                </p>
                <div className="flex-1 space-y-3 overflow-y-auto mb-4">
                  {chatMessages.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      <FaRobot className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>Ask me anything! I'm here to help you learn.</p>
                    </div>
                  )}
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          msg.role === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        {msg.role === "assistant" && (
                          <button
                            onClick={() => speakText(msg.content)}
                            className="mt-2 text-xs text-[#3B82F6] hover:underline"
                          >
                            🔊 Read aloud
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoadingChat && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 p-3 rounded-lg">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={currentTopic}
                    onChange={(e) => setCurrentTopic(e.target.value)}
                    placeholder="Current topic (optional)"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Quick question types:</p>
                    <div className="flex flex-wrap gap-2">
                      {tutorSuggestionTemplates.map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => applyTutorSuggestion(item.prompt)}
                          className="px-2 py-1 text-xs rounded-full border border-gray-300 bg-gray-50 text-gray-700 hover:bg-[#3B82F6] hover:text-black hover:border-[#3B82F6] transition-colors"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleTutorChat()}
                      placeholder="Ask a question..."
                      className="flex-1 px-3 py-2 border rounded-lg text-sm"
                    />
                    <button
                      onClick={isListening ? stopListening : startListening}
                      className={`p-2 rounded-lg ${
                        isListening ? "bg-red-500 text-white" : "bg-gray-200 text-gray-700"
                      }`}
                      title="Voice input"
                    >
                      {isListening ? <FaMicrophoneSlash /> : <FaMicrophone />}
                    </button>
                    {isSpeaking && (
                      <button
                        onClick={stopSpeaking}
                        className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                        title="Stop speech"
                      >
                        Stop
                      </button>
                    )}
                    <button
                      onClick={() => handleTutorChat()}
                      disabled={isLoadingChat || !chatInput.trim()}
                      className="px-4 py-2 bg-black text-[#3B82F6] border border-[#3B82F6] rounded-lg hover:bg-[#3B82F6] hover:text-black transition-colors disabled:opacity-50"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Practice Questions */}
            {activeFeature === "practice" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Topic *</label>
                  <input
                    type="text"
                    value={practiceTopic}
                    onChange={(e) => setPracticeTopic(e.target.value)}
                    placeholder="e.g., JavaScript Functions"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Difficulty</label>
                  <select
                    value={practiceDifficulty}
                    onChange={(e) => setPracticeDifficulty(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Question Type</label>
                  <select
                    value={practiceQuestionType}
                    onChange={(e) => setPracticeQuestionType(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="mixed">Mixed</option>
                    <option value="multiple-choice">Multiple Choice</option>
                    <option value="short-answer">Short Answer</option>
                  </select>
                </div>
                <button
                  onClick={handleGeneratePractice}
                  disabled={isLoadingPractice || !practiceTopic.trim()}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoadingPractice ? "Generating..." : "Generate Practice Questions"}
                </button>

                {practiceQuestions && (
                  <div className="mt-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">Practice Questions</h3>
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(practiceQuestions, null, 2))}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Copy
                      </button>
                    </div>
                    {practiceQuestions.map((q, idx) => (
                      <div key={idx} className="border rounded-lg p-3">
                        <p className="font-medium mb-2">{idx + 1}. {q.question}</p>
                        {q.options && (
                          <ul className="list-disc list-inside ml-2 space-y-1">
                            {q.options.map((opt, optIdx) => (
                              <li key={optIdx} className="text-sm">{opt}</li>
                            ))}
                          </ul>
                        )}
                        <div className="mt-2 p-2 bg-green-50 rounded">
                          <p className="text-sm font-semibold text-green-800">Answer: {q.correctAnswer}</p>
                          {q.explanation && (
                            <p className="text-xs text-gray-600 mt-1">{q.explanation}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}

export default AIAssistant;

