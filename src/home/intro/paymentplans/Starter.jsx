import React from 'react'
import { edit, start, tick } from '../../../assets'

const Starter = () => {
  return (
    <div className=''>
      <div className='p-5 justify-center items-start'>
        {/* header */}

        <div className='w-11 h-12'>
               <img src={start} alt="" className='p-2 '/>
                </div>

         <div className="inline-flex mt-3 items-center justify-center mx-auto bluish
              text-xl aeon-bold  rounded-[14px] border border-purple-300  text-white
              px-4 mb-2">
              Starter Plan
               </div>

               {/* price */}
               <h1 className='aeon-bold text-3xl px-2  mt-2 mb-2'>
                $200 
               </h1>

          {/* list      */}
          <div className='flex flex-col px-4 aeon-bold font-medium text-md tracking-widest'>
             <p className='flex flex-row gap-2'>
              <span  className=' h-8 w-8 rounded-full border border-purple-300'>
                <img src={tick} alt="" className='p-1' />
             </span>Inventory System</p>
             <p className='flex flex-row gap-2 mt-2'>
            <span  className=' h-8 w-8 rounded-full border border-purple-300'>
                <img src={tick} alt="" className='p-1' />
             </span>Invoice generator</p>
              <p className='mt-2 mx-10 opacity-50'>
             Debit Account</p>
              <p className='mt-2 mx-10 opacity-50'>
            Credit Account</p>
              <p className='mt-2 mx-10 opacity-50'>
            Salary and Payroll</p>
              <p className='mt-2 mx-10 opacity-50'>
            24/7 Customer Support</p>
           
            
            
             
          </div>
      </div>
    </div>
  )
}

export default Starter
