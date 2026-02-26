import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { serverUrl } from '../App'
import { setAllReview } from '../redux/reviewSlice'
import axios from 'axios'

const dedupeById = (items = []) => {
  const uniqueMap = new Map();
  items.forEach((item) => {
    if (item?._id) {
      uniqueMap.set(item._id, item);
    }
  });
  return Array.from(uniqueMap.values());
};

const useAllReviews = () => {

   const dispatch = useDispatch()
  

  useEffect(()=>{
    const fetchAllReviews = async () => {
      try {
        const result = await axios.get(serverUrl + "/api/review/allReview" , {withCredentials:true})
        const uniqueReviews = dedupeById(Array.isArray(result.data) ? result.data : []);
        dispatch(setAllReview(uniqueReviews))
        
      } catch {
        dispatch(setAllReview([]));
      }
    }
    fetchAllReviews()
  },[dispatch])
  
}

export default useAllReviews
