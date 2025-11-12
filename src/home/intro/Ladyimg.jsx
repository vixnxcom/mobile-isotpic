import React from 'react'
import { cheer, img, lady } from '../../assets'

const Ladyimg = () => {
  return (
    <div className="flex justify-center items-center mx-auto p-12 mt-20 mb-20">
      <div className="flex flex-row flex-wrap md:flex-nowrap mx-auto gap-20 w-full items-center">
      

        {/* Text */}
        <div className="flex flex-col justify-center w-full md:w-1/2 max-w-[500px] ">
          <h1 className="text-[40px] aeon-bold leading-tight">
            <span className="text-indigo-600 aeon-bold font-bold text-lg">★</span>
            Payments {" "} <br />
            <span className="relative inline-block text-white z-10 px-2 mx-1">
            you can trust
              <span className="absolute -inset-y-2 -inset-x-3 rounded-[60%] bg-purple-700 rotate-[-2deg] -z-10"></span>
            </span>
          </h1>

          <p className="inter text-2xl tracking-widest mt-10 md:mt-10">
      Send out payments to vendors and deploy salaries to employees efficiently.  
          </p>
        </div>

          
        {/* Image container */}
        <div className="w-full md:w-1/2 lg:w-[60%] xl:w-[65%] ">
          <img 
            src={lady} 
            alt="Accounting dashboard" 
            className="rounded-[60px] object-cover w-full h-auto border border-purple-200 "
          />
        </div>

        {/* img */}
      </div>
    </div>
  )
}

export default Ladyimg
