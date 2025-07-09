import React from 'react'
function Card({ title, children }) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-text mb-4">{title}</h2>
        {children}
      </div>
    )
  }
  
  export default Card