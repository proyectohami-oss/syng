const { createCanvas, loadImage } = require('canvas')
const fs   = require('fs')
const path = require('path')

async function generateOG() {
  const W = 1200
  const H = 630
  const canvas = createCanvas(W, H)
  const ctx    = canvas.getContext('2d')

  // Fondo blanco puro — estilo Apple
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)

  // Gradiente sutil esquina superior izquierda
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 600)
  grad.addColorStop(0,   'rgba(240,242,255,0.9)')
  grad.addColorStop(1,   'rgba(255,255,255,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  // ── Screenshots del producto ──
  const phoneW = 210
  const phoneH = 420
  const phoneR = 28

  async function drawPhone(imgPath, x, y, w, h, rotation) {
    const img = await loadImage(imgPath)
    ctx.save()
    ctx.translate(x + w/2, y + h/2)
    ctx.rotate(rotation)

    // Sombra
    ctx.shadowColor   = 'rgba(13,18,64,0.18)'
    ctx.shadowBlur    = 32
    ctx.shadowOffsetY = 12

    // Marco del teléfono
    ctx.fillStyle = '#1C1C1E'
    roundRect(ctx, -w/2 - 6, -h/2 - 10, w + 12, h + 20, phoneR + 4)
    ctx.fill()

    ctx.shadowColor = 'transparent'

    // Pantalla
    ctx.save()
    roundRect(ctx, -w/2, -h/2, w, h, phoneR - 4)
    ctx.clip()
    ctx.drawImage(img, -w/2, -h/2, w, h)
    ctx.restore()

    ctx.restore()
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }

  // Teléfono izquierdo — ligeramente rotado y más abajo
  await drawPhone(
    path.join(__dirname, '../public/screenshots/screen3.png'),
    600, 85, phoneW - 10, phoneH - 10, -0.04
  )

  // Teléfono derecho — protagonista
  await drawPhone(
    path.join(__dirname, '../public/screenshots/screen1.png'),
    760, 60, phoneW + 20, phoneH + 20, 0.03
  )

  // ── Logo Syng ──
  const icon = await loadImage(path.join(__dirname, '../public/icon-512.png'))
  const iconSize = 72
  ctx.save()
  ctx.shadowColor   = 'rgba(13,18,64,0.15)'
  ctx.shadowBlur    = 16
  ctx.shadowOffsetY = 4
  ctx.beginPath()
  roundRect(ctx, 72, 80, iconSize, iconSize, 16)
  ctx.clip()
  ctx.drawImage(icon, 72, 80, iconSize, iconSize)
  ctx.restore()

  // ── Texto ──
  // Syng
  ctx.fillStyle = '#0D1240'
  ctx.font      = 'bold 52px -apple-system, sans-serif'
  ctx.fillText('Syng', 72, 210)

  // Tagline
  ctx.font      = '26px -apple-system, sans-serif'
  ctx.fillStyle = '#0D1240'
  ctx.fillText('Organiza tu vida', 72, 255)
  ctx.fillText('y proyectos.', 72, 288)

  // Pills
  const pills = ['tareas', 'grupos', 'sincronía']
  let px = 72
  const py = 340
  pills.forEach(pill => {
    const tw  = ctx.measureText(pill).width
    const pw  = tw + 28
    const ph  = 32

    ctx.fillStyle = 'rgba(45,58,140,0.08)'
    ctx.beginPath()
    ctx.roundRect(px, py, pw, ph, 16)
    ctx.fill()

    ctx.fillStyle = '#2D3A8C'
    ctx.font      = '14px -apple-system, sans-serif'
    ctx.fillText(pill, px + 14, py + 21)

    px += pw + 10
  })

  // Frase
  ctx.font      = 'bold 18px -apple-system, sans-serif'
  ctx.fillStyle = 'rgba(13,18,64,0.4)'
  ctx.fillText('Planea. Comparte. Avanza.', 72, 420)

  // URL
  ctx.font      = '15px -apple-system, sans-serif'
  ctx.fillStyle = 'rgba(13,18,64,0.3)'
  ctx.fillText('syng-psi.vercel.app', 72, 450)

  // Guardar
  const out = fs.createWriteStream(path.join(__dirname, '../public/og-image.png'))
  canvas.createPNGStream().pipe(out)
  out.on('finish', () => console.log('✅ public/og-image.png generado'))
}

generateOG().catch(console.error)
