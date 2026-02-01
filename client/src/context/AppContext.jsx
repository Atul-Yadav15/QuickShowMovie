import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

// Debug: Log the base URL to verify it's set correctly
console.log("API Base URL:", axios.defaults.baseURL || "NOT SET - Check .env file!");

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [shows, setShows] = useState([]);
  const [favoriteMovies, setFavoriteMovies] = useState([]);

  const image_base_url = import.meta.env.VITE_TMDB_IMAGE_BASE_URL;

  const { user } = useUser();
  const { getToken } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const fetchIsAdmin = async () => {
    try {
      const { data } = await axios.get("/api/admin/is-admin", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      setIsAdmin(data.isAdmin);

      if (!data.isAdmin && location.pathname.startsWith("/admin")) {
        navigate("/");
        toast.error("You are not authorized to access admin dashboard");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchShows = async () => {
    try {
      console.log("Fetching shows from:", axios.defaults.baseURL + "/api/show/all");
      const { data } = await axios.get("/api/show/all");
      
      console.log("API Response:", data);
      
      if (data.success) {
        console.log("Shows fetched successfully:", data.shows?.length || 0, "shows");
        setShows(data.shows || []);
      } else {
        console.error("API returned success:false", data.message);
        toast.error(data.message || "Failed to fetch shows");
      }
    } catch (error) {
      console.error("Error fetching shows:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        requestURL: axios.defaults.baseURL + "/api/show/all"
      });
      toast.error(
        error.response?.data?.message || 
        error.message || 
        "Failed to fetch shows. Check if backend is running on port 3000."
      );
    }
  };

  const fetchFavoriteMovies = async () => {
    try {
      const { data } = await axios.get("/api/user/favorites", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      if (data.success) {
        setFavoriteMovies(data.movies);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchShows();
  }, []);

  useEffect(() => {
    if (user) {
      fetchIsAdmin();
      fetchFavoriteMovies();
    }
  }, [user]);

  const value = {
    axios,
    fetchIsAdmin,
    user,
    getToken,
    navigate,
    isAdmin,
    shows,
    favoriteMovies,
    fetchFavoriteMovies,
    image_base_url,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
