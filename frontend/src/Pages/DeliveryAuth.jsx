import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./CSS/DeliveryAuth.css";

const DeliveryAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const emailRef = useRef(null);
  const [mode, setMode] = useState("login");
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", vehicle_type: "",
    house_no: "", street: "", postal_code: "", city_id: ""
  });

  useEffect(() => {
    // Clear ALL tokens when entering delivery auth pages
    localStorage.removeItem('auth-token');
    localStorage.removeItem('seller-token');
    localStorage.removeItem('admin-token');
    localStorage.removeItem('delivery-token');

    setMode(location.pathname === "/delivery-register" ? "register" : "login");
    setError("");
    fetch("http://localhost:5000/api/cities")
      .then(r => r.json())
      .then(d => setCities(d.data || []))
      .catch(() => {});
  }, [location.pathname]);

  useEffect(() => {
    // Focus email input when component mounts or mode changes
    if (emailRef.current) {
      emailRef.current.focus();
    }
  }, [mode]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    setError("");

    if (mode === "register") {
      if (!form.name || !form.email || !form.phone || !form.password || !form.vehicle_type ||
          !form.house_no || !form.street || !form.postal_code || !form.city_id) {
        setError("All fields are required.");
        return;
      }
      if (!/^\d{11}$/.test(form.phone)) {
        setError("Phone number must be exactly 11 digits.");
        return;
      }
      if (form.password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }
    } else {
      if (!form.email || !form.password) {
        setError("Email and password are required.");
        return;
      }
      if (form.password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }
    }

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/delivery/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await response.json();

      if (response.ok) {
        const deliveryToken = data.data?.token || data.token;
        if (deliveryToken) {
          localStorage.setItem("delivery-token", deliveryToken);
        }
        navigate("/delivery-dashboard");
      } else {
        setError(data.message || "Authentication failed. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // FIX: was "delivery-auth" — CSS defines ".delivery-auth-page" for the outer wrapper
    <div className="delivery-auth-page">
      {/* FIX: was "delivery-auth-box" which is correct, but the parent class was wrong above */}
      <div className="delivery-auth-box">
        <h1>Delivery Partner {mode === "register" ? "Register" : "Login"}</h1>

        <div className="delivery-auth-fields">
          {mode === "register" && (
            <>
              <input name="name" value={form.name} placeholder="Full Name *" onChange={handleChange} />
              <input name="phone" value={form.phone} placeholder="Phone" onChange={handleChange} />
              <select name="vehicle_type" value={form.vehicle_type} onChange={handleChange}>
                <option value="">Vehicle Type</option>
                <option value="bike">Bike</option>
                <option value="bicycle">Bicycle</option>
                <option value="van">Van</option>
                <option value="car">Car</option>
              </select>
              <input name="house_no" value={form.house_no} placeholder="House No" onChange={handleChange} />
              <input name="street" value={form.street} placeholder="Street" onChange={handleChange} />
              <input name="postal_code" value={form.postal_code} placeholder="Postal Code" onChange={handleChange} />
              <select name="city_id" value={form.city_id} onChange={handleChange}>
                <option value="">Select City</option>
                {cities.map(c => (
                  <option key={c.city_id} value={c.city_id}>{c.city_name}</option>
                ))}
              </select>
            </>
          )}
          <input ref={emailRef} name="email" value={form.email} placeholder="Email *" onChange={handleChange} />
          <input name="password" value={form.password} type="password" placeholder="Password *" onChange={handleChange} />
        </div>

        {/* FIX: was className="error" — CSS defines ".delivery-error" */}
        {error && <p className="delivery-error">{error}</p>}

        <button onClick={handleSubmit} disabled={loading}>
          {loading
            ? "Please wait..."
            : mode === "register" ? "Register" : "Login"}
        </button>

        <p className="delivery-toggle">
          {mode === "register" ? "Already registered? " : "New delivery partner? "}
          <span onClick={() => navigate(mode === "register" ? "/delivery-login" : "/delivery-register")}>
            {mode === "register" ? "Login here" : "Create Account"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default DeliveryAuth;