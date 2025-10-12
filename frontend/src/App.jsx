import React from "react";
import LoginCard from "./components/LoginCard";

function App() {
  const handleGoogleClick = () => {
    alert("Google login clicked!");
  };
  return <LoginCard onGoogleClick={handleGoogleClick} />;
}

export default App;
