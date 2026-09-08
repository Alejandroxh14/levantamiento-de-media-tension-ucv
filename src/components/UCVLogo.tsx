import React, { useState } from 'react';

interface UCVLogoProps {
  className?: string;
  size?: number | string;
}

export const UCVLogo: React.FC<UCVLogoProps> = ({ 
  className = "w-14 h-14"
}) => {
  const [imgError, setImgError] = useState(false);

  if (!imgError) {
    return (
      <img
        src="/ucv_logo.png"
        alt="Escudo Oficial a Color - Universidad Central de Venezuela (UCV)"
        className={`object-contain select-none rounded-full bg-white ${className}`}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
      />
    );
  }

  // Full color SVG fallback
  return (
    <svg 
      viewBox="0 0 500 500" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={`select-none ${className}`}
    >
      {/* Background circle */}
      <circle cx="250" cy="250" r="240" fill="#FFFFFF" />
      
      {/* Outer borders */}
      <circle cx="250" cy="250" r="240" stroke="#111827" strokeWidth="12" fill="none" />
      <circle cx="250" cy="250" r="226" stroke="#111827" strokeWidth="3" fill="none" />
      <circle cx="250" cy="250" r="176" stroke="#111827" strokeWidth="8" fill="none" />
      <circle cx="250" cy="250" r="168" stroke="#111827" strokeWidth="2.5" fill="none" />

      {/* Yellow Stars in Outer Ring */}
      <g fill="#FACC15" stroke="#111827" strokeWidth="2.5">
        {/* Left Star */}
        <polygon points="46,250 54,232 64,248 48,238 62,236" transform="scale(1.7) translate(-10, -80)" />
        {/* Right Star */}
        <polygon points="266,250 274,232 284,248 268,238 282,236" transform="scale(1.7) translate(-82, -80)" />
      </g>

      {/* Curved Texts */}
      <path id="ucvTopArcColor" d="M 72 250 A 200 200 0 0 1 428 250" fill="none" />
      <path id="ucvBottomArcColor" d="M 428 250 A 200 200 0 0 1 72 250" fill="none" />

      <text fill="#111827" fontSize="30" fontWeight="900" letterSpacing="5" textAnchor="middle" fontFamily="Public Sans, Impact, sans-serif">
        <textPath href="#ucvTopArcColor" startOffset="50%">
          UNIVERSIDAD CENTRAL
        </textPath>
      </text>

      <text fill="#111827" fontSize="28" fontWeight="900" letterSpacing="6" textAnchor="middle" fontFamily="Public Sans, Impact, sans-serif">
        <textPath href="#ucvBottomArcColor" startOffset="50%">
          CARACAS - VENEZUELA
        </textPath>
      </text>

      {/* Internal Elements */}
      {/* Light Rays */}
      <g stroke="#111827" strokeWidth="2.5" opacity="0.9">
        <line x1="250" y1="160" x2="250" y2="85" strokeWidth="3.5" />
        <line x1="225" y1="162" x2="195" y2="95" />
        <line x1="275" y1="162" x2="305" y2="95" />
        <line x1="200" y1="170" x2="155" y2="115" />
        <line x1="300" y1="170" x2="345" y2="115" />
        <line x1="180" y1="185" x2="125" y2="145" />
        <line x1="320" y1="185" x2="375" y2="145" />
      </g>

      {/* 7 Yellow Stars of Wisdom */}
      <g fill="#FACC15" stroke="#111827" strokeWidth="2">
        <polygon points="250,85 254,94 263,94 256,99 259,108 250,103 241,108 244,99 237,94 246,94" />
        <polygon points="210,95 214,104 223,104 216,109 219,118 210,113 201,118 204,109 197,104 206,104" />
        <polygon points="290,95 294,104 303,104 296,109 299,118 290,113 281,118 284,109 277,104 286,104" />
        <polygon points="175,118 179,127 188,127 181,132 184,141 175,136 166,141 169,132 162,127 171,127" />
        <polygon points="325,118 329,127 338,127 331,132 334,141 325,136 316,141 319,132 312,127 321,127" />
        <polygon points="148,155 152,164 161,164 154,169 157,178 148,173 139,178 142,169 135,164 144,164" />
        <polygon points="352,155 356,164 365,164 358,169 361,178 352,173 343,178 346,169 339,164 348,164" />
      </g>

      {/* Classical Lamp / Torch of Knowledge */}
      <g>
        {/* Flame (Orange & Yellow) */}
        <path d="M 244 135 C 238 126 248 114 250 108 C 252 114 262 126 256 135 C 252 141 248 141 244 135 Z" fill="#F97316" stroke="#111827" strokeWidth="2" />
        <path d="M 247 130 C 245 124 250 118 250 115 C 251 118 255 124 253 130 Z" fill="#FACC15" />
        
        {/* Lamp Base (Dark Metallic Grey) */}
        <path d="M 220 160 C 220 148 232 142 250 142 C 268 142 280 148 280 160 C 280 176 268 184 260 192 L 260 205 L 240 205 L 240 192 C 232 184 220 176 220 160 Z" fill="#475569" stroke="#111827" strokeWidth="4" />
        <rect x="230" y="205" width="40" height="8" rx="2" fill="#334155" stroke="#111827" strokeWidth="3" />
      </g>

      {/* Red Leather Bound Books */}
      <g stroke="#111827" strokeWidth="4">
        {/* Top Book */}
        <polygon points="150,225 250,205 350,225 250,245" fill="#DC2626" />
        <path d="M 150 225 L 150 250 L 250 270 L 350 250 L 350 225" fill="#FEF08A" />
        <path d="M 150 225 L 150 250 L 250 270" fill="#B91C1C" />
        
        {/* Bottom Book */}
        <polygon points="160,290 250,270 340,290 250,310" fill="#DC2626" />
        <path d="M 160 290 L 160 315 L 250 335 L 340 315 L 340 290" fill="#FEF08A" />
        <path d="M 160 290 L 160 315 L 250 335" fill="#B91C1C" />
      </g>

      {/* Parchment Scroll */}
      <path d="M 155 260 Q 180 245 225 270 Q 280 295 335 265 L 325 295 Q 275 325 220 300 Q 175 275 145 290 Z" fill="#FEF3C7" stroke="#111827" strokeWidth="3" />

      {/* Inkwell & White Feather Quill */}
      <polygon points="230,285 270,285 278,315 222,315" fill="#64748B" stroke="#111827" strokeWidth="3.5" />
      <path d="M 250 285 Q 280 220 330 170 C 318 182 305 195 300 215 C 295 230 275 260 250 285 Z" fill="#FFFFFF" stroke="#111827" strokeWidth="3" />

      {/* Green Laurel & Olive Branches */}
      <g fill="#16A34A" stroke="#111827" strokeWidth="2.5">
        {/* Left leaves */}
        <path d="M 130 205 Q 115 195 100 208 Q 116 220 130 205 Z" />
        <path d="M 120 238 Q 102 230 90 245 Q 108 255 120 238 Z" />
        <path d="M 115 275 Q 98 270 88 288 Q 106 295 115 275 Z" />
        <path d="M 122 312 Q 106 312 98 330 Q 116 335 122 312 Z" />
        <path d="M 140 345 Q 126 352 124 372 Q 140 372 140 345 Z" />
        <path d="M 170 375 Q 158 390 172 405 Q 184 390 170 375 Z" />

        {/* Right leaves */}
        <path d="M 370 205 Q 385 195 400 208 Q 384 220 370 205 Z" />
        <path d="M 380 238 Q 398 230 410 245 Q 392 255 380 238 Z" />
        <path d="M 385 275 Q 402 270 412 288 Q 394 295 385 275 Z" />
        <path d="M 378 312 Q 394 312 402 330 Q 384 335 378 312 Z" />
        <path d="M 360 345 Q 374 352 376 372 Q 360 372 360 345 Z" />
        <path d="M 330 375 Q 342 390 328 405 Q 316 390 330 375 Z" />
      </g>

      {/* Red Berries */}
      <g fill="#DC2626" stroke="#111827" strokeWidth="2">
        <circle cx="112" cy="225" r="7" />
        <circle cx="102" cy="262" r="7" />
        <circle cx="108" cy="300" r="7" />
        <circle cx="128" cy="336" r="7" />
        <circle cx="155" cy="368" r="7" />
        <circle cx="388" cy="225" r="7" />
        <circle cx="398" cy="262" r="7" />
        <circle cx="392" cy="300" r="7" />
        <circle cx="372" cy="336" r="7" />
        <circle cx="345" cy="368" r="7" />
      </g>

      {/* Blue Ribbon Bow at the bottom */}
      <g fill="#1D4ED8" stroke="#111827" strokeWidth="3">
        <path d="M 225 395 C 215 410 210 426 230 424 C 246 422 248 408 250 404 C 252 408 254 422 270 424 C 290 426 285 410 275 395 Z" />
        <circle cx="250" cy="402" r="9" fill="#1E40AF" stroke="#111827" strokeWidth="3" />
        <path d="M 238 410 L 210 435 L 232 432 L 244 416" />
        <path d="M 262 410 L 290 435 L 268 432 L 256 416" />
      </g>
    </svg>
  );
};
