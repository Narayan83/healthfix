import React from 'react';
import './DesignationMaster.scss'; 

export default function DesignationMaster() {
  return (
    <div className="designation-master">
      <h1>DESIGNATION MASTER</h1>
      <div className="form-container">

        <div className="form-row">
          <div className="form-group">
            <label>Name</label>
            <input type="text" placeholder="Enter designation name" />
          </div>
          <div className="form-group">
           
          </div>
        </div>

       
        <div className="form-row">
          <div className="form-group">
            <label>Order</label>
            <input type="number" placeholder="Enter sort order" />
          </div>
          <div className="form-group">
        
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