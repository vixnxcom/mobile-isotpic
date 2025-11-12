// App.jsx
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";


import Inventory from "../inventory/Inventory";
import Credit from "../credit/Credit";
import Debit from "../debit/Debit";
import Invoice from "../invoice/Invoice";
import { useState } from "react";
import { home, credit, debit, invent, invoice, close, open, cloud, admin } from "../assets";
import Header from "./Header";
import Footer from "./Footer";
import Home from "../home/Home";
import ButtonPages from "./ButtonPages";

function Pages() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

 
const menuItems = [
  { title: "Inventory", color: "text-white",  path: "/inventory", icon: invent},
  { title: "Credit Account", color: "text-white", path: "/credit", icon: credit },
  { title: "Debit Account", color: "text-white", path: "/debit", icon: debit },
  { title: "Generate Invoice", color: "text-white", path: "/invoice", icon: invoice },
];

  return (
    <Router>
         {/* header */}
      <div className="">
        <Header />
      </div>
       {/* haeder */}




    {/* navbar */}
      <div className="flex min-h-screen">
    <div
  className={`bg-white gray200 p-6 transition-all duration-300
    ${sidebarOpen ? "w-64" : "w-0 overflow-hidden"}`}
>
  {sidebarOpen && (
    <>
    {/* <img src={admin} alt="" className="w-10  " /> */}
      <h1 className="text-2xl aeon-bold gray200 mb-8">My Dashboard</h1>
      <nav className="space-y-4 ">
        <Link 
          to="/" 
          className="block hover:bg-gray-200 inter border flex flex-row  border-gray-200 px-1 py-2
           bg-white rounded-[8px]"
        > <span><img src={home} className="w-4 h-4 mr-2 mt-1" /></span>
          Home
        </Link>
        {menuItems.map((item, idx) => (
  <Link
    key={idx}
    to={item.path}
    className="flex flex-row items-center hover:bg-gray-200 inter border border-gray-200
     px-1 py-2 bg-white rounded-[8px]"
  >
    <span>
      <img src={item.icon} className="w-4 h-4 mr-2" />
    </span>
    {item.title}
  </Link>
))}

      </nav>
    </>
  )}
</div>
    {/* navbar */}

        {/* Main Content */}
      <div className="flex-1 bg-purple-100 p-4 w-[100vw] min-h-screen rounded-[14px]">
       
          {/* Toggle Button */}
       <button
  onClick={() => setSidebarOpen(!sidebarOpen)}
  className="mb-4 px-4 py-2 bg-white flex flex-row   items-center gap-2 text-xs border border-gray-200 rounded-[14px] 
  hover:bg-gray-200"
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
                <div className="">
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
                </div>
              }
            />
            <Route path="/" element={<Home />} />
            <Route path="/dash" element={<ButtonPages />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/credit" element={<Credit />} />
            <Route path="/debit" element={<Debit />} />
            <Route path="/invoice" element={<Invoice />} />
          </Routes>
        </div>
      </div>


    <div>
        <Footer />
    </div>


    </Router>
  );
}

export default Pages;


