import React from 'react'
import { board, edit } from '../../assets'

const Invent = () => {
  return (
    <div className='flex flex-col p-5 justify-center items-start'>
      <div className=''>
        <img src={board} alt="" className='w-60 max-h-60 mb-5' />
    

            <div className="inline-flex items-center justify-center
              text-xl aeon-bold  rounded-[14px] border border-purple-300 bg-purple-100 text-black 
              px-4 mb-2">
               Offline Inventory System
               </div>
      <p className='intermid font-medium tracking-wide text-md py-2'>
      Our <span className='text-purple-800'>Business Expense Tracker ;</span>
      </p>
      <p className='text-gray-600 inter'>A local inventory that helps you
       keep counting your products, and track your cummulative expenses even when the internet is down. 
      
      </p>
      <p className='text-gray-600 inter mt-2'> 
      Your data saves securely 
       and updates when you're back online.
      </p>
    </div>
    </div>
  )
}

export default Invent
