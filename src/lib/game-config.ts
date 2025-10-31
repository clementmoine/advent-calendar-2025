// Game configuration interface
export interface GameConfig {
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: string;
  objective: string;
  logo: string;
  instructions: string[];
  tips?: string[];
}

// Function to load game configuration
export async function loadGameConfig(gameId: string): Promise<GameConfig> {
  try {
    const config = await import(`@/games/${gameId}/config.json`);
    return config.default;
  } catch (error) {
    console.error(`Failed to load config for game ${gameId}:`, error);
    // Fallback configuration
    return {
      name: gameId.charAt(0).toUpperCase() + gameId.slice(1),
      description: `Jeu ${gameId}`,
      difficulty: 'medium',
      estimatedTime: '5-10 minutes',
      objective: 'Terminer le jeu',
      logo: '🎮',
      instructions: ['Jouez et amusez-vous !'],
    };
  }
}
