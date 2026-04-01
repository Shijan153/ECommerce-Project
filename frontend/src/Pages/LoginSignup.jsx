import React, { useEffect, useState, useContext } from "react";
import "./CSS/LoginSignup.css";
import { useLocation, useNavigate } from "react-router-dom";
import { ShopContext } from "../Context/ShopContext";

const LoginSignup = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { customerLogin, customerSignup } = useContext(ShopContext);

  const [mode, setMode] = useState("signup");

  // Basic fields
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Address fields
  const [houseNo, setHouseNo] = useState("");
  const [street, setStreet] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [cityId, setCityId] = useState("");
  const [cities, setCities] = useState([]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // clear role tokens when accessing customer login/signup so role switch is always explicit
    localStorage.removeItem('seller-token');
    localStorage.removeItem('admin-token');
    localStorage.removeItem('delivery-token');

    if (location.pathname === "/login") setMode("login");
    else if (location.pathname === "/signup") setMode("signup");
  }, [location.pathname]);

  // Fetch cities when in signup mode
  useEffect(() => {
    if (mode === "signup") {
      fetch("http://localhost:5000/api/cities")
        .then(res => res.json())
        .then(data => setCities(data.data || []))
        .catch(() => setCities([]));
    }
  }, [mode]);

  const handleSubmit = async () => {
    setError("");

    if (mode === "signup") {
      if (!name || !mobile || !email || !password || !houseNo || !street || !postalCode || !cityId) {
        setError("Please fill all required fields");
        return;
      }
      if (!/^\d{11}$/.test(mobile)) {
        setError("Mobile number must be exactly 11 digits");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters long");
        return;
      }
      if (!agreeTerms) {
        setError("Please agree to the terms and conditions");
        return;
      }
    } else {
      if (!email || !password) {
        setError("Email and password are required");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters long");
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        const result = await customerSignup(
          name, mobile, email, password,
          houseNo, street, postalCode, cityId
        );
        if (result.success) {
          navigate("/login");
        } else {
          setError(result.message || "Signup failed");
        }
      } else {
        const result = await customerLogin(email, password);
        if (result.success) {
          navigate("/");
        } else {
          setError(result.message || "Login failed");
        }
      }
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

          {/* ── Basic Info ── */}
          {mode === "signup" && (
            <>
              <input
                type="text"
                placeholder="Your Name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                type="tel"
                placeholder="Mobile Number *"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />
            </>
          )}

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

          {/* ── Address Fields (signup only, all mandatory) ── */}
          {mode === "signup" && (
            <>
              <p className="loginsignup-section-label">Address</p>

              <input
                type="text"
                placeholder="House No * (e.g. H-01)"
                value={houseNo}
                onChange={(e) => setHouseNo(e.target.value)}
              />

              <input
                type="text"
                placeholder="Street / Area *"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
              />

              <input
                type="text"
                placeholder="Postal Code *"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
              />

              <select
                value={cityId}
                onChange={(e) => setCityId(e.target.value)}
                className="loginsignup-select"
              >
                <option value="">Select City *</option>
                {cities.map(city => (
                  <option key={city.city_id} value={city.city_id}>
                    {city.city_name}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>

        <button onClick={handleSubmit} disabled={loading}>
          {loading
            ? mode === "signup" ? "Creating account..." : "Logging in..."
            : mode === "signup" ? "Continue" : "Login"}
        </button>

        {error && <p className="error-text">{error}</p>}

        {mode === "signup" ? (
          <p className="loginsignup-login">
            Already have an account?{" "}
            <span onClick={() => navigate("/login")}>Login here</span>
          </p>
        ) : (
          <p className="loginsignup-login">
            Don't have an account?{" "}
            <span onClick={() => navigate("/signup")}>Sign up</span>
          </p>
        )}

        {mode === "signup" && (
          <div className="loginsignup-agree">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
            />
            <p>By continuing, I agree to the terms of use & privacy policy</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginSignup;
