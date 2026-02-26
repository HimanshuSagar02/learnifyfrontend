import { useEffect } from 'react'
import { serverUrl } from '../App'
import axios from 'axios'
import { setCreatorCourseData } from '../redux/courseSlice'
import { useDispatch, useSelector } from 'react-redux'

const useCreatorCourseData = () => {
    const dispatch = useDispatch()
    const {userData} = useSelector(state=>state.user)
    
    useEffect(()=>{
        if (!userData || (userData.role !== "educator" && userData.role !== "admin")) {
            dispatch(setCreatorCourseData([]))
            return;
        }
        
        const getCreatorData = async () => {
            try {
                const result = await axios.get(serverUrl + "/api/course/getcreatorcourses" , {withCredentials:true})
                dispatch(setCreatorCourseData(Array.isArray(result.data) ? result.data : []))
            } catch {
                dispatch(setCreatorCourseData([]))
            }
        }
        getCreatorData()
    },[dispatch, userData])
}

export default useCreatorCourseData
