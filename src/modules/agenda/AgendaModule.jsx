/**
 * AgendaModule — Mi Agenda como calendario visual.
 * Tocar un día navega DIRECTAMENTE a la vista del día.
 * Sin paso intermedio.
 */
import { useNavigate }   from 'react-router-dom'
import { useAgendaView } from './hooks/useAgendaView'
import { CalendarGrid }  from './components/CalendarGrid'
import { SyncBadge }     from '../../shared/SyncBadge'

const MONTHS_ES = ['enero','febrero','marzo','abril','mayo','junio',
                   'julio','agosto','septiembre','octubre','noviembre','diciembre']

function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}

export function AgendaModule() {
  const navigate = useNavigate()
  const {
    selectedDate, setSelectedDate,
    viewMonth, prevMonth, nextMonth,
    daysWithActivity,
    pendingCount, completedCount,
    loading,
  } = useAgendaView()

  // Un solo toque en el día → va directo a la vista del día
  function handleDaySelect(date) {
    setSelectedDate(date)
    navigate(`/agenda/${toDateKey(date)}`)
  }

  // Formato del día seleccionado para el resumen
  const d   = selectedDate
  const label = `${d.getDate()} de ${MONTHS_ES[d.getMonth()]}`

  return (
    <div style={screen}>
      {/* Header */}
      <div style={header}>
        <span style={{ fontSize:22, cursor:'pointer' }}>☰</span>
        <span style={{ fontSize:17, fontWeight:600, color:'#111' }}>Mi Agenda</span>
        <SyncBadge />
      </div>

      <div style={{ flex:1, overflowY:'auto' }}>
        {/* Calendario — tocar un día navega directamente */}
        <CalendarGrid
          viewMonth={viewMonth}
          selectedDate={selectedDate}
          daysWithActivity={daysWithActivity}
          onSelectDate={handleDaySelect}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
        />

        {/* Leyenda */}
        <div style={{ display:'flex', gap:16, padding:'0 20px 20px', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:'#5B3DF6' }} />
            <span style={{ fontSize:12, color:'#9ca3af' }}>Personal</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:'#22C55E' }} />
            <span style={{ fontSize:12, color:'#9ca3af' }}>Grupos</span>
          </div>
        </div>

        {/* Resumen pasivo del día seleccionado */}
        <div style={daySummary}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:22 }}>📅</span>
            <div>
              <p style={{ margin:0, fontSize:13, fontWeight:600, color:'#111' }}>{label}</p>
              <p style={{ margin:'2px 0 0', fontSize:12 }}>
                <span style={{ color:'#5B3DF6', fontWeight:500 }}>{pendingCount} pendiente{pendingCount!==1?'s':''}</span>
                <span style={{ color:'#d1d5db' }}> · </span>
                <span style={{ color:'#22C55E', fontWeight:500 }}>{completedCount} completada{completedCount!==1?'s':''}</span>
              </p>
            </div>
          </div>
          <span style={{ fontSize:13, color:'#9ca3af' }}>Toca el día ↑</span>
        </div>
      </div>

      {/* Botón flotante + — también va al día de hoy */}
      <button
        onClick={() => navigate(`/agenda/${toDateKey(new Date())}`)}
        style={fab}
        aria-label="Agregar tarea hoy"
      >
        <span style={{ fontSize:28, color:'#fff', lineHeight:1 }}>+</span>
      </button>
    </div>
  )
}

const screen = {
  display:'flex', flexDirection:'column',
  height:'100%', background:'#fff',
  overflow:'hidden', position:'relative',
}
const header = {
  display:'flex', alignItems:'center', justifyContent:'space-between',
  padding:'14px 20px 10px',
  borderBottom:'1px solid #f3f4f6', flexShrink:0,
}
const daySummary = {
  margin:'0 16px 24px',
  padding:'12px 16px',
  background:'#fafafa',
  borderRadius:12, border:'1px solid #f3f4f6',
  display:'flex', alignItems:'center', justifyContent:'space-between',
}
const fab = {
  position:'fixed', bottom:'calc(72px + env(safe-area-inset-bottom))', right:20,
  width:52, height:52, borderRadius:'50%',
  background:'#5B3DF6', border:'none', cursor:'pointer',
  display:'flex', alignItems:'center', justifyContent:'center',
  boxShadow:'0 4px 16px rgba(91,61,246,0.35)',
}
