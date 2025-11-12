import React from 'react'
import { bill, edit } from '../../assets'

const Invio = () => {
  return (
       <div className='flex flex-col p-5 justify-center items-start'>
         <div className=''>
           <img src={bill} alt="" className='w-55 max-h-60 mb-1' />
        
           <div className="inline-flex items-center justify-center mt-5
              text-xl aeon-bold  rounded-[14px] border border-purple-300 bg-purple-100 text-black 
              px-4 mb-2">
               Instant Invoicing
               </div>
         <p className='intermid font-medium tracking-wide text-md py-2'>
         With our <span className='text-purple-800'>Invoice Generator ;</span>
         </p>
         <p className='text-gray-600 inter'>Quickly generate and send clean, professional invoices without any hassle. It’s fast, 
            simple, and helps you get paid quicker.
         </p>
       </div>
       </div>
  )
}

export default Invio
