import useCurrentUser from "../customHooks/getCurrentUser";
import useCourseData from "../customHooks/getCouseData";
import useCreatorCourseData from "../customHooks/getCreatorCourseData";
import useAllReviews from "../customHooks/getAllReviews";
import useActivityPing from "../customHooks/useActivityPing";

// This component loads all necessary data
function DataLoader() {
  useCurrentUser();
  useCourseData();
  useCreatorCourseData();
  useAllReviews();
  useActivityPing();
  
  return null; // This component doesn't render anything
}

export default DataLoader;

