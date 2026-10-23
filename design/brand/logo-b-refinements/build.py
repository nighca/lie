from pathlib import Path

base = Path(__file__).parent
l_shape = 'M65 31C49 30 42 39 40 56L29 174C27 192 36 202 54 203L143 205C159 205 168 197 169 182C170 168 162 159 146 159L92 158C84 158 81 154 82 147L92 58C94 41 84 32 69 31Z'
i_shape = 'M216 89C201 89 194 97 193 110L185 184C183 198 190 206 203 206L218 206C230 205 237 198 238 185L245 111C247 96 239 89 225 89Z'
for name, shortening in [('baseline',0),('shorter',8),('shortest',16)]:
    e_shape = f'M295 43L{379-shortening} 28C{396-shortening} 25 {406-shortening} 35 {406-shortening} 49C{407-shortening} 62 {401-shortening} 70 {388-shortening} 72L319 85C314 86 313 88 313 93L314 101C314 104 315 106 320 105L368 97C382 95 389 103 390 115C391 128 384 136 371 138L322 147C317 148 315 151 315 155L315 161C315 164 317 166 322 165L383 158C400 156 410 164 411 179C412 195 403 203 389 204L297 209C276 210 265 198 266 177L266 78C267 57 276 47 295 43Z'
    body=f'<path fill="#111B45" d="{l_shape}"/><path fill="#075BFA" d="{i_shape}"/><circle fill="#FF665B" cx="221" cy="55" r="23"/><path fill="#111B45" d="{e_shape}"/>'
    (base/f'{name}.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 235" role="img" aria-label="LIE B方向，E上横缩短{shortening}单位"><title>LIE B方向对比</title>{body}</svg>\n')
