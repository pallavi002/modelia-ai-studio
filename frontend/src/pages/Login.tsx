import React, { useState, useContext } from "react";
import api from "../services/api";
import AuthContext from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signin } = useContext(AuthContext);
  const nav = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/auth/login", { email, password });
      signin(res.data.token, res.data.user);
      nav("/studio");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-white p-6 rounded shadow">
        <h2 className="text-xl mb-4">Log in</h2>
        {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
        <input required placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full mb-2 p-2 border rounded" />
        <input required type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full mb-4 p-2 border rounded" />
        <button disabled={loading} className="w-full p-2 rounded bg-gray-800 text-white">{loading ? "Signing..." : "Sign in"}</button>
      </form>
    </div>
  );
}
