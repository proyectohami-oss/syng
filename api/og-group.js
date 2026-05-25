module.exports = async (req, res) => {
  const {
    groupName = 'Mi Grupo',
    inviterName = 'Alguien',
    memberCount = '1',
  } = req.query;

  const escapeXml = (str) =>
    String(str)
      .substring(0, 32)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const gName = escapeXml(groupName);
  const iName = escapeXml(inviterName);
  const mCount = escapeXml(memberCount);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFC84A"/>
      <stop offset="45%" stop-color="#FFE4A0"/>
      <stop offset="100%" stop-color="#FFF8E8"/>
    </linearGradient>
    <linearGradient id="panel" x1="10%" y1="0%" x2="90%" y2="100%">
      <stop offset="0%" stop-color="#252C88"/>
      <stop offset="100%" stop-color="#0D1240"/>
    </linearGradient>
    <linearGradient id="iconBox" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3345A8"/>
      <stop offset="100%" stop-color="#1E2D8A"/>
    </linearGradient>
    <linearGradient id="pMain" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#9298F8"/>
      <stop offset="100%" stop-color="#5257D8"/>
    </linearGradient>
    <linearGradient id="pSide" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#6E74E8"/>
      <stop offset="100%" stop-color="#3A42C0"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Right dark panel with curved left edge -->
  <path d="M824,0 C778,160 778,470 824,630 L1200,630 L1200,0 Z" fill="url(#panel)"/>

  <!-- Subtle dot pattern on dark panel -->
  <circle cx="900" cy="120" r="2" fill="rgba(255,255,255,0.08)"/>
  <circle cx="960" cy="95" r="2" fill="rgba(255,255,255,0.06)"/>
  <circle cx="1100" cy="140" r="2" fill="rgba(255,255,255,0.07)"/>
  <circle cx="1050" cy="510" r="2" fill="rgba(255,255,255,0.06)"/>
  <circle cx="1150" cy="540" r="2" fill="rgba(255,255,255,0.08)"/>
  <circle cx="920" cy="490" r="2" fill="rgba(255,255,255,0.05)"/>

  <!-- Decorative dots on light side -->
  <circle cx="58" cy="90" r="7" fill="#9BA8FF" opacity="0.45"/>
  <circle cx="222" cy="50" r="5" fill="#F5A623" opacity="0.55"/>
  <circle cx="332" cy="108" r="4" fill="#9BA8FF" opacity="0.38"/>
  <circle cx="68" cy="512" r="6" fill="#9BA8FF" opacity="0.40"/>
  <circle cx="178" cy="556" r="4" fill="#F5A623" opacity="0.48"/>
  <circle cx="360" cy="538" r="5" fill="#9BA8FF" opacity="0.30"/>
  <circle cx="716" cy="68" r="4" fill="#9BA8FF" opacity="0.28"/>
  <circle cx="762" cy="558" r="4" fill="#F5A623" opacity="0.22"/>

  <!-- ===== LEFT: GROUP ILLUSTRATION ===== -->

  <!-- Back-left person -->
  <circle cx="108" cy="270" r="37" fill="url(#pSide)" opacity="0.70"/>
  <path d="M48,445 Q50,344 108,344 Q166,344 168,445 Z" fill="url(#pSide)" opacity="0.70"/>

  <!-- Back-right person -->
  <circle cx="292" cy="277" r="34" fill="url(#pSide)" opacity="0.70"/>
  <path d="M236,445 Q238,352 292,352 Q346,352 348,445 Z" fill="url(#pSide)" opacity="0.70"/>

  <!-- Main center person (foreground, larger) -->
  <circle cx="200" cy="252" r="55" fill="url(#pMain)"/>
  <path d="M116,458 Q118,356 200,356 Q282,356 284,458 Z" fill="url(#pMain)"/>

  <!-- Leaves bottom-left -->
  <ellipse cx="78" cy="450" rx="29" ry="12" fill="#28A04A" transform="rotate(-42 78 450)"/>
  <ellipse cx="100" cy="436" rx="25" ry="10" fill="#3EBB62" transform="rotate(-22 100 436)"/>
  <ellipse cx="60" cy="465" rx="20" ry="8" fill="#28A04A" transform="rotate(-60 60 465)"/>
  <ellipse cx="52" cy="452" rx="16" ry="7" fill="#3EBB62" transform="rotate(-30 52 452)"/>

  <!-- Leaves bottom-right -->
  <ellipse cx="320" cy="447" rx="25" ry="10" fill="#28A04A" transform="rotate(32 320 447)"/>
  <ellipse cx="304" cy="460" rx="20" ry="8" fill="#3EBB62" transform="rotate(50 304 460)"/>
  <ellipse cx="338" cy="460" rx="16" ry="7" fill="#28A04A" transform="rotate(18 338 460)"/>

  <!-- ===== CENTER: TEXT CONTENT ===== -->

  <!-- Group name -->
  <text x="572" y="218"
    font-family="'Arial Black', 'Helvetica Neue', Arial, sans-serif"
    font-size="72" font-weight="900"
    fill="#0D1240" text-anchor="middle">${gName}</text>

  <!-- Orange heart badge (circle + white heart path) -->
  <circle cx="770" cy="170" r="26" fill="#FF8C30"/>
  <path d="M770,182 C758,173 748,167 748,158
           C748,151 753,147 759,147
           C763,147 767,149 770,153
           C773,149 777,147 781,147
           C787,147 792,151 792,158
           C792,167 782,173 770,182 Z" fill="white"/>

  <!-- Inviter subtitle -->
  <text x="572" y="280"
    font-family="Arial, Helvetica, sans-serif"
    font-size="31" font-weight="700"
    fill="#5252D8" text-anchor="middle">${iName} te invit&#243; a colaborar</text>

  <!-- White info pill -->
  <rect x="328" y="308" width="488" height="60" rx="30"
    fill="white" opacity="0.96"/>
  <rect x="328" y="308" width="488" height="60" rx="30"
    fill="none" stroke="#E8E0D0" stroke-width="1.5"/>

  <!-- People icon in pill (manual paths) -->
  <g transform="translate(364, 330)" fill="#5252D8">
    <circle cx="11" cy="6" r="6.5"/>
    <path d="M0,28 Q0,14 11,14 Q22,14 22,28 Z"/>
    <circle cx="24" cy="4" r="5.5" opacity="0.6"/>
    <path d="M16,28 Q17,16 26,16 Q33,16 33,28 Z" opacity="0.6"/>
  </g>

  <!-- Member count in pill -->
  <text x="408" y="348"
    font-family="Arial, Helvetica, sans-serif"
    font-size="22" font-weight="700"
    fill="#0D1240">${mCount} miembros</text>

  <!-- Pill divider -->
  <rect x="560" y="320" width="1.5" height="36" fill="#D8D0C8"/>

  <!-- Tagline in pill -->
  <text x="700" y="347"
    font-family="Arial, Helvetica, sans-serif"
    font-size="19" fill="#666666" text-anchor="middle">Organiza juntos sus tareas</text>

  <!-- CTA decorative left element -->
  <path d="M452,440 C460,428 470,444 462,452"
    stroke="#5252D8" stroke-width="3" fill="none" stroke-linecap="round"/>
  <line x1="460" y1="440" x2="492" y2="440"
    stroke="#5252D8" stroke-width="3" stroke-linecap="round"/>

  <!-- CTA decorative right element (mirrored) -->
  <path d="M694,440 C686,428 676,444 684,452"
    stroke="#5252D8" stroke-width="3" fill="none" stroke-linecap="round"/>
  <line x1="686" y1="440" x2="654" y2="440"
    stroke="#5252D8" stroke-width="3" stroke-linecap="round"/>

  <!-- CTA text -->
  <text x="572" y="452"
    font-family="'Arial Black', 'Helvetica Neue', Arial, sans-serif"
    font-size="38" font-weight="900"
    fill="#5252D8" text-anchor="middle">&#218;nete a Syng</text>

  <!-- ===== RIGHT PANEL: SYNG BRANDING ===== -->

  <!-- App icon rounded square -->
  <rect x="874" y="162" width="100" height="100" rx="24" fill="url(#iconBox)"/>

  <!-- Member count number inside icon -->
  <text x="924" y="240"
    font-family="'Arial Black', 'Helvetica Neue', Arial, sans-serif"
    font-size="52" font-weight="900"
    fill="white" text-anchor="middle">${mCount}</text>

  <!-- Brand accent dot on icon -->
  <circle cx="940" cy="258" r="6" fill="#F5A623"/>

  <!-- Syng brand name -->
  <text x="1002" y="242"
    font-family="'Arial Black', 'Helvetica Neue', Arial, sans-serif"
    font-size="60" font-weight="900"
    fill="white" text-anchor="start">Syng</text>

  <!-- Tagline line 1 -->
  <text x="1020" y="325"
    font-family="Arial, Helvetica, sans-serif"
    font-size="26" fill="rgba(255,255,255,0.92)"
    text-anchor="middle">Organiza tu vida,</text>

  <!-- Tagline line 2: "juntos" in orange -->
  <text x="992" y="363"
    font-family="Arial, Helvetica, sans-serif"
    font-size="26" text-anchor="start">
    <tspan fill="#F5A623" font-weight="700">juntos</tspan><tspan fill="rgba(255,255,255,0.92)"> es mejor.</tspan>
  </text>

  <!-- URL pill -->
  <rect x="878" y="414" width="256" height="50" rx="25"
    fill="rgba(255,255,255,0.14)"/>
  <rect x="878" y="414" width="256" height="50" rx="25"
    fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="1"/>

  <!-- Globe icon -->
  <circle cx="910" cy="439" r="13"
    fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="1.8"/>
  <ellipse cx="910" cy="439" rx="6.5" ry="13"
    fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="1.5"/>
  <line x1="897" y1="439" x2="923" y2="439"
    stroke="rgba(255,255,255,0.8)" stroke-width="1.5"/>
  <line x1="910" y1="426" x2="910" y2="452"
    stroke="rgba(255,255,255,0.8)" stroke-width="1.5"/>

  <!-- URL text -->
  <text x="1006" y="446"
    font-family="Arial, Helvetica, sans-serif"
    font-size="17" fill="rgba(255,255,255,0.88)"
    text-anchor="middle">syng-psi.vercel.app</text>

</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.status(200).send(svg);
};
