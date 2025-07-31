// Gestionnaire de sons pour l'application NOW

class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private isEnabled: boolean = true;

  constructor() {
    this.loadSounds();
  }

  private loadSounds() {
    const soundFiles = [
      { name: 'start', file: 'start.mp3' },
      { name: 'end-session', file: 'end-session.mp3' },
      { name: 'end-pause', file: 'end-pause.mp3' }
    ];

    soundFiles.forEach(({ name, file }) => {
      const audio = new Audio(`/${file}`);
      audio.preload = 'auto';
      this.sounds.set(name, audio);
    });
  }

  public play(soundName: string) {
    if (!this.isEnabled) return;

    const sound = this.sounds.get(soundName);
    if (sound) {
      // Réinitialiser le son au début pour pouvoir le rejouer
      sound.currentTime = 0;
      sound.play().catch(error => {
        console.warn(`Erreur lors de la lecture du son ${soundName}:`, error);
      });
    } else {
      console.warn(`Son non trouvé: ${soundName}`);
    }
  }

  public enable() {
    this.isEnabled = true;
  }

  public disable() {
    this.isEnabled = false;
  }

  public isSoundEnabled() {
    return this.isEnabled;
  }
}

// Instance singleton
export const soundManager = new SoundManager(); 