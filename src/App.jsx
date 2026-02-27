import React, { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import { ToastContainer} from 'react-toastify';
import ForgotPassword from './pages/ForgotPassword'
import { useSelector } from 'react-redux'
import ScrollToTop from './components/ScrollToTop'
import DataLoader from './components/DataLoader'
import axios from 'axios'

const Profile = lazy(() => import('./pages/Profile'))
const EditProfile = lazy(() => import('./pages/EditProfile'))
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const EducatorDashboard = lazy(() => import('./pages/admin/EducatorDashboard'))
const Courses = lazy(() => import('./pages/admin/Courses'))
const AllCouses = lazy(() => import('./pages/AllCouses'))
const AddCourses = lazy(() => import('./pages/admin/AddCourses'))
const CreateCourse = lazy(() => import('./pages/admin/CreateCourse'))
const CreateLecture = lazy(() => import('./pages/admin/CreateLecture'))
const EditLecture = lazy(() => import('./pages/admin/EditLecture'))
const ViewCourse = lazy(() => import('./pages/ViewCourse'))
const EnrolledCourse = lazy(() => import('./pages/EnrolledCourse'))
const ViewLecture = lazy(() => import('./pages/ViewLecture'))
const SearchWithAi = lazy(() => import('./pages/SearchWithAi'))
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'))
const Assignments = lazy(() => import('./pages/admin/Assignments'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const AdminPortal = lazy(() => import('./pages/admin/AdminPortal'))
const AdminFees = lazy(() => import('./pages/admin/AdminFees'))
const MyStudents = lazy(() => import('./pages/admin/MyStudents'))
const Attendance = lazy(() => import('./pages/admin/Attendance'))
const Notifications = lazy(() => import('./pages/admin/Notifications'))
const LiveClasses = lazy(() => import('./pages/admin/LiveClasses'))
const Grades = lazy(() => import('./pages/admin/Grades'))
const Doubts = lazy(() => import('./pages/Doubts'))
const Feedback = lazy(() => import('./pages/Feedback'))
const AdminFeedback = lazy(() => import('./pages/admin/AdminFeedback'))
const VerifyCertificate = lazy(() => import('./pages/VerifyCertificate'))
const MyCertificates = lazy(() => import('./pages/MyCertificates'))
const AIAssistant = lazy(() => import('./components/AIAssistant'))

const normalizeServerUrl = (value) => {
  const trimmed = (value || "").trim();
  if (!trimmed) return "";

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  return withProtocol.replace(/\/+$/, "");
};

const getApiBaseUrl = () => {
  const configuredUrl = normalizeServerUrl(import.meta.env.VITE_SERVER_URL);
  const fallbackRemoteUrl = normalizeServerUrl(
    import.meta.env.VITE_BACKEND_FALLBACK_URL || import.meta.env.VITE_REMOTE_SERVER_URL
  );

  if (typeof window === "undefined") {
    return configuredUrl || fallbackRemoteUrl || "http://localhost:8000";
  }

  const host = String(window.location.hostname || "").toLowerCase();
  const isLocalhost = host === "localhost" || host === "127.0.0.1";
  const sameOriginUrl = normalizeServerUrl(window.location.origin);

  // In production, prefer configured API and allow explicit remote override.
  const forceRemote =
    String(import.meta.env.VITE_FORCE_REMOTE_API || "").toLowerCase() === "true";

  if (import.meta.env.PROD && !isLocalhost) {
    if (forceRemote) {
      return configuredUrl || fallbackRemoteUrl || sameOriginUrl || "http://localhost:8000";
    }

    const configuredIsSameOrigin =
      Boolean(configuredUrl) && configuredUrl.toLowerCase() === sameOriginUrl.toLowerCase();

    // If configured URL points to same origin but a remote fallback exists, prefer fallback.
    if (configuredIsSameOrigin && fallbackRemoteUrl) {
      return fallbackRemoteUrl;
    }

    return configuredUrl || sameOriginUrl || fallbackRemoteUrl || "http://localhost:8000";
  }

  return configuredUrl || fallbackRemoteUrl || (isLocalhost ? "http://localhost:8000" : sameOriginUrl);
};

// Use environment variable for server URL, fallback to localhost for development.
// This guard prevents malformed URLs when env value misses http/https.
// eslint-disable-next-line react-refresh/only-export-components
export const serverUrl = getApiBaseUrl();

if (import.meta.env.DEV && typeof window !== 'undefined') {
    console.log("[App] Backend Server URL:", serverUrl);
}

// Configure axios defaults to always send credentials (cookies)
axios.defaults.withCredentials = true;

function App() {
  
  let {userData} = useSelector(state=>state.user)
  const routeFallback = (
    <div className="flex min-h-[40vh] items-center justify-center text-sm app-muted">
      Loading...
    </div>
  );

  return (
    <>
      <DataLoader />
      <ToastContainer
        theme="colored"
        toastStyle={{ fontFamily: "Outfit, sans-serif", fontWeight: 600 }}
      />
      <ScrollToTop/>
      {userData && (
        <Suspense fallback={null}>
          <AIAssistant />
        </Suspense>
      )}
      <div className="app-shell">
        <Suspense fallback={routeFallback}>
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/login' element={<Login/>}/>
        <Route path='/signup' element={!userData?<SignUp/>:<Navigate to={"/"}/>}/>
        <Route path='/profile' element={userData?<Profile/>:<Navigate to={"/signup"}/>}/>
        <Route path='/allcourses' element={userData?<AllCouses/>:<Navigate to={"/signup"}/>}/>
        <Route path='/viewcourse/:courseId' element={userData?<ViewCourse/>:<Navigate to={"/signup"}/>}/>
        <Route path='/editprofile' element={userData?<EditProfile/>:<Navigate to={"/signup"}/>}/>
        <Route path='/enrolledcourses' element={userData?<EnrolledCourse/>:<Navigate to={"/signup"}/>}/>
         <Route path='/viewlecture/:courseId' element={userData?<ViewLecture/>:<Navigate to={"/signup"}/>}/>
         <Route path='/searchwithai' element={userData?<SearchWithAi/>:<Navigate to={"/signup"}/>}/>
         <Route path='/student-dashboard' element={userData?<StudentDashboard/>:<Navigate to={"/signup"}/>}/>
        
        
        <Route path='/dashboard' element={
          userData?.role === "educator" || userData?.role === "admin" 
            ? <EducatorDashboard/> 
            : userData 
              ? <Navigate to={"/student-dashboard"}/> 
              : <Navigate to={"/signup"}/>
        }/>
        <Route path='/dashboard-old' element={userData?.role === "educator"?<Dashboard/>:<Navigate to={"/signup"}/>}/>
        <Route path='/courses' element={userData?.role === "educator"?<Courses/>:<Navigate to={"/signup"}/>}/>
        <Route path='/addcourses/:courseId' element={userData?.role === "educator"?<AddCourses/>:<Navigate to={"/signup"}/>}/>
        <Route path='/createcourses' element={userData?.role === "educator"?<CreateCourse/>:<Navigate to={"/signup"}/>}/>
        <Route path='/createlecture/:courseId' element={userData?.role === "educator"?<CreateLecture/>:<Navigate to={"/signup"}/>}/>
        <Route path='/editlecture/:courseId/:lectureId' element={userData?.role === "educator"?<EditLecture/>:<Navigate to={"/signup"}/>}/>
        <Route path='/assignments' element={userData?.role === "educator"?<Assignments/>:<Navigate to={"/signup"}/>}/>
        <Route path='/my-students' element={userData?.role === "educator"?<MyStudents/>:<Navigate to={"/signup"}/>}/>
        <Route path='/attendance' element={(userData?.role === "educator" || userData?.role==="admin")?<Attendance/>:<Navigate to={"/signup"}/>}/>
        <Route path='/notifications' element={(userData?.role === "educator" || userData?.role==="admin")?<Notifications/>:<Navigate to={"/signup"}/>}/>
        <Route path='/liveclasses' element={(userData?.role === "educator" || userData?.role==="admin")?<LiveClasses/>:<Navigate to={"/signup"}/>}/>
        <Route path='/grades' element={(userData?.role === "educator" || userData?.role==="admin")?<Grades/>:<Navigate to={"/signup"}/>}/>
        <Route path='/doubts' element={userData?<Doubts/>:<Navigate to={"/signup"}/>}/>
        <Route path='/feedback' element={userData?.role === "student"?<Feedback/>:<Navigate to={"/signup"}/>}/>
        <Route path='/admin/users' element={userData?.role === "admin"?<AdminUsers/>:<Navigate to={"/signup"}/>}/>
        <Route path='/admin/portal' element={userData?.role === "admin"?<AdminPortal/>:<Navigate to={"/signup"}/>}/>
        <Route path='/admin/fees' element={userData?.role === "admin"?<AdminFees/>:<Navigate to={"/signup"}/>}/>
        <Route path='/admin/feedback' element={userData?.role === "admin"?<AdminFeedback/>:<Navigate to={"/signup"}/>}/>
        <Route path='/certificate/verify/:certificateId?' element={<VerifyCertificate/>}/>
        <Route path='/my-certificates' element={userData?<MyCertificates/>:<Navigate to={"/signup"}/>}/>
        <Route path='/forgotpassword' element={<ForgotPassword/>}/>
        <Route path='/index.html' element={<Navigate to={"/"} replace />}/>
        <Route path='*' element={<Navigate to={"/"} replace />}/>
         </Routes>
      </Suspense>
      </div>

         </>
   
  )
}

export default App
