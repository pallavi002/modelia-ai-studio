import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Signup from "./pages/SignUp";
import Login from "./pages/Login";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/Protectedroute";
// placeholder studio page
const Studio = () => <div className="p-6">Studio page — protected</div>;

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
  return <div className="min-h-screen flex items-center justify-center">
    <div>
      <a href="/login" className="text-gray-800 underline">Go to Login</a>
    </div>
  </div>
}
