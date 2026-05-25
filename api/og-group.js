export default async function handler(req, res) {
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
  <rect width="1200" height="630" fill="url(#bg)"/>
  <path d="M824,0 C778,160 778,470 824,630 L1200,630 L1200,0 Z" fill="url(#panel)"/>
  <circle cx="58" cy="90" r="7" fill="#9BA8FF" opacity="0.45"/>
  <circle cx="222" cy="50" r="5" fill="#F5A623" opacity="0.55"/>
  <circle cx="332" cy="108" r="4" fill="#9BA8FF" opacity="0.38"/>
  <circle cx="68" cy="512" r="6" fill="#9BA8FF" opacity="0.40"/>
  <circle cx="178" cy="556" r="4" fill="#F5A623" opacity="0.48"/>
  <circle cx="108" cy="270" r="37" fill="url(#pSide)" opacity="0.70"/>
  <path d="M48,458 Q50,344 108,344 Q166,344 168,458 Z" fill="url(#pSide)" opacity="0.70"/>
  <circle cx="292" cy="277" r="34" fill="url(#pSide)" opacity="0.70"/>
  <path d="M236,458 Q238,352 292,352 Q346,352 348,458 Z" fill="url(#pSide)" opacity="0.70"/>
  <circle cx="200" cy="252" r="55" fill="url(#pMain)"/>
  <path d="M116,458 Q118,356 200,356 Q282,356 284,458 Z" fill="url(#pMain)"/>
  <ellipse cx="78" cy="450" rx="29" ry="12" fill="#28A04A" transform="rotate(-42 78 450)"/>
  <ellipse cx="100" cy="436" rx="25" ry="10" fill="#3EBB62" transform="rotate(-22 100 436)"/>
  <ellipse cx="60" cy="465" rx="20" ry="8" fill="#28A04A" transform="rotate(-60 60 465)"/>
  <ellipse cx="320" cy="447" rx="25" ry="10" fill="#28A04A" transform="rotate(32 320 447)"/>
  <ellipse cx="304" cy="460" rx="20" ry="8" fill="#3EBB62" transform="rotate(50 304 460)"/>
  <text x="572" y="218" font-family="'Arial Black', 'Helvetica Neue', Arial, sans-serif" font-size="72" font-weight="900" fill="#0D1240" text-anchor="middle">${gName}</text>
  <circle cx="810" cy="188" r="26" fill="#FF8C30"/>
  <path d="M810,200 C798,191 788,185 788,176 C788,169 793,165 799,165 C803,165 807,167 810,171 C813,167 817,165 821,165 C827,165 832,169 832,176 C832,185 822,191 810,200 Z" fill="white"/>
  <text x="572" y="280" font-family="Arial, Helvetica, sans-serif" font-size="31" font-weight="700" fill="#5252D8" text-anchor="middle">${iName} te invit&#243; a colaborar</text>
  <rect x="328" y="308" width="488" height="60" rx="30" fill="white" opacity="0.96"/>
  <rect x="328" y="308" width="488" height="60" rx="30" fill="none" stroke="#E8E0D0" stroke-width="1.5"/>
  <g transform="translate(364, 325)" fill="#5252D8">
    <circle cx="11" cy="9" r="7"/>
    <path d="M0,34 Q0,20 11,20 Q22,20 22,34 Z"/>
    <circle cx="26" cy="7" r="6" opacity="0.6"/>
    <path d="M17,34 Q18,22 27,22 Q34,22 34,34 Z" opacity="0.6"/>
  </g>
  <text x="412" y="348" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" fill="#0D1240">${mCount} miembros</text>
  <rect x="562" y="320" width="1.5" height="36" fill="#D8D0C8"/>
  <text x="702" y="347" font-family="Arial, Helvetica, sans-serif" font-size="19" fill="#666666" text-anchor="middle">Organiza juntos sus tareas</text>
  <path d="M452,440 C460,428 470,444 462,452" stroke="#5252D8" stroke-width="3" fill="none" stroke-linecap="round"/>
  <line x1="460" y1="440" x2="492" y2="440" stroke="#5252D8" stroke-width="3" stroke-linecap="round"/>
  <path d="M694,440 C686,428 676,444 684,452" stroke="#5252D8" stroke-width="3" fill="none" stroke-linecap="round"/>
  <line x1="686" y1="440" x2="654" y2="440" stroke="#5252D8" stroke-width="3" stroke-linecap="round"/>
  <text x="572" y="452" font-family="'Arial Black', 'Helvetica Neue', Arial, sans-serif" font-size="38" font-weight="900" fill="#5252D8" text-anchor="middle">&#218;nete a Syng</text>
  <rect x="874" y="162" width="100" height="100" rx="24" fill="url(#iconBox)"/>
  <text x="924" y="240" font-family="'Arial Black', 'Helvetica Neue', Arial, sans-serif" font-size="52" font-weight="900" fill="white" text-anchor="middle">${mCount}</text>
  <circle cx="940" cy="258" r="6" fill="#F5A623"/>
  <text x="1002" y="242" font-family="'Arial Black', 'Helvetica Neue', Arial, sans-serif" font-size="60" font-weight="900" fill="white" text-anchor="start">Syng</text>
  <text x="1020" y="325" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="rgba(255,255,255,0.92)" text-anchor="middle">Organiza tu vida,</text>
  <text x="992" y="363" font-family="Arial, Helvetica, sans-serif" font-size="26" text-anchor="start"><tspan fill="#F5A623" font-weight="700">juntos</tspan><tspan fill="rgba(255,255,255,0.92)"> es mejor.</tspan></text>
  <rect x="878" y="414" width="256" height="50" rx="25" fill="rgba(255,255,255,0.14)"/>
  <rect x="878" y="414" width="256" height="50" rx="25" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="1"/>
  <circle cx="910" cy="439" r="13" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="1.8"/>
  <ellipse cx="910" cy="439" rx="6.5" ry="13" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="1.5"/>
  <line x1="897" y1="439" x2="923" y2="439" stroke="rgba(255,255,255,0.8)" stroke-width="1.5"/>
  <line x1="910" y1="426" x2="910" y2="452" stroke="rgba(255,255,255,0.8)" stroke-width="1.5"/>
  <text x="1006" y="446" font-family="Arial, Helvetica, sans-serif" font-size="17" fill="rgba(255,255,255,0.88)" text-anchor="middle">syng-psi.vercel.app</text>
</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.status(200).send(svg);
}
