import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import images from "../../../assets/images";
import Button from "@mui/material/Button";
import { MdOutlineMenuOpen, MdOutlineMenu } from "react-icons/md";
import AdminTopSearchBar from "../AdminTopSearchBar/AdminTopSearchBar";
import { CiLight } from "react-icons/ci";
import { IoIosNotificationsOutline } from "react-icons/io";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import Settings from "@mui/icons-material/Settings";
import Logout from "@mui/icons-material/Logout";
import { myContext } from "../../../App";

function Header() {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const context = useContext(myContext);

  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("isAuthenticated");
    setAnchorEl(null);
    navigate("/login");
  };

  const displayName = storedUser
    ? `${storedUser.firstname || ""} ${storedUser.lastname || ""}`.trim() || storedUser.email
    : "User";

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="hf-header">
      <div className="hf-header-inner">
        <Button
          className="hf-icon-btn hf-menu-toggle"
          onClick={() => context.setIsToggleSideBar(!context.isToggleSideBar)}
          aria-label="Toggle menu"
        >
          {context.isToggleSideBar ? <MdOutlineMenu /> : <MdOutlineMenuOpen />}
        </Button>

        <Link to="/home" className="hf-brand">
          Health<span>Fix</span>
        </Link>

        <div className="hf-header-search d-none d-md-flex">
          <AdminTopSearchBar />
        </div>

        <div className="hf-header-actions">
          <Button className="hf-icon-btn" aria-label="Theme">
            <CiLight />
          </Button>
          <Button className="hf-icon-btn" aria-label="Notifications">
            <IoIosNotificationsOutline />
          </Button>

          <Button
            className="hf-user-btn"
            onClick={(e) => setAnchorEl(e.currentTarget)}
            aria-label="Account menu"
          >
            <Avatar
              className="hf-user-avatar"
              src={images.userIcon}
              alt={displayName}
              sx={{ width: 36, height: 36, fontSize: "0.8rem" }}
            >
              {initials}
            </Avatar>
            <div className="hf-user-meta d-none d-md-block">
              <span className="hf-user-name">{displayName}</span>
              <span className="hf-user-role">Administrator</span>
            </div>
          </Button>

          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={() => setAnchorEl(null)}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          >
            <MenuItem onClick={() => { setAnchorEl(null); navigate("/profile"); }}>
              <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={() => { setAnchorEl(null); navigate("/home"); }}>
              <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
              Dashboard
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </div>
      </div>
    </header>
  );
}

export default Header;
