import type { AlarmTone } from '@/state/types'

const TONE_FREQUENCIES: Record<AlarmTone, number[]> = {
  bell: [880, 660],
  chime: [523, 659, 784],
  pulse: [440, 440, 440],
}

/**
 * Reproduce un tono de alarma usando Web Audio. No requiere archivos.
 * Devuelve false si el navegador no soporta AudioContext.
 */
export function playTone(tone: AlarmTone, volume = 0.6): boolean {
  const AudioContextCtor =
    typeof window !== 'undefined'
      ? window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      : undefined

  if (!AudioContextCtor) {
    return false
  }

  try {
    const ctx = new AudioContextCtor()
    const frequencies = TONE_FREQUENCIES[tone]
    const step = 0.18
    let time = ctx.currentTime

    for (const frequency of frequencies) {
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()

      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      gain.gain.setValueAtTime(0, time)
      gain.gain.linearRampToValueAtTime(volume, time + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, time + step)

      oscillator.connect(gain)
      gain.connect(ctx.destination)
      oscillator.start(time)
      oscillator.stop(time + step)

      time += step
    }

    // Cerrar el contexto tras reproducir.
    window.setTimeout(
      () => {
        void ctx.close()
      },
      Math.ceil(time * 1000) + 200,
    )

    return true
  } catch {
    return false
  }
}
