import React from 'react'
import Headline from './Headline'
import Invent from './Invent'
import Payment from './Payment'
import Dacct from './Dacct'
import Invio from './Invio'
import Payroll from './Payroll'
import Ladyimg from './Ladyimg'

const Intro = () => {
  return (
    <div>

      <div className='mt-40 '>
         <Headline/>
      </div>
      
       
    
      <div className='flex flex-row justify-center items-center gap-8 mt-10'>
         <div className='p-6 rounded-[14px] shadow-xs border border-purple-200 max-w-[470px] h-[510px]'>
        <Invent />
      </div>
         <div className='p-6 rounded-[14px] shadow-xs border border-purple-200 max-w-[470px] h-[510px]'>
        <Payment />
      </div>
     
      </div>
      <div className='flex flex-row justify-center items-center gap-8 mt-20'>
      <div className='p-6 rounded-[14px] shadow-xs border border-purple-200 max-w-[470px] h-[510px]'>
        <Dacct />
      </div>
          <div className='p-6 rounded-[14px] shadow-xs border border-purple-200 max-w-[470px] h-[510px]'>
        <Payroll />
      </div>
     
      </div>

      <div className='flex flex-row justify-left px-38 items-center gap-8 mt-20'>
         <div className='p-6 rounded-[14px] shadow-xs border border-purple-200 max-w-[470px] h-[510px]'>
        <Invio />
      </div>
      </div>

    </div>
  )
}

export default Intro