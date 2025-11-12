import React from 'react'
import { footer, img, man } from '../../assets'
import Button from '../Button'

const ImgFooter = () => {
  return (
    <div className="flex justify-center items-center mx-auto p-12 mt-20 mb-20">
      <div className="flex flex-row flex-wrap md:flex-nowrap mx-auto gap-20 w-full">
        {/* Image container */}
       <div className="w-full md:w-1/2 lg:w-[60%] xl:w-[65%] ">
                <img 
                  src={footer} 
                  alt="Accounting dashboard" 
                  className="rounded-[60px] object-cover w-full h-auto border border-purple-200 "
                />
              </div>

        {/* Text */}
        <div className="flex flex-col justify-center w-full md:w-1/2 max-w-[500px]">
       <h1 className="text-[40px] aeon-bold leading-tight">
           <span className="text-indigo-600 font-bold text-lg">★</span>
  Fast,{" "}
  <span className="relative inline-block text-white z-10 px-2 mx-1 mr-4">
   Efficient
    <span className="absolute -inset-y-2 -inset-x-3 rounded-[60%] bg-purple-700 rotate-[-2deg] -z-10"></span>
  </span>
 and <br /> Reliable
</h1>


          <p className="inter text-2xl tracking-widest mt-5 mb-5 md:mt-10">
         Monitor expenses, manage your payrolls, data, and send payments effortlessly - anywhere in the world.
          </p>
          <div>
          <Button />
          </div>
         
        </div>
      </div>
    </div>
  )
}

export default ImgFooter
