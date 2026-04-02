import React from 'react'
import './DescriptionBox.css'
const DescriptionBox = ({ description, activeTab, onTabChange, reviewCount }) => {
  const body = description ? (
    <p>{description}</p>
  ) : (
    <>
      <p>
        An e-commerce website is an online platform that facilitates the buying and selling of products or services over the internet. It serves as a virtual marketplace where businesses and individuals can showcase their products, interact with customers, and conduct transactions without the need for a physical presence.
      </p>
      <p>
        E-commerce websites have gained immense popularity due to their convenience, accessibility, and the global reach they offer. They typically display products with detailed descriptions, images, prices, and any available variations (such as sizes or colors). Each product usually has its own dedicated page with relevant information to help the customer make an informed decision.
      </p>
    </>
  );

  return (
    <div className='descriptionbox'>
      <div className="descriptionbox-navigator">
        <div
          className={`descriptionbox-nav-box ${activeTab === 'description' ? 'active' : 'fade'}`}
          onClick={() => onTabChange('description')}
        >
          Description
        </div>
        <div
          className={`descriptionbox-nav-box ${activeTab === 'reviews' ? 'active' : 'fade'}`}
          onClick={() => onTabChange('reviews')}
        >
          Reviews ({reviewCount || 0})
        </div>
      </div>
      <div className="descriptionbox-description">
        {activeTab === 'description' ? body : <p>Select Reviews tab to see customer feedback below.</p>}
      </div>
    </div>
  );
}

export default DescriptionBox;
