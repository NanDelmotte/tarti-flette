// src/lib/appCopy.ts

/**
 * Centralized app naming & copy variants.
 * Change these values once to rename the app everywhere.
 */

export const appCopy = {
    // Brand / product name (used in titles, welcome screens, meta, etc.)
  appName: "Cirklie", // or "Palinky"
  
  noun: {
    singular: "Cirklie",        // a Cirklie
    plural: "Cirklies",         // your Cirklies
  },

  verb: {
    present: "create an Appnamie",         // you cirklie / you cirklie someone
    past: "Appnamied",           // you have cirklied
  },

  // Optional helpers for common phrases (safe to expand later)
  phrases: {
    aSingular: "an Appie",
    yourPlural: "your App-ies",
    havePast: "you have created an App-ie",
  },
} as const;
