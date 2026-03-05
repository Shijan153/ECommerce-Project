import React, { useEffect, useState } from "react";
import "./CSS/SellerAuth.css";
import { useLocation, useNavigate } from "react-router-dom";

const SellerAuth = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [mode, setMode] = useState("signup"); // "signup" | "login"
  
  // Signup fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [storeName, setStoreName] = useState("");
  
  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Sync mode with URL
  useEffect(() => {
    if (location.pathname === "/seller-login") {
      setMode("login");
    } else if (location.pathname === "/seller-signup") {
      setMode("signup");
    }
  }, [location.pathname]);

  const handleSubmit = async () => {
    if (mode === "signup") {
      // Signup validation
      if (!name || !phone || !email || !password || !storeName) {
        setError("Please fill all fields");
        return;
      }
      if (!/^\d{10}$/.test(phone)) {
        setError("Phone number must be 10 digits");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
      if (!agreeTerms) {
        setError("Please agree to the terms and conditions");
        return;
      }
    } else {
      // Login validation
      if (!loginEmail || !loginPassword) {
        setError("Email and password are required");
        return;
      }
    }

    setLoading(true);
    setError("");

    const url = mode === "signup"
      ? "http://localhost:5000/api/seller/signup"
      : "http://localhost:5000/api/seller/login";

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "signup"
            ? { name, phone, email, password, storeName }
            : { email: loginEmail, password: loginPassword }
        ),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Request failed");
        return;
      }

      alert(mode === "signup" ? "Seller account created successfully!" : "Login successful!");
      console.log(data);
      
      if (mode === "login") {
        // Redirect to seller dashboard or home
        navigate("/");
      } else {
        // After signup, switch to login or go to login page
        navigate("/seller-login");
      }
    } catch (err) {
      setError("Backend not reachable");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="seller-auth">
      <div className="seller-auth-container">
        <h1>{mode === "signup" ? "Create Seller Account" : "Seller Login"}</h1>
        
        {mode === "signup" && (
          <p className="seller-auth-subtitle">Start selling on Shopper today!</p>
        )}

        <div className="seller-auth-fields">
          {mode === "signup" ? (
            // Signup Fields
            <>
              <input
                type="text"
                placeholder="Full Name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <input
                type="tel"
                placeholder="Phone Number *"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              <input
                type="email"
                placeholder="Email Address *"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <input
                type="password"
                placeholder="Password *"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <input
                type="text"
                placeholder="Store Name *"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
              />
            </>
          ) : (
            // Login Fields
            <>
              <input
                type="email"
                placeholder="Seller Email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />

              <input
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </>
          )}
        </div>

        <button onClick={handleSubmit} disabled={loading}>
          {loading 
            ? (mode === "signup" ? "Creating Account..." : "Logging in...") 
            : (mode === "signup" ? "Create Account" : "Login")}
        </button>

        {error && <p className="error-text">{error}</p>}

        {mode === "signup" && (
          <div className="seller-auth-agree">
            <input 
              type="checkbox" 
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
            />
            <p>I agree to the <span>terms of use</span> & <span>privacy policy</span></p>
          </div>
        )}

        {mode === "signup" ? (
          <p className="seller-auth-toggle">
            Already have a seller account?{" "}
            <span onClick={() => navigate("/seller-login")}>Login here</span>
          </p>
        ) : (
          <p className="seller-auth-toggle">
            Want to sell on Shopper?{" "}
            <span onClick={() => navigate("/seller-signup")}>Create seller account</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default SellerAuth;