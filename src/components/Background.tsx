// DQ風冒険背景（昼）- 青空・緑の森・魔王城・木造の町

const SKY_TOP    = "#1852a0";
const SKY_BOT    = "#68b4e8";
const CLOUD      = "#e4f0ff";
const MTN_BACK   = "#4a6248";
const MTN_MID    = "#3a5238";
const GRASS      = "#2e8012";
const GRASS_D    = "#226009";
const TREE_D     = "#1a5c0e";
const TREE_M     = "#247a16";
const TREE_L     = "#309420";
const PATH       = "#c4a040";
const HOUSE_W    = "#9c7020";
const HOUSE_W2   = "#b88830";
const ROOF       = "#7a2e0e";
const ROOF2      = "#5c2008";
const CASTLE_S   = "#38384a";  // 城の石
const CASTLE_D   = "#26263a";  // 城の暗い部分
const CASTLE_R   = "#1e1e2c";  // 城の岩盤
const EVIL_WIN   = "#cc1122";  // 邪悪な窓の光

// 松の木（色指定付き）
function Pine({
  x, base, h, w,
  col1 = TREE_D, col2 = TREE_M, col3 = TREE_L,
}: {
  x: number; base: number; h: number; w: number;
  col1?: string; col2?: string; col3?: string;
}) {
  const th = h * 0.20;
  const tw = Math.max(3, w * 0.13);
  return (
    <g>
      <rect x={x - tw / 2} y={base - th} width={tw} height={th} fill={col1} />
      <polygon fill={col1}
        points={`${x - w},${base - th} ${x},${base - h * 0.60} ${x + w},${base - th}`} />
      <polygon fill={col2}
        points={`${x - w * 0.72},${base - h * 0.46} ${x},${base - h * 0.80} ${x + w * 0.72},${base - h * 0.46}`} />
      <polygon fill={col3}
        points={`${x - w * 0.44},${base - h * 0.66} ${x},${base - h} ${x + w * 0.44},${base - h * 0.66}`} />
    </g>
  );
}

// 広葉樹（丸い木）
function Tree({ x, base, r }: { x: number; base: number; r: number }) {
  return (
    <g>
      <rect x={x - 4} y={base - r * 0.6} width={8} height={r * 0.6} fill={TREE_D} />
      <circle cx={x} cy={base - r * 0.9} r={r} fill={TREE_M} />
      <circle cx={x - r * 0.3} cy={base - r * 1.1} r={r * 0.7} fill={TREE_L} />
    </g>
  );
}

// 木造の民家
function House({
  x, base, w, h, roof,
  wallColor = HOUSE_W, roofColor = ROOF,
}: {
  x: number; base: number; w: number; h: number; roof: number;
  wallColor?: string; roofColor?: string;
}) {
  return (
    <g>
      {/* 壁 */}
      <rect x={x} y={base - h} width={w} height={h} fill={wallColor} />
      {/* 屋根 */}
      <polygon
        points={`${x - 3},${base - h} ${x + w / 2},${base - h - roof} ${x + w + 3},${base - h}`}
        fill={roofColor}
      />
      {/* 窓 */}
      <rect x={x + 6} y={base - h + 10} width={12} height={10} fill="#ffd860" opacity="0.85" />
      {w > 50 && (
        <rect x={x + w - 20} y={base - h + 10} width={12} height={10} fill="#ffd860" opacity="0.8" />
      )}
      {/* ドア */}
      <rect x={x + w / 2 - 6} y={base - 24} width={12} height={24} fill={ROOF2} />
    </g>
  );
}

// 雲
function Cloud({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g fill={CLOUD} opacity="0.88">
      <ellipse cx={x}           cy={y}        rx={54 * s} ry={22 * s} />
      <ellipse cx={x - 28 * s}  cy={y - 6 * s} rx={32 * s} ry={20 * s} />
      <ellipse cx={x + 30 * s}  cy={y - 9 * s} rx={38 * s} ry={23 * s} />
      <ellipse cx={x + 8 * s}   cy={y - 16 * s} rx={30 * s} ry={18 * s} />
    </g>
  );
}

export default function Background() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: -1, overflow: "hidden" }}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1200 700"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="sky-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={SKY_TOP} />
            <stop offset="100%" stopColor={SKY_BOT} />
          </linearGradient>
          <linearGradient id="grass-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={GRASS} />
            <stop offset="100%" stopColor={GRASS_D} />
          </linearGradient>
          <radialGradient id="evil-aura" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#660022" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#660022" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="town-aura" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#ffd860" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#ffd860" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
            <stop offset="40%"  stopColor="transparent" />
            <stop offset="100%" stopColor="#04081a" stopOpacity="0.55" />
          </radialGradient>
          <linearGradient id="content-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="transparent" />
            <stop offset="100%" stopColor="#080818" stopOpacity="0.72" />
          </linearGradient>
        </defs>

        {/* ── 空 ── */}
        <rect width="1200" height="700" fill="url(#sky-g)" />

        {/* ── 太陽 ── */}
        <circle cx="980" cy="80" r="52" fill="#ffe840" opacity="0.9" />
        <circle cx="980" cy="80" r="42" fill="#fff060" opacity="0.95" />
        {/* 太陽光線 */}
        {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          return (
            <line key={i}
              x1={980 + Math.cos(rad) * 55} y1={80 + Math.sin(rad) * 55}
              x2={980 + Math.cos(rad) * 72} y2={80 + Math.sin(rad) * 72}
              stroke="#ffe840" strokeWidth="3" opacity="0.6"
            />
          );
        })}

        {/* ── 雲 ── */}
        <Cloud x={160} y={90}  s={1.1} />
        <Cloud x={440} y={65}  s={0.85} />
        <Cloud x={710} y={100} s={1.0} />
        <Cloud x={120} y={140} s={0.65} />
        <Cloud x={840} y={55}  s={0.75} />

        {/* ── 遠景の山（緑がかった灰色） ── */}
        <polygon fill={MTN_BACK} points="0,460 100,300 200,460" />
        <polygon fill={MTN_BACK} points="140,460 260,260 380,460" />
        <polygon fill={MTN_BACK} points="300,460 400,310 500,460" />
        <polygon fill={MTN_BACK} points="780,460 890,265 1000,460" />
        <polygon fill={MTN_BACK} points="920,460 1040,295 1160,460" />
        <polygon fill={MTN_BACK} points="1080,460 1160,325 1200,460" />
        {/* 山の雪・岩頂 */}
        <polygon fill="#c8d8c0"
          points="100,300 92,320 108,320" opacity="0.6" />
        <polygon fill="#c8d8c0"
          points="260,260 248,285 272,285" opacity="0.6" />
        <polygon fill="#c8d8c0"
          points="890,265 878,290 902,290" opacity="0.6" />

        {/* ── 魔王城（中央） ── */}
        {/* 邪悪なオーラ */}
        <ellipse cx="600" cy="340" rx="250" ry="180" fill="url(#evil-aura)" />

        {/* 岩盤の台地 */}
        <polygon fill={CASTLE_R}
          points="370,490 420,430 480,420 520,435 600,428 680,435 720,420 780,430 830,490" />

        {/* 外壁・カーテンウォール */}
        <rect x="430" y="452" width="340" height="40" fill={CASTLE_S} />
        {/* 城壁の鋸歯（ギザギザ） */}
        {[0,1,2,3,4,5,6,7,8,9].map(i => (
          <rect key={i} x={436 + i * 32} y={434} width={18} height={18} fill={CASTLE_S} />
        ))}

        {/* 左外塔 */}
        <rect x="424" y="358" width="70" height="136" fill={CASTLE_D} />
        <polygon fill={CASTLE_R} points="424,358 459,310 494,358" />
        {[0,1,2].map(i => (
          <rect key={i} x={428 + i * 22} y={342} width={16} height={16} fill={CASTLE_D} />
        ))}

        {/* 右外塔 */}
        <rect x="706" y="358" width="70" height="136" fill={CASTLE_D} />
        <polygon fill={CASTLE_R} points="706,358 741,310 776,358" />
        {[0,1,2].map(i => (
          <rect key={i} x={710 + i * 22} y={342} width={16} height={16} fill={CASTLE_D} />
        ))}

        {/* メインキープ */}
        <rect x="512" y="260" width="176" height="230" fill={CASTLE_S} />
        {[0,1,2,3,4,5].map(i => (
          <rect key={i} x={516 + i * 28} y={242} width={18} height={18} fill={CASTLE_S} />
        ))}

        {/* 左フランキングタワー */}
        <rect x="464" y="278" width="80" height="214" fill={CASTLE_D} />
        <polygon fill={CASTLE_R} points="464,278 504,220 544,278" />
        {[0,1,2].map(i => (
          <rect key={i} x={468 + i * 25} y={264} width={16} height={14} fill={CASTLE_D} />
        ))}

        {/* 右フランキングタワー */}
        <rect x="656" y="278" width="80" height="214" fill={CASTLE_D} />
        <polygon fill={CASTLE_R} points="656,278 696,220 736,278" />
        {[0,1,2].map(i => (
          <rect key={i} x={660 + i * 25} y={264} width={16} height={14} fill={CASTLE_D} />
        ))}

        {/* 中央高塔（左） */}
        <rect x="536" y="160" width="52" height="120" fill={CASTLE_D} />
        <polygon fill={CASTLE_R} points="536,160 562,100 588,160" />
        <rect x="540" y="146" width={14} height={14} fill={CASTLE_D} />
        <rect x="558" y="146" width={14} height={14} fill={CASTLE_D} />

        {/* 中央高塔（右） */}
        <rect x="612" y="160" width="52" height="120" fill={CASTLE_D} />
        <polygon fill={CASTLE_R} points="612,160 638,100 664,160" />
        <rect x="616" y="146" width={14} height={14} fill={CASTLE_D} />
        <rect x="634" y="146" width={14} height={14} fill={CASTLE_D} />

        {/* 最高の中央大尖塔 */}
        <rect x="570" y="80" width="60" height="200" fill={CASTLE_R} />
        <polygon fill="#16161e" points="570,80 600,10 630,80" />
        {/* 邪悪な旗 */}
        <rect x="597" y="10" width="3" height="32" fill="#880022" />
        <polygon points="600,10 624,22 600,34" fill="#cc0033" opacity="0.9" />

        {/* 城の門 */}
        <rect x="578" y="392" width="44" height="100" fill="#0c0c16" />
        <rect x="582" y="394" width="36" height="46" rx="18" fill="#0c0c16" />

        {/* 邪悪な窓（赤く光る） */}
        <rect x="552" y="295" width="22" height="12" fill={EVIL_WIN} opacity="0.8" />
        <rect x="626" y="295" width="22" height="12" fill={EVIL_WIN} opacity="0.8" />
        <rect x="552" y="328" width="22" height="12" fill={EVIL_WIN} opacity="0.7" />
        <rect x="626" y="328" width="22" height="12" fill={EVIL_WIN} opacity="0.7" />
        <rect x="548" y="358" width="22" height="10" fill={EVIL_WIN} opacity="0.6" />
        <rect x="630" y="358" width="22" height="10" fill={EVIL_WIN} opacity="0.6" />
        {/* 高塔の窓 */}
        <rect x="553" y="195" width="18" height="10" fill={EVIL_WIN} opacity="0.75" />
        <rect x="629" y="195" width="18" height="10" fill={EVIL_WIN} opacity="0.75" />
        <rect x="585" y="130" width="30" height="12" fill={EVIL_WIN} opacity="0.8" />
        {/* 窓の光彩 */}
        <rect x="551" y="294" width="24" height="14" fill="#ff2233" opacity="0.25" />
        <rect x="625" y="294" width="24" height="14" fill="#ff2233" opacity="0.25" />

        {/* 中景の丘 */}
        <polygon fill={MTN_MID} points="0,510 0,400 150,340 300,510" />
        <polygon fill={MTN_MID} points="250,510 360,368 470,510" />
        <polygon fill={MTN_MID} points="750,510 860,362 970,510" />
        <polygon fill={MTN_MID} points="920,510 1060,340 1200,400 1200,510" />

        {/* ── 木造の町（左） ── */}
        <ellipse cx="175" cy="486" rx="155" ry="55" fill="url(#town-aura)" />
        <House x={42}  base={512} w={56} h={58} roof={30} wallColor={HOUSE_W2} roofColor={ROOF}  />
        <House x={106} base={506} w={48} h={65} roof={34} wallColor={HOUSE_W}  roofColor={ROOF2} />
        <House x={162} base={513} w={52} h={56} roof={28} wallColor={HOUSE_W2} roofColor={ROOF}  />
        <House x={222} base={508} w={46} h={60} roof={32} wallColor={HOUSE_W}  roofColor={ROOF2} />
        {/* 教会 */}
        <rect  x={278} y={430} width={42} height={84} fill={HOUSE_W2} />
        <polygon points="275,430 299,388 323,430" fill={ROOF} />
        <rect  x={292} y={388} width={14} height={22} fill={ROOF} />
        <rect  x={296} y={368} width={6}  height={20} fill="#6a2008" />
        {/* 十字 */}
        <rect x={296} y={368} width={6} height={14} fill="#c84010" opacity="0.8" />
        <rect x={292} y={374} width={14} height={4} fill="#c84010" opacity="0.8" />
        {/* 柵 */}
        {[0,1,2,3,4,5].map(i => (
          <rect key={i} x={44 + i * 20} y={510} width={6} height={16} fill={HOUSE_W} opacity="0.8" />
        ))}
        <rect x={42} y={510} width={120} height={4} fill={HOUSE_W} opacity="0.6" />

        {/* ── 木造の町（右） ── */}
        <House x={870} base={510} w={50} h={55} roof={28} wallColor={HOUSE_W}  roofColor={ROOF2} />
        <House x={928} base={514} w={54} h={60} roof={32} wallColor={HOUSE_W2} roofColor={ROOF}  />
        <House x={990} base={508} w={46} h={58} roof={30} wallColor={HOUSE_W}  roofColor={ROOF2} />
        <House x={1044}base={512} w={52} h={54} roof={28} wallColor={HOUSE_W2} roofColor={ROOF}  />
        <rect x={870} y={510} width={110} height={4} fill={HOUSE_W} opacity="0.6" />
        {[0,1,2,3,4].map(i => (
          <rect key={i} x={872 + i * 20} y={510} width={6} height={14} fill={HOUSE_W} opacity="0.8" />
        ))}

        {/* ── 森（左） ── */}
        <Tree  x={0}   base={520} r={36} />
        <Pine  x={38}  base={524} h={80} w={30} />
        <Tree  x={72}  base={518} r={32} />
        <Pine  x={106} base={522} h={72} w={28} />
        <Tree  x={330} base={520} r={34} />
        <Pine  x={368} base={516} h={76} w={29} />
        <Tree  x={404} base={522} r={30} />
        <Pine  x={438} base={518} h={70} w={27} />
        <Tree  x={470} base={524} r={28} />

        {/* ── 森（右） ── */}
        <Pine  x={740}  base={520} h={76} w={29} />
        <Tree  x={778}  base={516} r={34} />
        <Pine  x={814}  base={522} h={70} w={27} />
        <Tree  x={1100} base={518} r={32} />
        <Pine  x={1136} base={524} h={80} w={30} />
        <Tree  x={1172} base={520} r={36} />
        <Pine  x={1200} base={518} h={72} w={28} />

        {/* ── 草地（地面） ── */}
        <rect x="0" y="530" width="1200" height="170" fill="url(#grass-g)" />
        {/* 草のテクスチャ */}
        {[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(i => (
          <g key={i}>
            <rect x={30 + i * 78} y={528} width={4} height={12} fill={GRASS} opacity="0.6" />
            <rect x={50 + i * 78} y={530} width={3} height={9}  fill={TREE_M} opacity="0.4" />
          </g>
        ))}

        {/* ── 土の道（中央） ── */}
        <polygon fill={PATH}
          points="530,532 670,532 730,700 470,700" />
        {/* 石畳 */}
        {[545,570,600,630].map((x, i) => (
          <ellipse key={i} cx={x} cy={560 + i * 30} rx={12} ry={7}
            fill="#b09030" opacity="0.5" />
        ))}

        {/* ── 周囲の暗化（UI見やすさ） ── */}
        <rect width="1200" height="700" fill="url(#vignette)" />
        <rect x="0" y="400" width="1200" height="300" fill="url(#content-fade)" />
      </svg>
    </div>
  );
}
