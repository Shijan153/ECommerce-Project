import React, { useContext, useState, useEffect } from 'react';
import { ShopContext } from '../../Context/ShopContext';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

const Profile = () => {
  const { userData, userDataLoading, updateUserProfile, token } = useContext(ShopContext);
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    mobile: '',
    house_no: '',
    street: '',
    postal_code: '',
    city_id: ''
  });
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
  }, [token, navigate]);

  useEffect(() => {
    if (!userDataLoading && token && !userData) {
      console.debug('Profile redirect: no userData while token exists');
      navigate('/login');
    }
  }, [userDataLoading, userData, token, navigate]);

  useEffect(() => {
    if (userData) {
      setFormData({
        mobile: userData.mobile || '',
        house_no: userData.house_no || '',
        street: userData.street || '',
        postal_code: userData.postal_code || '',
        city_id: userData.city_id || ''
      });
    }
  }, [userData]);

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/cities');
      const data = await response.json();
      setCities(data.data || []);
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    // Validation
    if (!formData.mobile || !formData.house_no || !formData.street || !formData.postal_code || !formData.city_id) {
      setMessage('Please fill all required fields');
      return;
    }
    if (!/^\d{11}$/.test(formData.mobile)) {
      setMessage('Mobile number must be exactly 11 digits');
      return;
    }

    setLoading(true);
    const result = await updateUserProfile(
      formData.mobile,
      formData.house_no,
      formData.street,
      formData.postal_code,
      formData.city_id
    );

    setLoading(false);
    if (result.success) {
      setMessage('Profile updated successfully!');
      setIsEditing(false);
    } else {
      setMessage(result.message || 'Failed to update profile');
    }
  };

  if (userDataLoading) {
    return (
      <div className="profile">
        <div className="profile-container">
          <div className="profile-loading">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="profile">
        <div className="profile-container">
          <div className="profile-loading">No profile data available. Please log in.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile">
      <div className="profile-container">
        <h1>My Profile</h1>

        <div className="profile-section">
          <h2>Personal Information</h2>
          <div className="profile-info">
            <p><strong>Name:</strong> {userData.name}</p>
            <p><strong>Email:</strong> {userData.email}</p>
            <p><strong>Phone:</strong> {isEditing ? (
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleInputChange}
                placeholder="Phone number"
              />
            ) : userData.mobile}</p>
          </div>
        </div>

        <div className="profile-section">
          <h2>Address Information</h2>
          <div className="profile-info">
            <p><strong>House No:</strong> {isEditing ? (
              <input
                type="text"
                name="house_no"
                value={formData.house_no}
                onChange={handleInputChange}
                placeholder="House number"
              />
            ) : userData.house_no}</p>
            <p><strong>Street:</strong> {isEditing ? (
              <input
                type="text"
                name="street"
                value={formData.street}
                onChange={handleInputChange}
                placeholder="Street"
              />
            ) : userData.street}</p>
            <p><strong>Postal Code:</strong> {isEditing ? (
              <input
                type="text"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleInputChange}
                placeholder="Postal code"
              />
            ) : userData.postal_code}</p>
            <p><strong>City:</strong> {isEditing ? (
              <select
                name="city_id"
                value={formData.city_id}
                onChange={handleInputChange}
              >
                <option value="">Select City</option>
                {cities.map(city => (
                  <option key={city.city_id} value={city.city_id}>
                    {city.city_name}
                  </option>
                ))}
              </select>
            ) : cities.find(c => c.city_id === userData.city_id)?.city_name}</p>
          </div>
        </div>

        {message && (
          <div className={`profile-message ${message.includes('successfully') ? '' : 'profile-error'}`}>
            {message}
          </div>
        )}

        <div className="profile-actions">
          {isEditing ? (
            <>
              <button onClick={handleSubmit} disabled={loading} className="save-btn">
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={() => setIsEditing(false)} className="cancel-btn">
                Cancel
              </button>
            </>
          ) : (
            <button onClick={() => setIsEditing(true)} className="edit-btn">
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;