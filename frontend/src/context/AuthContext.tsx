import { createContext, useState, useEffect, type ReactNode } from "react";

type User = { id: number; email: string; name?: string };

const AuthContext = createContext<{
  user: User | null;
  signin: (token: string, user: User) => void;
  signout: () => void;
}>({
  user: null,
  signin: () => {},
  signout: () => {}
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });

  const signin = (token: string, user: User) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
  };

  const signout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  useEffect(() => {
    // optionally: verify token on mount
  }, []);

  return <AuthContext.Provider value={{ user, signin, signout }}>{children}</AuthContext.Provider>;
};

export default AuthContext;
