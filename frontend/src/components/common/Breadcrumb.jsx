import React from "react";
import { ChevronRight as ChevronRightIcon } from "@mui/icons-material";
import "./Breadcrumb.css";

const Breadcrumb = ({ items, separator = <ChevronRightIcon style={{ fontSize: "16px" }} /> }) => {
  return (
    <nav className="breadcrumb">
      <ol className="breadcrumb-list">
        {items.map((item, index) => (
          <li key={index} className="breadcrumb-item">
            {item.onClick ? (
              <button 
                className="breadcrumb-link" 
                onClick={item.onClick}
                disabled={item.disabled}
              >
                {item.label}
              </button>
            ) : (
              <span className={item.active ? "breadcrumb-active" : "breadcrumb-text"}>
                {item.label}
              </span>
            )}
            {index < items.length - 1 && (
              <span className="breadcrumb-separator">{separator}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;