import React, { useEffect, useState, useContext, useRef } from "react";
import "./CSS/SellerAuth.css";
import { useLocation, useNavigate } from "react-router-dom";
import { ShopContext } from "../Context/ShopContext";

const SellerAuth = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { sellerLogin, sellerSignup } = useContext(ShopContext);
  const emailRef = useRef(null);

  const [mode, setMode] = useState("signup");
  const [formData, setFormData] = useState({
    name: "", phone: "", email: "", password: "", storeName: "",
    house_no: "", street: "", postal_code: "", city_id: ""
  });
  const [cities, setCities] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  useEffect(() => {
    // Clear ALL tokens when entering seller auth pages
    localStorage.removeItem('auth-token');
    localStorage.removeItem('seller-token');
    localStorage.removeItem('admin-token');
    localStorage.removeItem('delivery-token');

    if (location.pathname === "/seller-login") setMode("login");
    else setMode("signup");

    fetch("http://localhost:5000/api/cities")
      .then(res => res.json())
      .then(data => setCities(data.data || []))
      .catch(() => {});
  }, [location.pathname]);

  useEffect(() => {
    // Focus email input when component mounts or mode changes
    if (emailRef.current) {
      emailRef.current.focus();
    }
  }, [mode]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    setError("");

    if (mode === "signup") {
      if (!formData.name || !formData.phone || !formData.email || !formData.password || !formData.storeName ||
          !formData.house_no || !formData.street || !formData.postal_code || !formData.city_id) {
        setError("All fields are required.");
        return;
      }
      if (!/^\d{11}$/.test(formData.phone)) {
        setError("Phone number must be exactly 11 digits.");
        return;
      }
      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }
      if (!agreeTerms) {
        setError("Please agree to the terms and conditions.");
        return;
      }
    } else {
      if (!formData.email || !formData.password) {
        setError("Email and password are required.");
        return;
      }
      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }
    }

    setLoading(true);
    try {
      // FIX: use result.success / result.message instead of try/catch on throw
      // because sellerLogin/sellerSignup return {success, message} objects, never throw.
      if (mode === "signup") {
        const result = await sellerSignup(
          formData.name,
          formData.phone,
          formData.email,
          formData.password,
          formData.storeName,
          formData.house_no,
          formData.street,
          formData.postal_code,
          formData.city_id
        );
        if (result.success) {
          navigate("/seller-dashboard");
        } else {
          setError(result.message || "Signup failed. Please try again.");
        }
      } else {
        const result = await sellerLogin(formData.email, formData.password);
        if (result.success) {
          navigate("/seller-dashboard");
        } else {
          setError(result.message || "Login failed. Check your credentials.");
        }
      }
    } catch (err) {
      // Genuine unexpected errors (e.g. context not available)
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="seller-auth">
      <div className="seller-auth-container">
        <h1>{mode === "signup" ? "Become a Seller" : "Seller Login"}</h1>

        <div className="seller-auth-fields">
          {mode === "signup" && (
            <>
              <input name="name" placeholder="Full Name *" value={formData.name} onChange={handleChange} />
              <input name="storeName" placeholder="Store Name *" value={formData.storeName} onChange={handleChange} />
              <input name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} />
              <div className="address-fields">
                <input name="house_no" placeholder="House No" value={formData.house_no} onChange={handleChange} />
                <input name="street" placeholder="Street" value={formData.street} onChange={handleChange} />
                <input name="postal_code" placeholder="Postal Code" value={formData.postal_code} onChange={handleChange} />
                <select name="city_id" value={formData.city_id} onChange={handleChange}>
                  <option value="">Select City</option>
                  {cities.map(c => (
                    <option key={c.city_id} value={c.city_id}>{c.city_name}</option>
                  ))}
                </select>
              </div>
            </>
          )}
          <input ref={emailRef} name="email" type="email" placeholder="Email *" value={formData.email} onChange={handleChange} />
          <input name="password" type="password" placeholder="Password *" value={formData.password} onChange={handleChange} />
        </div>

        {mode === "signup" && (
          <div className="seller-auth-agree">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={() => setAgreeTerms(!agreeTerms)}
            />
            <p>I agree to the <span>Terms of Use &amp; Privacy Policy</span>.</p>
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading}>
          {loading
            ? (mode === "signup" ? "Creating Account..." : "Logging in...")
            : (mode === "signup" ? "Create Account" : "Login")}
        </button>

        {error && <p className="error-text">{error}</p>}

        <p className="seller-auth-toggle">
          {mode === "signup" ? "Already have an account? " : "New seller? "}
          <span onClick={() => navigate(mode === "signup" ? "/seller-login" : "/seller-signup")}>
            {mode === "signup" ? "Login here" : "Create Account"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default SellerAuth;