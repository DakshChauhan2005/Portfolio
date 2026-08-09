import React, { useEffect, useState } from 'react'

const formatDate = (date, compact) => {
  const month = date.toLocaleDateString(undefined, { month: 'short' }) // e.g. "Feb"
  const day = String(date.getDate()).padStart(2, '0') // e.g. "02"
  const time = date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    // Seconds are decoration, and on a narrow menu bar they cost the room the
    // date needs.
    ...(compact ? {} : { second: '2-digit' }),
    hour12: true,
  }) // e.g. "03:04:05 PM"

  if (compact) return `${month}-${day} ${time}`

  const weekday = date.toLocaleDateString(undefined, { weekday: 'long' }) // e.g. "Monday"
  return `${weekday} ${month}-${day} ${time}`
}

const DateTime = ({ className = '', style = {}, compact = false }) => {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    // Not aria-live: a clock that announces itself every second makes a screen
    // reader unusable. It still reads normally when navigated to.
    <div className={className} style={style}>
      {formatDate(now, compact)}
    </div>
  )
}

export default DateTime
