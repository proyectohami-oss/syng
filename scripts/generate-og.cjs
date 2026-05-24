const { createCanvas, loadImage } = require('canvas')
const fs   = require('fs')
const path = require('path')

async function generateOG() {
  const W = 1200
  const H = 630
  const canvas = createCanvas(W, H)
  const ctx    = canvas.getContext('2d')

  const grad = ctx.createLinearGradient(0, 0, W, H)
  grad.addColorStop(0,   '#0D1240')
  grad.addColorStop(0.6, '#1a2a6c')
  grad.addColorStop(1,   '#2D3A8C')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  ctx.fillStyle = 'rgba(255,255,255,0.03)'
  for (let x = 0; x < W; x += 40) {
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath()
      ctx.arc(x, y, 1.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  try {
    const icon = await loadImage(path.join(__dirname, '../public/icon-512.png'))
    const size = 100
    const ix   = 80
    const iy   = H / 2 - size / 2
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(ix, iy, size, size, 20)
    ctx.clip()
    ctx.drawImage(icon, ix, iy, size, size)
    ctx.restore()
  } catch(e) {
    ctx.fillStyle = '#5B3DF6'
    ctx.beginPath()
    ctx.roundRect(80, H/2 - 50, 100, 100, 20)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 48px sans-serif'
    ctx.fillText('S', 110, H/2 + 18)
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.15)'
  ctx.lineWidth   = 1
  ctx.beginPath()
  ctx.moveTo(210, H/2 - 100)
  ctx.lineTo(210, H/2 + 100)
  ctx.stroke()

  ctx.fillStyle = '#ffffff'
  ctx.font      = 'bold 64px sans-serif'
  ctx.fillText('Organiza tu vida', 240, H/2 - 40)

  ctx.font      = 'bold 64px sans-serif'
  ctx.fillStyle = '#7B8FF5'
  ctx.fillText('con Syng.', 240, H/2 + 40)

  ctx.font      = '28px sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.fillText('tareas  •  grupos  •  sincronía', 240, H/2 + 100)

  ctx.font      = '22px sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.fillText('Planea. Comparte. Avanza.  —  syng-psi.vercel.app', 80, H - 40)

  const out = fs.createWriteStream(path.join(__dirname, '../public/og-image.png'))
  canvas.createPNGStream().pipe(out)
  out.on('finish', () => console.log('✅ public/og-image.png generado'))
}

generateOG().catch(console.error)
