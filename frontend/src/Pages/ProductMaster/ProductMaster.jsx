import React from 'react';
import './ProductMaster.scss'; 

export default function ProductMaster() {
    return (
      <div className="product-master">
        <h1>PRODUCT MASTER</h1>
        <div className="form-container">
          {/* Row 1: Product Name */}
          <div className="form-row">
            <div className="form-group">
              <label>Product Name</label>
              <input type="text" />
            </div>
            <div className="form-group">
             
            </div>
          </div>

          
          <div className="form-row">
            <div className="form-group full-width"> 
              <label>Description</label>
              <textarea rows="5"></textarea>
            </div>
          </div>

          
          <div className="form-row">
            <div className="form-group">
              <label>Status</label>
              <div>
                <label style={{ marginRight: '10px' }}><input type="radio" name="status" value="active" defaultChecked /> Active</label>
                <label><input type="radio" name="status" value="inactive" /> Inactive</label>
              </div>
            </div>
            <div className="form-group">
              <label>Product Category</label>
              <div>
                <label style={{ marginRight: '10px' }}><input type="radio" name="productCategory" value="medical" defaultChecked /> Medical</label>
                <label><input type="radio" name="productCategory" value="surgical" /> Surgical</label>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button className="btn-save">SAVE</button>
            <button className="btn-clear">CLEAR</button>
          </div>
        </div>
      </div>
    );
  }