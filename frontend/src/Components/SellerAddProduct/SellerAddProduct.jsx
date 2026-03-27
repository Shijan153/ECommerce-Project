import React, { useState } from "react";
import "./SellerAddProduct.css";

const SellerAddProduct = ({ onProductAdded }) => {
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const [productData, setProductData] = useState({
    name: "",
    category: "",
    new_price: "",
    old_price: "",
    description: "",
    stock: "",
    sizes: [],
  });

  const [selectedSizes, setSelectedSizes] = useState({
    S: false,
    M: false,
    L: false,
    XL: false,
    XXL: false,
  });

  const [imageFile, setImageFile] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProductData({ ...productData, [name]: value });
  };

  const handleSizeChange = (size) => {
    const updatedSizes = { ...selectedSizes, [size]: !selectedSizes[size] };
    setSelectedSizes(updatedSizes);
    const sizesArray = Object.keys(updatedSizes).filter(key => updatedSizes[key]);
    setProductData({ ...productData, sizes: sizesArray });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) {
      alert("Please select an image");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", productData.name);
      formData.append("category", productData.category);
      formData.append("new_price", productData.new_price);
      formData.append("old_price", productData.old_price);
      formData.append("description", productData.description);
      formData.append("stock", productData.stock);
      formData.append("sizes", JSON.stringify(productData.sizes));
      formData.append("image", imageFile);

      const token = localStorage.getItem("seller-token");
      const response = await fetch("http://localhost:5000/api/seller/products", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }

      if (response.ok) {
        alert("Product added successfully!");
        setProductData({ name: "", category: "", new_price: "", old_price: "", description: "", stock: "", sizes: [] });
        setSelectedSizes({ S: false, M: false, L: false, XL: false, XXL: false });
        setImageFile(null);
        setPreviewImage(null);
        if (onProductAdded) onProductAdded();
      } else {
        alert(data.message || "Error adding product");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="seller-add-product">
      <h2>Add New Product</h2>
      <form onSubmit={handleSubmit} className="add-product-form">
        <div className="form-group">
          <label>Product Name:</label>
          <input type="text" name="name" value={productData.name} onChange={handleInputChange} required />
        </div>

        <div className="form-group">
          <label>Category:</label>
          <select name="category" value={productData.category} onChange={handleInputChange} required>
            <option value="">Select Category</option>
            <option value="men">Men</option>
            <option value="women">Women</option>
            <option value="kids">Kids</option>
            <option value="electronics">Electronics</option>
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Price (New):</label>
            <input type="number" name="new_price" value={productData.new_price} onChange={handleInputChange} required />
          </div>
          <div className="form-group">
            <label>Old Price:</label>
            <input type="number" name="old_price" value={productData.old_price} onChange={handleInputChange} />
          </div>
        </div>

        <div className="form-group">
          <label>Stock Quantity:</label>
          <input type="number" name="stock" value={productData.stock} onChange={handleInputChange} required />
        </div>

        <div className="form-group">
          <label>Description:</label>
          <textarea name="description" value={productData.description} onChange={handleInputChange} rows="4" required />
        </div>

        <div className="form-group">
          <label>Sizes:</label>
          <div className="size-checkboxes">
            {["S", "M", "L", "XL", "XXL"].map((size) => (
              <label key={size}>
                <input
                  type="checkbox"
                  checked={selectedSizes[size]}
                  onChange={() => handleSizeChange(size)}
                />
                {size}
              </label>
            ))}
          </div>
          {productData.sizes.length > 0 && (
            <div className="selected-sizes-preview">
              Selected: {productData.sizes.join(", ")}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Product Image:</label>
          <input type="file" accept="image/*" onChange={handleImageChange} required />
          {previewImage && (
            <div className="image-preview">
              <img src={previewImage} alt="Preview" />
            </div>
          )}
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Adding Product..." : "Add Product"}
        </button>
      </form>
    </div>
  );
};

export default SellerAddProduct;