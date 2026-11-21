"""Small original vector studies and an original ambient audio sample for the demo."""
from pathlib import Path
import math, struct, wave

root=Path(__file__).resolve().parents[1]
palette={
    'blue':('#DDE9FA','#0C47A6','#80A9EA','FORM / 01'),
    'coral':('#F4DDD5','#AE4736','#ED9F84','COLOR / 02'),
    'lilac':('#E9E1F4','#6C448F','#B196D4','SPACE / 03')
}
for name,(bg,ink,accent,label) in palette.items():
    svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><rect width="800" height="500" fill="{bg}"/><path d="M-30 430 430-30h260L230 530H-30Z" fill="{accent}"/><circle cx="458" cy="240" r="142" fill="{ink}"/><circle cx="458" cy="240" r="78" fill="{bg}"/><path d="M458 98h142v284H458a142 142 0 0 0 0-284" fill="{accent}"/><text x="36" y="52" fill="{ink}" font-family="Arial,sans-serif" font-size="17" letter-spacing="3">STUDIO EXPLORATIONS</text><text x="36" y="462" fill="{ink}" font-family="Arial,sans-serif" font-size="17" letter-spacing="3">{label}</text><path d="M724 435h36m-18-18v36" stroke="{ink}" stroke-width="2"/></svg>'''
    (root/'assets/illustrations'/f'studio-{name}.svg').write_text(svg)

rate=22050
duration=8
with wave.open(str(root/'assets/audio/studio-ambient.wav'),'wb') as track:
    track.setnchannels(1); track.setsampwidth(2); track.setframerate(rate)
    samples=[]
    for i in range(rate*duration):
        t=i/rate
        fade=min(1,t/.8,(duration-t)/1.4)
        amplitude=sum(math.sin(2*math.pi*f*t)*(.045/(n+1)) for n,f in enumerate((220,277.18,329.63,440)))
        samples.append(struct.pack('<h',int(32767*amplitude*max(0,fade))))
    track.writeframes(b''.join(samples))
