import React from 'react'
import classnames from 'classnames'
import Test from './Test.jsx'
import './app.css'

export default () => {
  return (
    <div
      className={classnames('a', {
        b: true
      })}>
      Hello12
      <Test></Test>
    </div>
  )
}
