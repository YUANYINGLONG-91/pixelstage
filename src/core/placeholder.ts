/**
 * Public entry for the placeholder scene generator — implementation lives in
 * ./placeholder/ (pixel kit, material/prop/character painters, four themes).
 * This barrel keeps every existing `@/core/placeholder` import working.
 */
export {
  PLACEHOLDER_META,
  createPlaceholderScene,
  getCachedPlaceholderScene,
  type PlaceholderTheme,
} from "./placeholder/index";
