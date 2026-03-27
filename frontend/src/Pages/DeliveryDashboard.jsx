import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./CSS/DeliveryDashboard.css";

const StatusBadge = ({ status }) => (
  <span className={`del-status-badge del-status-${status}`}>{status?.replace("_", " ")}</span>
);

const DeliveryDashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("delivery-token");
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("orders");
  const hasFetched = useRef(false);

  const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };

  const fetchProfile = async () => {
    const res = await fetch("http://localhost:5000/api/delivery/profile", { headers });
    const data = await res.json();
    if (res.ok) setProfile(data.data);
    else if (res.status === 401) navigate("/delivery-login");
  };

  const fetchOrders = async () => {
    const res = await fetch("http://localhost:5000/api/delivery/orders", { headers });
    const data = await res.json();
    if (res.ok) setOrders(data.data || []);
  };

  useEffect(() => {
    if (!token) { navigate("/delivery-login"); return; }
    if (hasFetched.current) return;
    hasFetched.current = true;
    Promise.all([fetchProfile(), fetchOrders()]).finally(() => setLoading(false));
  }, [token]);

  const handleStatusUpdate = async (order_id, order_status) => {
    try {
      const res = await fetch(`http://localhost:5000/api/delivery/orders/${order_id}/status`, {
        method: "PUT", headers,
        body: JSON.stringify({ order_status })
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(prev => prev.map(o =>
          o.order_id === order_id ? { ...o, order_status } : o
        ));
        setError("");
      } else setError(data.message);
    } catch { setError("Failed to update status"); }
  };

  const handleLogout = () => {
    localStorage.removeItem("delivery-token");
    navigate("/delivery-login");
  };

  const pendingOrders = orders.filter(o => o.order_status === "assigned");
  const activeOrders = orders.filter(o => ["picked","on_the_way"].includes(o.order_status));
  const completedOrders = orders.filter(o => o.order_status === "delivered");

  if (loading) return <div className="del-loading">Loading...</div>;

  return (
    <div className="delivery-dashboard">
      <div className="del-sidebar">
        <div className="del-brand">
          <div className="del-avatar">{profile?.name?.charAt(0).toUpperCase()}</div>
          <h3>{profile?.name}</h3>
          <p>{profile?.warehouse_name}</p>
          <span className="del-vehicle">{profile?.vehicle_type || "N/A"}</span>
        </div>

        <nav className="del-nav">
          <button className={activeTab === "orders" ? "active" : ""} onClick={() => setActiveTab("orders")}>
            📦 My Orders
            {pendingOrders.length > 0 && <span className="del-badge">{pendingOrders.length}</span>}
          </button>
          <button className={activeTab === "profile" ? "active" : ""} onClick={() => setActiveTab("profile")}>
            👤 Profile
          </button>
        </nav>

        <button className="del-logout" onClick={handleLogout}>Logout</button>
      </div>

      <div className="del-content">
        {error && <div className="del-error" onClick={() => setError("")}>{error} ✕</div>}

        {activeTab === "orders" && (
          <div>
            <div className="del-stats">
              <div className="del-stat-card">
                <h3>{pendingOrders.length}</h3>
                <p>Pending Pickup</p>
              </div>
              <div className="del-stat-card active">
                <h3>{activeOrders.length}</h3>
                <p>In Transit</p>
              </div>
              <div className="del-stat-card completed">
                <h3>{completedOrders.length}</h3>
                <p>Delivered</p>
              </div>
            </div>

            <h2 className="del-section-title">Assigned Orders</h2>

            {orders.length === 0 ? (
              <div className="del-empty">
                <p>🚴 No orders assigned yet</p>
                <p>Check back later for new deliveries</p>
              </div>
            ) : (
              <div className="del-orders-list">
                {orders.map(order => (
                  <div key={order.order_id} className={`del-order-card ${order.order_status}`}>
                    <div className="del-order-header">
                      <strong>Order #{order.order_id}</strong>
                      <StatusBadge status={order.order_status} />
                    </div>

                    <div className="del-order-body">
                      <div className="del-order-info">
                        <p>📍 <strong>{order.shipping_address}</strong></p>
                        <p>📞 {order.phone_number}</p>
                        <p>💰 ${parseFloat(order.total_amount).toFixed(2)} — {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Paid Online'}</p>
                        {order.order_notes && <p>📝 {order.order_notes}</p>}
                      </div>

                      <div className="del-order-items">
                        {order.items?.filter(i => i.product_id).map((item, idx) => (
                          <div key={idx} className="del-item-row">
                            <img
                              src={item.image_url ? `http://localhost:5000${item.image_url}` : 'https://placehold.co/40x40'}
                              alt={item.product_name}
                            />
                            <span>{item.product_name} × {item.quantity}
                              {item.selected_size && <em> ({item.selected_size})</em>}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="del-order-actions">
                      {order.order_status === "assigned" && (
                        <button className="del-btn picked"
                          onClick={() => handleStatusUpdate(order.order_id, "picked")}>
                          ✓ Mark as Picked Up
                        </button>
                      )}
                      {order.order_status === "picked" && (
                        <button className="del-btn on-way"
                          onClick={() => handleStatusUpdate(order.order_id, "on_the_way")}>
                          🚴 On The Way
                        </button>
                      )}
                      {order.order_status === "on_the_way" && (
                        <button className="del-btn delivered"
                          onClick={() => handleStatusUpdate(order.order_id, "delivered")}>
                          ✓ Mark as Delivered
                        </button>
                      )}
                      {order.order_status === "delivered" && (
                        <span className="del-done">✓ Delivered</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "profile" && profile && (
          <div className="del-profile">
            <h2>My Profile</h2>
            <div className="del-profile-card">
              <div className="del-profile-avatar">{profile.name?.charAt(0).toUpperCase()}</div>
              <div className="del-profile-info">
                <div className="del-profile-row"><span>Name</span><strong>{profile.name}</strong></div>
                <div className="del-profile-row"><span>Email</span><strong>{profile.email}</strong></div>
                <div className="del-profile-row"><span>Phone</span><strong>{profile.phone || "N/A"}</strong></div>
                <div className="del-profile-row"><span>Vehicle</span><strong>{profile.vehicle_type || "N/A"}</strong></div>
                <div className="del-profile-row"><span>Warehouse</span><strong>{profile.warehouse_name}</strong></div>
                <div className="del-profile-row"><span>ID</span><strong>#{profile.deliveryman_id}</strong></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryDashboard;