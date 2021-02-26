import React from 'react'
import classnames from 'classnames'
import Test from './Test.jsx'
import './app.css'

export default () => {
  return (
    <div
      className={classnames('red', {
        blue: false
      })}>
      red
      <div className="blue">blue</div>
      <Test></Test>
    </div>
  )
}
