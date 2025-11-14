import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";


import Inventory from "./inventory/Inventory";
import Credit from "./credit/Credittt";
import Debit from "./debit/Debit";
import Invoice from "./invoice/Invoice";
import { useState } from "react";

import Payroll from './payroll/PayrollPanel';
import { admin, atm, brief, calc, close, credit, dcard, debit, file, hand, home, invent, invoice, open, pass } from "./assets";



function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { title: "Inventory", color: "text-white", path: "/inventory", icon: invent, protected: false },
    { title: "Credit Account", color: "text-white", path: "/credit", icon: debit, protected: true },
      { title: "Payroll Account", color: "text-white", path: "/payroll", icon: brief, protected: true },
       { title: "Generate Invoice", color: "text-white", path: "/invoice", icon: invoice, protected: false },
    { title: "Debit Account", color: "text-white", path: "/debit", icon: credit, protected: false },
  
   
  ];

   const dashboardCards = [
    { title: "Inventory", color: "text-black", path: "/inventory", icon: calc, protected: false },
    { title: "Credit Account", color: "text-black", path: "/credit", icon: dcard, protected: true },
    // { title: "Debit Account", color: "text-black", path: "/pages/debit", icon: atm, protected: false },
    { title: "Payroll Account", color: "text-black", path: "/payroll", icon: atm, protected: true },
    { title: "Invoice", color: "text-black", path: "invoice", icon: file, protected: false },
  ];

  return (
    <Router>
      <div className="flex min-h-screen">
        {/* Sidebar */}
      {/* Sidebar */}
<div
  className={`bg-white gray200 p-6 transition-all duration-300
    ${sidebarOpen ? "w-64" : "w-0 overflow-hidden"}`}
>
  {sidebarOpen && (
    <>
       <div>
                <img src={admin} className="w-12 border bg-purple-100 border-purple-200 rounded-full"/>
                <h1 className="text-2xl aeon-bold gray200 mb-8">My Dashboard</h1>
              </div>
      <nav className="space-y-4 ">
       <Link
                  to="/"
                  className="block hover:bg-purple-200 inter border flex flex-row 
                  border-gray-200 px-1 py-2 bg-white rounded-[5px] outline-none
                  "
                >
                  <span>
                    <img src={home} className="w-5 h-5 mr-2 mx-2" />
                  </span>
                  Home
                </Link>
        {menuItems.map((item, idx) => (
          <Link
            key={idx}
            to={item.path}
              className="flex flex-row items-center hover:bg-purple-200 inter border 
                      border-gray-200 px-1 py-2  bg-white rounded-[8px]"
          >
            <img src={item.icon} className="w-5 h-5 mr-2 mx-2" />
            {item.title}
          </Link>
        ))}
      </nav>
    </>
  )}
</div>


        {/* Main Content */}
      <div className="flex-1 bg-purple-50 p-5 w-[100vw] min-h-screen">
       
          {/* Toggle Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="mb-4 px-4 py-2 bg-white flex flex-row items-center gap-2 text-xs mt-5
            border border-gray-300 shadow-xs rounded-[14px] hover:border-purple-300 hover:shadow-md inter "
          >
            <img
              src={sidebarOpen ? close : open}
              alt={sidebarOpen ? "Close sidebar" : "Open sidebar"}
              className="w-4 h-4"
            />
            {sidebarOpen ? "Close Menu" : "Open Menu"}
          </button>

          <Routes>
            <Route
              path="/"
              element={
                <>
                 <div className="bg-mobile w-full h-[600px]">
                      <div className='py-2 px-6 flex flex-row rounded-[14px] shadow-sm border border-purple-200 inter
                        text-xl bg-white flex items-left justify-left'>
                    <p className="mb-2 inter tracking-wide flex flex-row">
                      <span><img src={hand} className="w-8 mr-2" /></span>
                      <span className="mt-1">Hi, Welcome Back! </span>
                    </p>
                    <p className="text-gray-500 text-sm inter mt-2  mx-2"><span className="aeon-bold text-blue-600 mx-2 text-md">Alkab Nig Ltd </span>What would you like to do today?</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">

                   
                  
                  {dashboardCards.map((card, index) =>  (
                      <Link
                        to={card.path}
                        key={index}
                       className={`py-12 px-6  rounded-[16px] shadow-md border border-purple-200 inter
                          text-xl bg-white flex items-left justify-left hover:scale-105 transform 
                          hover:bg-[#051077] hover:!text-white transition-all cursor-pointer ${card.color}`}
                      >
                        <span className="w-12 h-12 rounded-full border-purple-500 bg-purple-200 flex items-center justify-center">
                            <img src={card.icon} className="w-8" />
                          </span>
                        <span className="mt-2 mx-4">{card.title}</span>
                          <span className="ml-auto text-2xl w-6 h-6 mt-2">
                         </span>
                      </Link>
                    ))}
                  </div>
                  </div>
                </>
              }
            />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/credit" element={<Credit />} />
            <Route path="/payroll" element={<Payroll />} />
            <Route path="/invoice" element={<Invoice />} />
            <Route path="/debit" element={<Debit />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;