import React from 'react'
import { coins, man, shape, table, woman } from '../assets'

const Hero = () => {
  return (
    <div className=" mt-5 ">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className=" shadow-2xl border-white rounded-[14px] overflow-hidden w-full  h-100">
          <img src={shape} alt="coins-2" className="w-full h-full p-4 object-cover" />
        </div>

    
      <div className="border-4 shadow-2xl border-blu rounded-[14px] overflow-hidden w-full h-100">
          <img src={woman} alt="woman" className="w-full h-full object-cover" />
        </div>
        
     <div className="border-4 shadow-2xl border-white rounded-[14px] overflow-hidden w-full h-100">
          <img src={man} alt="woman" className="w-full h-full object-cover" />
        </div>
        

      </div>
    </div>
  )
}

export default Hero
