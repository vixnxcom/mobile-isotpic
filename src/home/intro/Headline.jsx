import React from 'react'
import { img, mag } from '../../assets'
import Ladyimg from './Ladyimg'

const Headline = () => {
  return (
    <div className='flex flex-col justify-center items-center  '>


      
        <div className='mx-auto'>
         
            <h1 className='aeon-bold  font-bold text-black tracking-wider text-3xl flex flex-row gap-2'><span>
                <div className='w-3 h-3  bg-purple-600  mt-2 shadow-xl border border-purple-700 rounded-full'></div></span>
                Run Your <span className='text-purple-700'>Business Smoothly,</span>  
                All in One Place</h1>
        </div>



        <div className='max-w-7xl mt-10 flex flex-row items-center gap-6'>
  <div className='shadow-xl max-w-[740px] rounded-[60px] bg-purple-600'>
    <img src={mag} alt="" className='rounded-[60px] p-3 w-full h-auto'/>
  </div>
  
  <div className='flex justify-center w-full md:w-1/2 max-w-[500px]'>
    <p className='px-4 py-10 inter text-2xl flex flex-col'>
      Manage your products, payments, and invoices without the stress. 
      Our tools are designed to work together seamlessly, giving you more time to 
      focus on your customers. 
      {/* <span className='mt-5'>
        Get back to business by simplifying your daily tasks. Our five key features work together
        to give you a complete picture of your operations in one place.
      </span> */}
    </p>
  </div>
</div>

   <div className="rounded-[100px] mt-20 mb-20 blury h-[500px] flex justify-center items-center max-w-7xl md:mx-auto">
      <Ladyimg />
        </div>



          {/* <h1 className='aeon-bold text-shadow-md text-purple-700 tracking-wider text-2xl p-4 '>
             Key Features</h1> */}
              <h1 className="text-[40px] aeon-bold leading-tight mt-10 p-4"> 
                <span className="text-indigo-600 font-bold text-lg">★</span>
 Key{" "}
  <span className="relative inline-block text-white z-10 px-2 mx-1">
 Features
    <span className="absolute -inset-y-2 -inset-x-3 rounded-[60%] bg-purple-800 rotate-[-2deg] -z-10"></span>
  </span>
</h1>   


        <div className='max-w-6xl'>
    <p className='px-4 py-10 inter text-xl text-left'>
  

        Get back to business by simplifying your daily tasks. Our five key features work together
        to give you a complete picture of your operations in one place.
     
    </p>
  </div>  
    </div>
  )
}

export default Headline