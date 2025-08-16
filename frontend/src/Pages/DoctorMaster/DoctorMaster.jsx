import React from 'react';
import './DoctorMaster.scss'; 

export default function DoctorMaster() {
  return (
    <div className="doctor-master">
      <h1>DOCTOR MASTER</h1>
      <div className="form-container">
      
        <div className="form-row">
          <div className="form-group">
            <label>Search Doctor</label>
            <input type="text" placeholder="Search by name, ID, etc." />
          </div>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" />
          </div>
        </div>

       
        <div className="form-row">
          <div className="form-group">
            <label>Address Line 1</label>
            <input type="text" />
          </div>
          <div className="form-group">
            <label>Address Line 2</label>
            <input type="text" />
          </div>
        </div>

        
        <div className="form-row">
          <div className="form-group">
            <label>Address Line 3 (e.g., City/Town)</label>
            <input type="text" />
          </div>
          <div className="form-group">
            <label>Address Line 4 (e.g., State/Province)</label>
            <input type="text" />
          </div>
        </div>

       
        <div className="form-row">
          <div className="form-group">
            <label>Address Line 5 (e.g., Postal Code)</label>
            <input type="text" />
          </div>
          <div className="form-group">
            
          </div>
        </div>

        
        <div className="form-row">
          <div className="form-group">
            <label>Degree</label>
            <select>
              <option value="">Select Degree</option>
              <option value="MBBS">MBBS</option>
              <option value="MD">MD</option>
              <option value="MS">MS</option>
              <option value="BDS">BDS</option>
              <option value="MDS">MDS</option>
              <option value="DNB">DNB</option>
              <option value="mbbs">MBBS</option>
              <option value="md">MD</option>
              <option value="ms">MS</option>
              <option value="do">DO</option>
              <option value="phd">PhD</option>
            </select>
          </div>
          <div className="form-group">
            <label>Department</label>
            <select>
              
              <option value="">Select Department</option>
              <option value="cardiology">Cardiology</option>
              <option value="neurology">Neurology</option>
              <option value="pediatrics">Pediatrics</option>
              <option value="oncology">Oncology</option>
            </select>
          </div>
        </div>

        
        <div className="form-row">
          <div className="form-group">
            <label>Mobile Number</label>
            <input type="tel" maxLength="10" placeholder="10 digits" />
          </div>
          <div className="form-group">
            <label>Hospital Number</label>
            <input type="tel" placeholder="Phone number" />
          </div>
        </div>

        
        <div className="form-row">
          <div className="form-group">
            <label>Gender</label>
            <div>
              <label style={{ marginRight: '10px' }}><input type="radio" name="gender" value="male" /> Male</label>
              <label style={{ marginRight: '10px' }}><input type="radio" name="gender" value="female" /> Female</label>
              <label><input type="radio" name="gender" value="other" /> Other</label>
            </div>
          </div>
          <div className="form-group">
            <label>Date of Birth</label>
            <input type="date" />
          </div>
        </div>


        <div className="form-row">
          <div className="form-group">
            <label>Wedding Anniversary</label>
            <input type="date" />
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