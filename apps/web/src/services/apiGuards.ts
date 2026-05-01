// Compatibility barrel for frontend API response guards.
// Keep real guard implementations in ./apiGuards/<domain>.ts so response
// validation follows the same domain map as contracts and Worker services.
export * from './apiGuards/dashboard';
export * from './apiGuards/content';
export * from './apiGuards/behavior';
export * from './apiGuards/reports';
export * from './apiGuards/preferences';
export * from './apiGuards/system';
export * from './apiGuards/chat';
