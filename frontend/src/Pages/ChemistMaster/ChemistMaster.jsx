import React from 'react';
import './ChemistMaster.scss';

export default function ChemistMaster() {
  return (
    <div className="chemist-master">
      <h1>CHEMIST MASTER</h1>
      <div className="form-container">
       
        <div className="form-row">
          <div className="form-group">
            <label>Name</label>
            <input type="text" />
          </div>
          <div className="form-group">
            <label>Owner Name</label>
            <input type="text" />
          </div>
        </div>

        
        <div className="form-row">
          <div className="form-group">
            <label>Search Place</label>
            <input type="text" placeholder="Enter area, city, etc." />
          </div>
          <div className="form-group">
            <label>Address Line 1</label>
            <input type="text" />
          </div>
        </div>

       
        <div className="form-row">
          <div className="form-group">
            <label>Address Line 2</label>
            <input type="text" />
          </div>
          <div className="form-group">
            <label>Address Line 3</label>
            <input type="text" />
          </div>
        </div>

        
        <div className="form-row">
          <div className="form-group">
            <label>Address Line 4</label>
            <input type="text" />
          </div>
          <div className="form-group">
            <label>Address Line 5 (e.g., Postal Code)</label>
            <input type="text" />
          </div>
        </div>

      
        <div className="form-row">
          <div className="form-group">
            <label>Mobile Number</label>
            <input type="tel" maxLength="10" placeholder="10 digits" />
          </div>
          <div className="form-group">
            <label>Status</label>
            <div>
              <label style={{ marginRight: '10px' }}><input type="radio" name="status" value="active" defaultChecked /> Active</label>
              <label><input type="radio" name="status" value="inactive" /> Inactive</label>
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