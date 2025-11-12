import React from 'react'
import { basic, edit, start, tick } from '../../../assets'

const Basic = () => {
 return (
    <div className=''>
      <div className='p-5 justify-center items-start'>
        {/* header */}
        <div className='w-16 h-16 '>
       <img src={basic} alt="" className='p-2'/>
        </div>
      
         <div className="inline-flex items-center justify-center mx-auto bluish
              text-xl aeon-bold  rounded-[14px] border border-purple-300  text-white
              px-4 mb-2">
              Basic Plan
               </div>

               {/* price */}
               <h1 className='aeon-bold text-3xl px-2  mt-2 mb-2'>
                $280 
               </h1>

          {/* list      */}
          <div className='flex flex-col px-4 aeon-bold font-medium text-md tracking-widest'>
             <div className='flex flex-row gap-2'>
              <div className=' h-8 w-8 rounded-full border border-purple-300'>
                            <img src={tick} alt="" className='p-1' />
                         </div>
             <p>Inventory System <span className='inter text-sm'> - Offline Data Storage</span></p>
             </div> 
              <p className='flex flex-row gap-2 mt-2'>
                            <span className=' h-8 w-8 rounded-full border border-purple-300'>
                             <img src={tick} alt="" className='p-1' />
                          </span>Invoice generator</p>

                 <div className='flex flex-row gap-2 mt-2'>
                             <div className=' h-8 w-8 rounded-full border border-purple-300'>
                                          <img src={tick} alt="" className='p-1' />
                                       </div>
                  <p>Debit Account <span className='inter text-sm'> - Payment Integration <br /> System</span></p>
                                       </div> 
              <p className='mt-2 mx-10  opacity-50'>
            Credit Account</p>
              <p className='mt-2 mx-10  opacity-50'>
            Salary and Payroll</p>

                  <div className='flex flex-row gap-2 mt-2'>
                            <div className=' h-8 w-8 rounded-full border border-purple-300'>
                            <img src={tick} alt="" className='p-1' />
                         </div>
                         <p>24/7 Customer Support</p>
                         </div>           
             
          </div>
      </div>
    </div>
  )

}

export default Basic
