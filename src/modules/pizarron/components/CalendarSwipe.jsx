import { useState, useRef, useEffect } from 'react'
import { addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, format, isSameDay, isSameMonth } from 'date-fns'
import { es } from 'date-fns/locale'

const DAYS_HDR = ['L','M','M','J','V','S','D']

function MonthGrid({ monthDate, selectedDate, daysWithActivity, onSelectDate }) {
  const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 })
  const end   = endOfWeek(endOfMonth(monthDate),     { weekStartsOn: 1 })
  const days  = eachDayOfInterval({ start, end })
  const today = new Date(); today.setHours(0,0,0,0)

  return (
    <div style={{ minWidth:'100%', flexShrink:0, padding:'0 16px 12px' }}>
      {/* Encabezados días */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:6 }}>
        {DAYS_HDR.map((d,i) => (
          <span key={i} style={{
            fontSize:11, color:'rgba(13,18,64,0.32)',
            textAlign:'center', fontWeight:600, letterSpacing:'0.04em',
          }}>{d}</span>
        ))}
      </div>

      {/* Celdas */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)' }}>
        {days.map((day, i) => {
          const isCurrentMonth = isSameMonth(day, monthDate)
          const isToday        = isSameDay(day, today)
          const isSelected     = selectedDate && isSameDay(day, selectedDate)
          const dateKey        = format(day, 'yyyy-MM-dd')
          const hasDot         = !!daysWithActivity[dateKey]

          return (
            <div
              key={i}
              onClick={() => isCurrentMonth && onSelectDate(day)}
              style={{
                height:48, display:'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center',
                cursor: isCurrentMonth ? 'pointer' : 'default',
                WebkitTapHighlightColor:'transparent',
                userSelect:'none', gap:2,
                opacity: isCurrentMonth ? 1 : 0.2,
              }}
            >
              <div style={{
                width:30, height:30, borderRadius:'50%',
                background: isSelected
                  ? 'linear-gradient(145deg, #3D4FA8, #2D3A8C)'
                  : 'transparent',
                border: (!isSelected && isToday)
                  ? '2px solid #2D3A8C'
                  : '2px solid transparent',
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow: isSelected ? '0 2px 8px rgba(45,58,140,0.32)' : 'none',
              }}>
                <span style={{
                  fontSize:13, lineHeight:1,
                  fontWeight: (isSelected || isToday) ? 600 : 400,
                  color: isSelected ? '#fff' : isToday ? '#2D3A8C' : '#0D1240',
                }}>
                  {day.getDate()}
                </span>
              </div>
              <div style={{ height:5, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {hasDot && isCurrentMonth ? (
                  <div style={{ width:4, height:4, borderRadius:'50%', background:'#2D3A8C' }} />
                ) : (
                  <div style={{ width:4, height:4 }} />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function CalendarSwipe({ selectedDate, daysWithActivity, onSelectDate, onMonthChange }) {
  const today = new Date()
  const [months, setMonths] = useState([
    subMonths(today, 1),
    today,
    addMonths(today, 1),
  ])
  const [currentIdx, setCurrentIdx] = useState(1)
  const scrollRef = useRef(null)
  const isSettling = useRef(false)

  // Centrar al montar
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollLeft = el.offsetWidth
  }, [])

  function handleScroll() {
    if (isSettling.current) return
    const el = scrollRef.current
    if (!el) return
    const idx = Math.round(el.scrollLeft / el.offsetWidth)
    if (idx === currentIdx) return

    isSettling.current = true
    setCurrentIdx(idx)
    onMonthChange && onMonthChange(months[idx])

    // Agregar mes al extremo y recentrar
    if (idx === 0) {
      setMonths(prev => {
        const next = [subMonths(prev[0], 1), ...prev]
        setTimeout(() => {
          el.scrollLeft = el.offsetWidth
          setCurrentIdx(1)
          isSettling.current = false
        }, 50)
        return next
      })
    } else if (idx === months.length - 1) {
      setMonths(prev => {
        const next = [...prev, addMonths(prev[prev.length - 1], 1)]
        setTimeout(() => { isSettling.current = false }, 50)
        return next
      })
    } else {
      setTimeout(() => { isSettling.current = false }, 50)
    }
  }

  const currentMonth = months[currentIdx] ?? today
  const monthLabel   = format(currentMonth, 'MMMM yyyy', { locale: es })
    .replace(/^\w/, c => c.toUpperCase())

  return (
    <div>
      {/* Header mes */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'8px 0 4px' }}>
        <span style={{ fontSize:13, fontWeight:700, color:'#0D1240', letterSpacing:'-0.01em' }}>
          {monthLabel}
        </span>
      </div>

      {/* Scroll snap */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          display:'flex',
          overflowX:'auto',
          scrollSnapType:'x mandatory',
          WebkitOverflowScrolling:'touch',
          scrollbarWidth:'none',
          msOverflowStyle:'none',
        }}
      >
        <style>{`div::-webkit-scrollbar{display:none}`}</style>
        {months.map((m, i) => (
          <div key={i} style={{ scrollSnapAlign:'center', minWidth:'100%', flexShrink:0 }}>
            <MonthGrid
              monthDate={m}
              selectedDate={selectedDate}
              daysWithActivity={daysWithActivity}
              onSelectDate={onSelectDate}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
