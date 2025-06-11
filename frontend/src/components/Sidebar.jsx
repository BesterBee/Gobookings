import React from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";

function Sidebar() {
  return (
    <div className="sidebar">
      <NavLink 
        to="/" 
        className={({ isActive }) => 
          "sidebar-link" + (isActive ? " active" : "")}
        end
      >
        Dashboard
      </NavLink>
      <NavLink 
        to="/bus" 
        className={({ isActive }) => 
          "sidebar-link" + (isActive ? " active" : "")}
      >
        Bus Bookings
      </NavLink>
      <NavLink 
        to="/conference" 
        className={({ isActive }) => 
          "sidebar-link" + (isActive ? " active" : "")}
      >
        Conference Bookings
      </NavLink>
      <NavLink 
        to="/recent" 
        className={({ isActive }) => 
          "sidebar-link" + (isActive ? " active" : "")}
      >
        Recent Bookings
      </NavLink>
    </div>
  );
}

export default Sidebar;
