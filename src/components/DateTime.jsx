import React, { useEffect, useState } from 'react'

const formatDate = (date) => {
  const weekday = date.toLocaleDateString(undefined, { weekday: 'long' }) // e.g. "Monday"
  const month = date.toLocaleDateString(undefined, { month: 'short' }) // e.g. "Feb"
  const day = String(date.getDate()).padStart(2, '0') // e.g. "02"
  const time = date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }) // e.g. "03:04:05 PM"

  return `${weekday} ${month}-${day} ${time}`
}

const DateTime = ({ className = '', style = {} }) => {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className={className} style={style} aria-live="polite">
      {formatDate(now)}
    </div>
  )
}

export default DateTime
