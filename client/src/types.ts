export interface UnityBuildFiles {
  unityLoaderJsPath: string;
  dataUrl: string;
  frameworkUrl: string;
  codeUrl: string;
}

interface GameDetails {
  id: string;
  name: string;
  description: string;
  version: string;
  developer: {
    name: string;
    url: string;
  };
  destination: {
    url: string;
    label: 'wishlist' | 'download' | 'buy' | 'follow';
    platform: string;
  };
  genres: string[];
  orientation: 'portrait' | 'landscape' | 'any';
  minimumAge: number;
  estimatedDownloadMb: number;
  status: 'active' | 'hidden';
}

export type ManagedUnityGame = GameDetails & {
  source: {
    type: 'managed-unity';
    gameId: string;
  };
};

export type HostedPageGame = GameDetails & {
  source: {
    type: 'hosted-page';
    url: string;
  };
};

export type Game = ManagedUnityGame | HostedPageGame;

export interface GameCatalog {
  schemaVersion: 1;
  games: Game[];
}
