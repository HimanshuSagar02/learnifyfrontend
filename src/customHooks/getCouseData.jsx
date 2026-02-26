import axios from "axios";
import { serverUrl } from "../App";
import { useDispatch } from "react-redux";
import { setCourseData } from "../redux/courseSlice";
import { useEffect } from "react";

const dedupeById = (items = []) => {
  const uniqueMap = new Map();
  items.forEach((item) => {
    if (item?._id) {
      uniqueMap.set(item._id, item);
    }
  });
  return Array.from(uniqueMap.values());
};

export default function useCourseData() {
  const dispatch = useDispatch();

  useEffect(() => {
    axios.get(`${serverUrl}/api/course/getallcourse`)
      .then(res => {
        const uniqueCourses = dedupeById(Array.isArray(res.data) ? res.data : []);
        dispatch(setCourseData(uniqueCourses));
      })
      .catch(() => {
        dispatch(setCourseData([]));
      });
  }, [dispatch]);
}
