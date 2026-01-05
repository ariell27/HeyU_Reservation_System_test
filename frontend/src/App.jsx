import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import LandingPage from "./pages/LandingPage";
import BookingPage from "./pages/BookingPage";
import TimeSelectionPage from "./pages/TimeSelectionPage";
import CustomerInfoPage from "./pages/CustomerInfoPage";
import SuccessPage from "./pages/SuccessPage";
import AdminPage from "./pages/AdminPage";
import "./styles/global.css";

function App() {
  useEffect(() => {
    // Debug: Log API configuration when app loads
    const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
    const apiUrl = rawApiUrl.replace(/\/+$/, ""); // Remove trailing slashes
    console.log("========================================");
    console.log("🔗 Frontend API Configuration");
    console.log("========================================");
    console.log("VITE_API_URL:", import.meta.env.VITE_API_URL || "NOT SET");
    console.log("API_URL (cleaned):", apiUrl);
    console.log("Mode:", import.meta.env.MODE);
    console.log("Production:", import.meta.env.PROD);
    console.log("========================================");

    // Test backend connection
    fetch(`${apiUrl}/api/health`)
      .then((res) => res.json())
      .then((data) => {
        console.log("✅ Backend connection test:", data);
      })
      .catch((error) => {
        console.error("❌ Backend connection failed:", error.message);
        console.error("Backend URL:", apiUrl);
      });
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/booking/time" element={<TimeSelectionPage />} />
        <Route path="/booking/confirm" element={<CustomerInfoPage />} />
        <Route path="/booking/success" element={<SuccessPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Router>
  );
}

export default App;
