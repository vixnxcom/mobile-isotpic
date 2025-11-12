import React from 'react'
import HeadTitle from './HeadTitle'
import { shape } from '../../assets'

const Foot = () => {
  return (
    <div className=''>
     <div className=''>
<img src={shape} alt=""  className='w-40 h-50 mx-auto pt-16 '/>
    </div>
      <div className=' '>
        <HeadTitle />
      </div>
    </div>
  )
}

export default Foot
