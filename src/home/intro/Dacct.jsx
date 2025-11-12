import React from 'react'
import { debitc, edit } from '../../assets'

const Dacct = () => {
  return (
      <div>
       
             <div className='flex flex-col p-5 justify-center items-start'>
               <div className='h-60'>


                 <img src={debitc} alt="" className='w-62 mb-8' />
                  <div className="inline-flex items-center justify-center
              text-xl aeon-bold  rounded-[14px] border border-purple-300 bg-purple-100 text-black 
              px-4 mb-2">
              Debit Accounts
               </div>
            
               <p className='intermid font-medium tracking-wide text-md 
               py-2'>
               Our <span className='text-purple-800'>Debit Account</span> feature
               </p>
               <p className='text-gray-600 inter'>
            Helps you easily track who has paid and who still owes you.Stay on top of your finances 
            and reduce the 
              time you spend chasing payments. 
               </p>
               <p className='text-gray-600 inter mt-2'>
           
              Automatically get update when payments are received on a clear dashboard
               </p>
             </div>
             </div>
           
       </div>
  )
}

export default Dacct

