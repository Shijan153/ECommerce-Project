import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./CSS/AdminAuth.css";

const AdminAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const emailRef = useRef(null);
  const [mode, setMode] = useState("login");
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "",
    house_no: "", street: "", postal_code: "", city_id: ""
  });

  useEffect(() => {
    localStorage.removeItem('auth-token');
    localStorage.removeItem('seller-token');
    localStorage.removeItem('admin-token');
    localStorage.removeItem('admin-warehouse'); // ← ADDED
    localStorage.removeItem('delivery-token');

    setMode(location.pathname === "/admin-register" ? "register" : "login");
    setError("");
    setSuccessMsg("");
    fetch("http://localhost:5000/api/cities")
      .then(r => r.json())
      .then(d => setCities(d.data || []))
      .catch(() => {});
  }, [location.pathname]);

  useEffect(() => {
    if (emailRef.current) emailRef.current.focus();
  }, [mode]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    setError("");
    setSuccessMsg("");

    if (mode === "register") {
      if (!form.name || !form.email || !form.phone || !form.password ||
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
      const endpoint = mode === "register" ? "/api/admin/register" : "/api/admin/login";
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await response.json();

      if (response.ok) {
        const adminData = data.data || {};
        const adminToken = adminData.token || data.token;
        if (adminToken) {
          localStorage.setItem("admin-token", adminToken);
        }
        // ← ADDED: persist warehouse so AdminPanel can do warehouse-based UI logic
        if (adminData.warehouse_id) {
          localStorage.setItem("admin-warehouse", JSON.stringify({
            warehouse_id: Number(adminData.warehouse_id),
            warehouse_name: adminData.warehouse_name || `Warehouse ${adminData.warehouse_id}`
          }));
        }
        if (mode === "register") {
          setSuccessMsg("Admin account created! Redirecting to panel...");
          setTimeout(() => navigate("/admin"), 1500);
        } else {
          navigate("/admin");
        }
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
    <div className="admin-auth-page">
      <div className="admin-auth-box">
        <h2>Admin {mode === "register" ? "Registration" : "Login"}</h2>
        <div className="admin-auth-fields">
          {mode === "register" && (
            <>
              <input name="name" value={form.name} placeholder="Admin Name *" onChange={handleChange} />
              <input name="phone" value={form.phone} placeholder="Phone Number" onChange={handleChange} />
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
          <input ref={emailRef} name="email" value={form.email} type="email"
            placeholder="Email *" onChange={handleChange} />
          <input name="password" value={form.password} type="password"
            placeholder="Password *" onChange={handleChange} />
        </div>
        {error && <p className="admin-auth-error">{error}</p>}
        {successMsg && <p className="admin-auth-success">{successMsg}</p>}
        <button onClick={handleSubmit} disabled={loading}>
          {loading ? "Please wait..." : mode === "register" ? "Create Account" : "Login"}
        </button>
        <p className="admin-auth-toggle">
          {mode === "register" ? "Already an admin? " : "Need an admin account? "}
          <span onClick={() => navigate(mode === "register" ? "/admin-login" : "/admin-register")}>
            {mode === "register" ? "Login" : "Create Account"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default AdminAuth;