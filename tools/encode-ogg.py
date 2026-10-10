"""Optional WAV to Vorbis encoder for render-audio.cjs (requires soundfile)."""
import sys
import soundfile as sf
samples, rate = sf.read(sys.argv[1])
sf.write(sys.argv[2], samples, rate, format='OGG', subtype='VORBIS')
