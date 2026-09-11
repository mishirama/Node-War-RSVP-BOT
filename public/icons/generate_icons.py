#!/usr/bin/env python3
import os

icons_dir = "/app/applet/public/icons"
os.makedirs(icons_dir, exist_ok=True)

# 1. ELEPHANT (Elephant.png)
elephant_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="#FFFFFF">
  <!-- BDO Guild War Elephant Head Profile -->
  <path fill-rule="evenodd" d="M 230 46 C 145 46 68 95 38 178 C 15 240 40 310 98 345 C 135 368 180 365 220 378 C 242 385 252 400 258 420 C 267 452 288 482 322 485 C 342 487 358 472 348 450 C 337 426 316 410 300 390 C 286 373 280 354 278 335 C 275 308 274 278 288 266 C 298 257 322 254 336 266 C 348 277 354 294 362 312 C 374 346 405 365 435 342 C 460 322 466 288 456 258 C 442 215 408 180 365 166 C 374 156 382 138 372 122 C 358 102 324 107 304 116 C 270 131 240 156 220 186 C 215 162 218 132 228 108 C 235 88 248 68 238 55 C 234 49 226 46 218 46 Z M 225 135 C 255 135 285 152 298 175 C 275 180 250 175 228 162 C 220 152 220 142 225 135 Z M 300 255 C 345 250 415 268 495 215 C 445 285 362 325 295 318 C 290 295 292 270 300 255 Z M 285 410 C 295 430 310 445 328 450 C 322 460 308 460 296 450 C 288 438 284 425 285 410 Z" />
</svg>'''

# 2. HWACHA (Hwacha.png)
hwacha_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="#FFFFFF">
  <!-- BDO Hwacha Siege Engine -->
  <!-- 5 Firing Arrows with sharp triangular tips -->
  <path d="M 235 15 L 260 65 L 243 65 L 243 145 L 230 145 L 230 65 L 212 65 Z" fill="#FFFFFF" />
  <path d="M 175 55 L 200 105 L 183 105 L 183 185 L 170 185 L 170 105 L 152 105 Z" transform="rotate(-15 175 120)" fill="#FFFFFF" />
  <path d="M 125 95 L 150 145 L 133 145 L 133 225 L 120 225 L 120 145 L 102 145 Z" transform="rotate(-25 125 160)" fill="#FFFFFF" />
  <path d="M 255 75 L 275 120 L 260 120 L 260 195 L 248 195 L 248 120 L 233 120 Z" transform="rotate(10 255 135)" fill="#FFFFFF" />
  <path d="M 295 110 L 315 155 L 300 155 L 300 225 L 288 225 L 288 155 L 273 155 Z" transform="rotate(20 295 168)" fill="#FFFFFF" />
  
  <!-- Angled Carriage Body -->
  <path d="M 130 205 L 365 105 C 385 97 410 108 418 130 L 430 165 C 438 185 427 210 405 218 L 180 310 Z" fill="#FFFFFF" />
  <!-- 3 Rivets on top frame -->
  <circle cx="365" cy="148" r="10" fill="#17191d" />
  <circle cx="310" cy="172" r="10" fill="#17191d" />
  <circle cx="255" cy="196" r="10" fill="#17191d" />
  
  <!-- Rear Arrow Slots Rack -->
  <path d="M 360 195 L 435 245 L 405 290 L 330 240 Z" fill="none" stroke="#FFFFFF" stroke-width="12" />
  <line x1="355" y1="215" x2="425" y2="265" stroke="#FFFFFF" stroke-width="8" />
  <line x1="345" y1="235" x2="415" y2="285" stroke="#FFFFFF" stroke-width="8" />
  <line x1="335" y1="255" x2="405" y2="305" stroke="#FFFFFF" stroke-width="8" />
  <line x1="325" y1="275" x2="395" y2="325" stroke="#FFFFFF" stroke-width="8" />
  
  <!-- Support Frame Leg extending to ground -->
  <path d="M 285 320 L 465 440 C 475 447 482 462 475 474 L 460 495 C 452 505 438 508 428 500 L 255 385 Z" fill="#FFFFFF" />
  
  <!-- Rear Handle Peg -->
  <path d="M 140 245 L 65 295 C 55 302 52 318 60 328 C 68 338 82 340 92 334 L 165 285 Z" fill="#FFFFFF" />
  <circle cx="55" cy="315" r="14" fill="#FFFFFF" />
  
  <!-- Large Spoke Wheel with 10 Spokes -->
  <g transform="translate(165, 385)">
    <!-- Outer Rim -->
    <circle cx="0" cy="0" r="95" fill="none" stroke="#FFFFFF" stroke-width="22" />
    <!-- Center Hub -->
    <circle cx="0" cy="0" r="28" fill="#FFFFFF" />
    <circle cx="0" cy="0" r="14" fill="#17191d" />
    <!-- 10 Spokes -->
    <line x1="0" y1="0" x2="0" y2="-95" stroke="#FFFFFF" stroke-width="14" />
    <line x1="0" y1="0" x2="56" y2="-77" stroke="#FFFFFF" stroke-width="14" />
    <line x1="0" y1="0" x2="90" y2="-29" stroke="#FFFFFF" stroke-width="14" />
    <line x1="0" y1="0" x2="90" y2="29" stroke="#FFFFFF" stroke-width="14" />
    <line x1="0" y1="0" x2="56" y2="77" stroke="#FFFFFF" stroke-width="14" />
    <line x1="0" y1="0" x2="0" y2="95" stroke="#FFFFFF" stroke-width="14" />
    <line x1="0" y1="0" x2="-56" y2="77" stroke="#FFFFFF" stroke-width="14" />
    <line x1="0" y1="0" x2="-90" y2="29" stroke="#FFFFFF" stroke-width="14" />
    <line x1="0" y1="0" x2="-90" y2="-29" stroke="#FFFFFF" stroke-width="14" />
    <line x1="0" y1="0" x2="-56" y2="-77" stroke="#FFFFFF" stroke-width="14" />
  </g>
</svg>'''

# 3. FLAG MAN (Flag Man.png)
flag_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="#FFFFFF">
  <!-- BDO Guild War Battle Standard / Flag Man -->
  <!-- Top Finial Spearhead -->
  <path d="M 256 12 L 285 75 L 268 75 L 268 115 L 244 115 L 244 75 L 227 75 Z" fill="#FFFFFF" />
  <!-- Side Diamond Guard Leaves -->
  <polygon points="175,115 215,95 245,115 215,135" fill="#FFFFFF" />
  <polygon points="337,115 297,95 267,115 297,135" fill="#FFFFFF" />
  
  <!-- Crossbar -->
  <rect x="155" y="115" width="202" height="22" rx="4" fill="#FFFFFF" />
  <rect x="195" y="105" width="122" height="10" rx="3" fill="#FFFFFF" />
  
  <!-- Hanging Banner Fabric -->
  <path d="M 172 137 L 340 137 L 340 330 C 340 348 325 362 305 362 L 207 362 C 188 362 172 348 172 330 Z" fill="#FFFFFF" />
  
  <!-- 8-Pointed Star Crest inside Banner -->
  <g transform="translate(256, 245)">
    <!-- Vertical & Horizontal points -->
    <polygon points="0,-72 16,-20 68,0 16,20 0,72 -16,20 -68,0 -16,-20" fill="#17191d" />
    <!-- Diagonal points -->
    <polygon points="0,-48 12,-14 46,0 12,14 0,48 -12,14 -46,0 -12,-14" transform="rotate(45)" fill="#17191d" />
  </g>
  
  <!-- Lower Pole Shaft -->
  <rect x="244" y="362" width="24" height="65" fill="#FFFFFF" />
  <!-- Tiered Collar Ring -->
  <rect x="228" y="405" width="56" height="15" rx="6" fill="#FFFFFF" />
  <rect x="238" y="420" width="36" height="12" rx="4" fill="#FFFFFF" />
  <rect x="244" y="432" width="24" height="38" fill="#FFFFFF" />
  
  <!-- Pedestal Base -->
  <path d="M 165 470 C 165 458 200 450 256 450 C 312 450 347 458 347 470 L 355 490 C 355 498 340 504 256 504 C 172 504 157 498 157 490 Z" fill="#FFFFFF" />
</svg>'''

# 4. FLAME TOWER (Flame Tower.png)
flame_tower_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <!-- BDO Flame Tower Siege Weapon -->
  <g fill="#FFFFFF">
    <!-- Curved Top Tube/Hose -->
    <path d="M 335 150 C 335 70 410 40 450 80 C 485 115 480 180 470 240 C 460 290 460 330 450 360 L 432 355 C 442 325 442 290 452 240 C 462 185 465 130 436 100 C 408 72 352 92 352 150 Z" />
    
    <!-- Tower Cap Dome -->
    <path d="M 305 180 C 305 145 345 130 385 130 C 425 130 465 145 465 180 Z" />
    <rect x="345" y="115" width="80" height="15" rx="7" />
    
    <!-- Main Cylindrical Turret Body -->
    <rect x="295" y="180" width="180" height="270" rx="16" />
    
    <!-- Projecting Nozzle Bar -->
    <rect x="245" y="240" width="55" height="40" rx="6" />
    
    <!-- Base Skirt with Rivets -->
    <path d="M 275 450 L 495 450 C 505 450 512 460 512 470 L 512 485 C 512 495 502 502 490 502 L 280 502 C 268 502 258 495 258 485 L 258 470 C 258 460 265 450 275 450 Z" />
    <circle cx="305" cy="478" r="7" fill="#17191d" />
    <circle cx="360" cy="478" r="7" fill="#17191d" />
    <circle cx="415" cy="478" r="7" fill="#17191d" />
    <circle cx="470" cy="478" r="7" fill="#17191d" />
  </g>
  
  <!-- Vibrant 3-Layer Flame Burst spouting left -->
  <!-- Outer Crimson Red Layer -->
  <path d="M 245 258 C 220 220 180 200 130 195 C 150 215 160 230 135 235 C 105 240 70 240 30 265 C 15 275 5 285 0 290 C 25 292 45 285 60 280 C 40 295 25 315 10 325 C 45 330 80 320 110 305 C 105 320 110 338 125 348 C 145 362 180 355 210 330 C 185 345 175 365 190 380 C 215 375 235 345 245 310 Z" fill="#A11E22" />
  <!-- Middle Orange Flame Layer -->
  <path d="M 245 260 C 215 235 185 220 150 220 C 165 235 170 245 150 252 C 125 260 90 265 60 280 C 78 280 95 272 110 268 C 95 282 80 298 65 308 C 95 310 120 300 142 288 C 138 300 145 315 158 322 C 175 332 205 325 228 305 C 210 318 205 332 218 342 C 235 335 245 310 245 285 Z" fill="#E25B28" />
  <!-- Inner Golden Yellow Core -->
  <path d="M 245 262 C 225 248 200 240 175 242 C 185 252 188 260 172 266 C 150 274 125 280 100 292 C 118 290 135 282 150 278 C 138 290 128 300 115 308 C 140 308 160 298 178 288 C 178 298 185 308 198 312 C 215 318 235 305 245 285 Z" fill="#FFBF1F" />
</svg>'''

# 5. WITCH (Witch.png)
witch_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="#FFFFFF">
  <!-- BDO Witch Class Stylized Hat Emblem -->
  <path fill-rule="evenodd" d="M 330 65 C 375 75 425 125 405 175 C 385 225 340 235 320 270 C 305 295 312 322 342 340 C 375 360 420 348 460 330 C 490 318 512 305 500 325 C 485 350 440 375 390 395 C 330 420 255 435 180 430 C 110 425 45 395 10 348 C -2 332 5 322 25 328 C 65 340 110 342 150 332 C 180 325 200 305 195 280 C 188 245 155 235 125 225 C 85 212 50 185 65 145 C 80 108 135 95 180 102 C 230 110 270 140 295 180 C 302 150 295 115 275 88 C 265 75 272 65 290 62 C 305 60 318 62 330 65 Z M 295 275 C 315 260 330 230 332 200 C 315 215 290 220 272 205 C 255 190 250 168 260 148 C 230 162 205 190 200 225 C 220 220 242 225 255 240 C 270 258 280 270 295 275 Z" />
</svg>'''

# 6. WIZARD (Wizard.png)
wizard_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="#FFFFFF">
  <!-- BDO Wizard Class Stylized Magic Emblem -->
  <path fill-rule="evenodd" d="M 455 85 C 470 120 450 170 425 210 C 395 260 355 295 330 345 C 315 375 325 405 355 422 C 390 440 435 430 475 410 C 498 398 512 390 502 408 C 485 435 435 465 380 480 C 315 498 240 490 175 460 C 105 428 45 370 15 305 C 5 282 15 275 35 285 C 75 305 125 315 168 305 C 205 295 228 270 225 235 C 220 195 185 178 152 162 C 108 142 75 110 92 68 C 110 25 172 10 220 20 C 275 32 320 72 345 120 C 352 85 340 45 315 15 C 305 2 315 -5 332 -2 C 352 2 368 8 382 15 Z M 325 285 C 348 268 368 232 368 198 C 348 215 320 222 298 205 C 278 188 272 162 285 140 C 250 158 222 190 218 230 C 240 222 265 228 280 248 C 298 268 310 280 325 285 Z" />
</svg>'''

# 7. WITCH & WIZARD COMBINED (Witch/Wizard)
witch_wizard_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <!-- Witch Hat + Wizard Staff Crest -->
  <g fill="#FFFFFF">
    <!-- Witch Hat left -->
    <path d="M 210 110 C 245 118 285 160 268 200 C 252 240 215 248 200 275 C 188 295 194 318 218 332 C 245 348 280 338 312 324 C 335 314 355 302 345 318 C 332 338 295 358 255 375 C 205 395 145 408 85 404 C 30 400 -20 375 -50 338 C -60 325 -52 318 -38 322 C -5 332 30 334 62 325 C 88 320 102 304 98 284 C 92 255 65 248 40 240 C 8 230 -20 208 -8 175 C 5 145 50 135 85 140 C 125 148 158 172 178 205 C 184 180 178 152 162 130 C 154 120 160 110 175 108 C 188 106 198 108 210 110 Z" transform="scale(0.8) translate(80, 70)" />
    <!-- Wizard Surge right -->
    <path d="M 380 90 C 395 125 375 170 350 210 C 320 260 280 295 255 345 C 240 375 250 405 280 422 C 315 440 360 430 400 410 C 422 398 438 390 428 408 C 410 435 360 465 305 480 C 240 498 165 490 100 460 C 130 455 160 430 185 400 C 205 375 210 345 198 320 C 185 295 160 285 135 280 C 165 270 195 250 210 220 C 230 180 215 140 180 115 C 205 110 235 125 255 155 C 265 118 250 78 225 45 C 245 42 270 50 290 65 C 320 70 355 75 380 90 Z" transform="scale(0.8) translate(140, 40)" opacity="0.9" />
  </g>
</svg>'''

files = {
    "elephant.svg": elephant_svg,
    "hwacha.svg": hwacha_svg,
    "flag.svg": flag_svg,
    "flame_tower.svg": flame_tower_svg,
    "witch.svg": witch_svg,
    "wizard.svg": wizard_svg,
    "witch_wizard.svg": witch_wizard_svg,
}

for name, content in files.items():
    p = os.path.join(icons_dir, name)
    with open(p, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")
    print(f"Wrote {p}")
