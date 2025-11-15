import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Signup from "./pages/SignUp";
import Login from "./pages/Login";
import Studio from "./pages/Studio";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/Protectedroute";
import './index.css';

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<NavigateToLogin />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/studio" element={<ProtectedRoute><Studio /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);

function NavigateToLogin() {
  return <div className="min-h-screen flex items-center justify-center p-5 m-5">
    <div>
      <a href="/login" className="text-gray-800 underline">Go to Login</a>
    </div>
  </div>
}
