import React, { useEffect, useState } from "react";
import "./CSS/LoginSignup.css";
import { useLocation, useNavigate } from "react-router-dom";

const LoginSignup = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [mode, setMode] = useState("signup"); // "signup" | "login"
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Sync mode with URL
  useEffect(() => {
    if (location.pathname === "/login") {
      setMode("login");
    } else if (location.pathname === "/signup") {
      setMode("signup");
    }
  }, [location.pathname]);

  const handleSubmit = async () => {
    if (mode === "signup") {
      if (!name || !mobile || !email || !password) {
        setError("Please fill all fields");
        return;
      }
      if (!/^\d{10}$/.test(mobile)) {
        setError("Mobile number must be 10 digits");
        return;
      }
    } else {
      if (!email || !password) {
        setError("Email and password are required");
        return;
      }
    }

    setLoading(true);
    setError("");

    const url =
      mode === "signup"
        ? "http://localhost:5000/api/signup"
        : "http://localhost:5000/api/login";

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "signup"
            ? { name, mobile, email, password }
            : { email, password }
        ),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Request failed");
        return;
      }

      alert(mode === "signup" ? "Signup successful!" : "Login successful!");
      console.log(data);
    } catch (err) {
      setError("Backend not reachable");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginsignup">
      <div className="loginsignup-container">
        <h1>{mode === "signup" ? "Sign Up" : "Login"}</h1>

        <div className="loginsignup-fields">
          {mode === "signup" && (
            <>
              <input
                type="text"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <input
                type="tel"
                placeholder="Mobile Number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />
            </>
          )}

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button onClick={handleSubmit} disabled={loading}>
          {loading
            ? mode === "signup"
              ? "Creating account..."
              : "Logging in..."
            : mode === "signup"
            ? "Continue"
            : "Login"}
        </button>

        {error && <p className="error-text">{error}</p>}

        {mode === "signup" ? (
          <p className="loginsignup-login">
            Already have an account?{" "}
            <span onClick={() => navigate("/login")}>Login here</span>
          </p>
        ) : (
          <p className="loginsignup-login">
            Don’t have an account?{" "}
            <span onClick={() => navigate("/signup")}>Sign up</span>
          </p>
        )}

        {mode === "signup" && (
          <div className="loginsignup-agree">
            <input type="checkbox" />
            <p>By continuing, I agree to the terms of use & privacy policy</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginSignup;