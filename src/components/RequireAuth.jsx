import { useUser } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";

export default function RequireAuth({ children }) {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) return null; 
  if (!isSignedIn) return <Navigate to="/" />;

  return children;
}
