import { createContext, useEffect, useState } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import "./styles/main.scss";
// import HomePage from "./AdminSection/AdminPages/HomePage/HomePage";
 import Header from "./AdminSection/AdminComponents/Header/Header";
 import MainSideBar from "./AdminSection/AdminComponents/MainSideBar/MainSideBar";
// import AddProduct from "./AdminSection/AdminPages/AddProduct/AddProduct";
// import ManageProduct from "./AdminSection/AdminPages/ManageProduct/ManageProduct";
// import LoginPage from "./AdminSection/Login/Login";
// import Registration from "./AdminSection/Login/Registration";

import HomePage from "./AdminSection/AdminPages/HomePage/HomePage";
// import AddProduct from "./Products/AddProduct/AddProduct";
// import ManageProduct from "./Products/ManageProduct/ManageProduct";
import LoginPage from "./AdminSection/AdminPages/Login/Login";
import ProductMaster from "./Pages/ProductMaster/ProductMaster";
import DoctorMaster from "./Pages/DoctorMaster/DoctorMaster";
import ChemistMaster from "./Pages/ChemistMaster/ChemistMaster";
import EmployeeMaster from "./Pages/EmployeeMaster/EmployeeMaster";
import DesignationMaster from "./Pages/DesignationMaster/DesignationMaster";



const myContext = createContext();

function AppLayout({ children }) {
  const [isToggleSideBar, setIsToggleSideBar] = useState(false);
  const values = {
    isToggleSideBar,
    setIsToggleSideBar,
  };
  useEffect(()=>{
    // alert('I am '+ isToggleSideBar); 
  },[isToggleSideBar]);


  const location = useLocation();
  const noLayoutRoutes = ['/', '/login'];
  const isNoLayout = noLayoutRoutes.includes(location.pathname);

  return (
    <myContext.Provider value={values}>
      {isNoLayout ? (
        children
      ) : (
        <>
          <Header />
          <div className="main d-flex">
            <div className={`main-side-bar-wraper ${isToggleSideBar === true ? 'toggle-menu' : ''}`}>
              <MainSideBar />
            </div>
            <div className={`content ${isToggleSideBar === true ? 'toggle-menu' : ''}`}>
              {children}
            </div>
          </div>
        </>
      )}
    </myContext.Provider>
  );
}



function App() {


 return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          {/* No-layout routes */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Layout routes */}
          <Route path="/home" element={<HomePage />} />

          <Route path="/product-master" element={<ProductMaster />} />
          <Route path="/doctor-master" element={<DoctorMaster />} />
          <Route path="/chemist-master" element={<ChemistMaster />} />
          <Route path="/employee-master" element={<EmployeeMaster />} />
          <Route path="/designation-master" element={<DesignationMaster />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

export default App;
export { myContext };