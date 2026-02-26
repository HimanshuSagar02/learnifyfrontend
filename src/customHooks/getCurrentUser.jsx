import { useEffect } from "react";
import { serverUrl } from "../App";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setUserData } from "../redux/userSlice";
import { clearSessionHint, markSessionHint } from "../utils/sessionHint";
import { extractAuthUser } from "../utils/authPayload";

const useCurrentUser = () => {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);

  useEffect(() => {
    if (userData) {
      markSessionHint();
      return;
    }

    const fetchUser = async () => {
      try {
        const result = await axios.get(`${serverUrl}/api/user/currentuser`, {
          withCredentials: true,
          timeout: 10000,
        });

        const authUser = extractAuthUser(result.data);

        if (authUser) {
          markSessionHint();
          dispatch(setUserData(authUser));
          return;
        }

        clearSessionHint();
        dispatch(setUserData(null));
      } catch (error) {
        const status = error?.response?.status;
        if (status === 401 || status === 403 || status === 503) {
          clearSessionHint();
        }
        dispatch(setUserData(null));
      }
    };

    const timer = setTimeout(fetchUser, 100);
    return () => clearTimeout(timer);
  }, [dispatch, userData]);
};

export default useCurrentUser;
