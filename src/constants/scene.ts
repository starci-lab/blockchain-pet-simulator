export const SceneName = {
  Bootstrap: 'bootstrap',
  Loading: 'loading',
  Gameplay: 'gameplay',
  Data: 'data',
  UI: 'ui',
  Sound: 'sound'
} as const

export type SceneName = (typeof SceneName)[keyof typeof SceneName]
