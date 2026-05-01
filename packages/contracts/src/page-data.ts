// Compatibility barrel for shared page-data contracts.
// Keep domain contracts in ./page-data/<domain>.ts so new cross-client shapes
// have an obvious owner while existing imports from ./page-data continue to work.
export * from './page-data/common'
export * from './page-data/content'
export * from './page-data/dashboard'
export * from './page-data/chat'
export * from './page-data/behavior'
export * from './page-data/reports'
export * from './page-data/preferences'
export * from './page-data/system'
