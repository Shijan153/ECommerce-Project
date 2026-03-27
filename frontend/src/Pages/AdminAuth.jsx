import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./CSS/AdminAuth.css";

const AdminAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState("login");
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", warehouse_id: ""
  });

  useEffect(() => {
    if (location.pathname === "/admin-register") setMode("register");
    else setMode("login");
    fetchWarehouses();
  }, [location.pathname]);

  const fetchWarehouses = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/warehouses");
      const data = await res.json();
      setWarehouses(data.data || []);
    } catch { }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    setError("");
    setSuccessMsg("");

    if (mode === "register") {
      if (!form.name || !form.email || !form.password || !form.warehouse_id) {
        setError("Name, email, password and warehouse are required"); return;
      }
    } else {
      if (!form.email || !form.password) {
        setError("Email and password required"); return;
      }
    }

    setLoading(true);
    try {
      const endpoint = mode === "register"
        ? "http://localhost:5000/api/admin/register"
        : "http://localhost:5000/api/admin/login";

      const body = mode === "register"
        ? { name: form.name, email: form.email, phone: form.phone,
            password: form.password, warehouse_id: Number(form.warehouse_id) }
        : { email: form.email, password: form.password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (res.ok) {
        if (mode === "register") {
          setSuccessMsg(`Registration successful! — redirecting...`);
          setTimeout(() => {
            localStorage.setItem("admin-token", data.data.token);
            localStorage.setItem("admin-warehouse", JSON.stringify({ warehouse_id: data.data.warehouse_id, warehouse_name: data.data.warehouse_name }));
            navigate("/admin");
          }, 2500);
        } else {
          localStorage.setItem("admin-token", data.data.token);
          localStorage.setItem("admin-warehouse", JSON.stringify({ warehouse_id: data.data.warehouse_id, warehouse_name: data.data.warehouse_name }));
          navigate("/admin");
        }
      } else {
        setError(data.message || "Failed");
      }
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="admin-auth-page">
      <div className="admin-auth-box">
        <div className="admin-auth-header">
          <div className="admin-icon">🛡️</div>
          <h1>{mode === "register" ? "Admin Registration" : "Admin Login"}</h1>
          <p>Shopper Management System</p>
        </div>

        <div className="admin-auth-fields">
          {mode === "register" && (
            <>
              <input name="name" placeholder="Full Name *" value={form.name} onChange={handleChange} />
              <input name="phone" placeholder="Phone Number" value={form.phone} onChange={handleChange} />
            </>
          )}

          <input name="email" type="email" placeholder="Email Address *" value={form.email} onChange={handleChange} />
          <input name="password" type="password" placeholder="Password *" value={form.password} onChange={handleChange} />

          {mode === "register" && (
            <select name="warehouse_id" value={form.warehouse_id} onChange={handleChange}>
              <option value="">Select Warehouse *</option>
              {warehouses.map(w => (
                <option key={w.warehouse_id} value={w.warehouse_id}>{w.warehouse_name}</option>
              ))}
            </select>
          )}
        </div>

        {error && <p className="admin-auth-error">{error}</p>}
        {successMsg && <p className="admin-auth-success">{successMsg}</p>}

        <button onClick={handleSubmit} disabled={loading}>
          {loading ? "Please wait..." : mode === "register" ? "Register" : "Login"}
        </button>

        <p className="admin-auth-toggle">
          {mode === "register" ? (
            <>Already registered? <span onClick={() => navigate("/admin-login")}>Login here</span></>
          ) : (
            <>New admin? <span onClick={() => navigate("/admin-register")}>Register here</span></>
          )}
        </p>
      </div>
    </div>
  );
};

export default AdminAuth;