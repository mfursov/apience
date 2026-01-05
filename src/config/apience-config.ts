export interface ApienceGlobalConfig {
  /**
   * Require documentation for all endpoints.
   * When true, throws an error at mount time if endpoint is missing 'doc' field.
   * Default: false
   */
  requireDocs?: boolean;
  /**
   * Show warning for endpoints without documentation during startup.
   * When true, logs a brief warning for each endpoint without 'doc' field.
   * Default: false
   */
  warnOnMissingDocs?: boolean;
}

const defaultConfig: ApienceGlobalConfig = {
  requireDocs: false,
  warnOnMissingDocs: false,
};

let currentConfig: ApienceGlobalConfig = { ...defaultConfig };

/**
 * Configure global Apience settings.
 * @param config Partial configuration to merge with current settings
 */
export function configureApience(config: Partial<ApienceGlobalConfig>): void {
  currentConfig = { ...currentConfig, ...config };
}

/**
 * Get current Apience configuration.
 */
export function getApienceConfig(): ApienceGlobalConfig {
  return currentConfig;
}

/**
 * Reset Apience configuration to defaults.
 * Useful for testing.
 */
export function resetApienceConfig(): void {
  currentConfig = { ...defaultConfig };
}
