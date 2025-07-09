import React from 'react';
const  Button = () => {
    return (
      <button
        className={`px-4 py-2 bg-primary text-white rounded-md hover:bg-secondary transition ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  }
  
  export default Button