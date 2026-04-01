import React from 'react'
import './DescriptionBox.css'
const DescriptionBox = ({ description }) => {
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
            <div className="descriptionbox-nav-box">Description</div>
            <div className="descriptionbox-nav-box fade">Reviews (122)</div>       
        </div>
        <div className="descriptionbox-description">{body}</div>
    </div>
  )
}

export default DescriptionBox
