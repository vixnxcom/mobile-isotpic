import React from 'react'
import { credity, edit } from '../../assets'

const Payment = () => {
  return (
    <div>
    
          <div className='flex flex-col p-5 justify-center items-start'>
            <div className='h-60'>
              <img src={credity} alt="" className='w-45 max-h-55 mb-1' />
           
                <div className="inline-flex items-center justify-center
              text-xl aeon-bold  rounded-[14px] border border-purple-300 bg-purple-100 text-black 
              px-4 mb-2">
           Secure Credit Payments
               </div>
            <p className='intermid font-medium tracking-wide text-md 
            py-2'>
            Our <span className='text-purple-800'>Credit Account</span> feature
            </p>
            <p className='text-gray-600 inter'>Safely sync seamlessly with your payment vendor, add receipients, send out payments in realtime
                and view your 
                entire payment history on one simple dashboard.
            </p>
            <p className='text-gray-600 inter mt-2'>
                It’s like having a financial assistant that tracks your every transactions.
            </p>
          </div>
          </div>
        
    </div>
  )
}

export default Payment
