import React from 'react'
import { bill, currency, edit } from '../../assets'

const Payroll = () => {
  return (
       <div className='flex flex-col p-5 justify-center items-start'>
         <div className=''>
           <img src={currency} alt="" className='w-60 max-h-60 mb-1' />
        
           <div className="inline-flex items-center justify-center mt-8
              text-xl aeon-bold  rounded-[14px] border border-purple-300 bg-purple-100 text-black 
              px-4 mb-2">
               One-Click Payroll Feature
               </div>
         <p className='intermid font-medium tracking-wide text-md py-2'>
         With our <span className='text-purple-800'>Salary and Payroll </span> feature 
         </p>
         <p className='text-gray-600 inter'>
           Automate payroll by generating employee payment 
           lists and releasing funds seamlessly with one quick action.
          Save time and stay organized!
         </p>
       </div>
       </div>
  )
}

export default Payroll
