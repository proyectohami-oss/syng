import { useNavigate }   from 'react-router-dom'
import { useAgendaView } from './hooks/useAgendaView'
import { CalendarGrid }  from './components/CalendarGrid'
import { SyncBadge }     from '../../shared/SyncBadge'
import { A, L } from '../../shared/agendaEditorial'

const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}

export function AgendaModule() {
  const navigate = useNavigate()
  const { selectedDate, setSelectedDate, viewMonth, prevMonth, nextMonth, daysWithActivity, pendingCount, completedCount } = useAgendaView()

  function handleDaySelect(date) {
    setSelectedDate(date)
    navigate(`/agenda/${toDateKey(date)}`)
  }

  const d     = selectedDate
  const label = `${d.getDate()} de ${MESES[d.getMonth()]}`

  return (
    <div style={A.screen}>
      <div style={A.header}>
        <span style={A.headerTitle}>Mi Agenda</span>
        <SyncBadge dark />
      </div>

      <div style={{ flex:1, overflowY:'auto', WebkitOverflowScrolling:'touch' }}>
        <CalendarGrid
          viewMonth={viewMonth}
          selectedDate={selectedDate}
          daysWithActivity={daysWithActivity}
          onSelectDate={handleDaySelect}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
        />

        <div style={{ display:'flex', gap:16, padding:'0 20px 20px', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:7, height:7, borderRadius:2, background:L.champagne }} />
            <span style={{ fontSize:12, color:L.ivoryMuted }}>Personal</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:7, height:7, borderRadius:2, background:'#6ee7a0' }} />
            <span style={{ fontSize:12, color:L.ivoryMuted }}>Grupos</span>
          </div>
        </div>

        <div style={A.card} onClick={() => navigate(`/agenda/${toDateKey(selectedDate)}`)}>
          <div>
            <p style={{ margin:0, fontSize:10, ...A.badge }}>Resumen</p>
            <p style={{ margin:'6px 0 0', fontFamily:L.serif, fontSize:20, color:L.ivory }}>{label}</p>
            <p style={{ margin:'6px 0 0', fontSize:12, color:L.ivoryMuted }}>
              <span style={{ color:L.champagne }}>{pendingCount} pendiente{pendingCount!==1?'s':''}</span>
              {' · '}
              <span>{completedCount} completada{completedCount!==1?'s':''}</span>
            </p>
          </div>
          <span style={{ fontSize:18, color:L.champagne }}>›</span>
        </div>
      </div>
    </div>
  )
}
