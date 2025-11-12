import React, { useState } from 'react'
import { Link } from 'react-router-dom';
import { home, credit, debit, invent, invoice, close, open, cloud, admin } from "../assets";

const Menu = () => {
    
        
         
        const menuItems = [
          { title: "Inventory", color: "text-white",  path: "/inventory", icon: invent},
          { title: "Credit Account", color: "text-white", path: "/credit", icon: credit },
          { title: "Debit Account", color: "text-white", path: "/debit", icon: debit },
          { title: "Generate Invoice", color: "text-white", path: "/invoice", icon: invoice },
        ];

        return (
           <div>
             <>
                  <h2 className="text-3xl aeon-bold text-gray-700 mb-6">
                    
                    Dashboard
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {menuItems.map((item, index) => (
                      <Link
                        to={item.path}
                        key={index}
                        className={`p-8 rounded-xl shadow-md border border-gray-200 intermid text-lg bg-cloud
                           flex items-center justify-center hover:scale-105 transform transition-all fleex flex-col
                           cursor-pointer ${item.color}`}
                      ><span>
                      <img src={item.icon} className="w-6 h-6 mr-2" />
                       </span>

                        {item.title}
                      </Link>
                    ))}
                  </div>
                </>
    </div>
  )
}

export default Menu
