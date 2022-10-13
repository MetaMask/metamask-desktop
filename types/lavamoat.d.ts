declare module 'lavamoat' {
  type runLavaOptions = {
    entryPath: string;
    writeAutoPolicy?: boolean;
    writeAutoPolicyDebug?: string;
    writeAutoPolicyAndRun?: boolean;
    policyPath?: string;
    policyDebugPath?: string;
    policyOverridePath?: string;
    projectRoot?: string;
    debugMode?: boolean;
    statsMode?: boolean;
    isPackagedApp?: boolean;
  };

  export function runLava(options: runLavaOptions): Promise<void>;
}
