'use client'

import { useEffect, useState } from "react";
import MainPage from "./home/page";
import Auth from "./auth/page";
import Cookies from "universal-cookie";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const cookies = new Cookies();
    const authStatus = cookies.get("isAuthenticated");

    // Assuming the value of 'isAuthenticated' is a string ("true" or "false")
    if (authStatus === true) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  if (isAuthenticated === null) {
    // You can add a loading spinner here if needed
    return <div>Loading...</div>;
  }

  return (
    <div>
      {isAuthenticated ? <MainPage /> : <Auth />}
    </div>
  );
}
