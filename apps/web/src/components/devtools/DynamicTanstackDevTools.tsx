'use client'

import { PHASE_PRODUCTION_BUILD } from "next/dist/shared/lib/constants";
import dynamic from "next/dynamic";
import type { TanStackDevToolsProps } from './TanStackDevTools';
import React from "react";

export const DynamicTanstackDevTools = process.env.NODE_ENV === 'development' && process.env.PHASE !== PHASE_PRODUCTION_BUILD ? dynamic(
    () => import('./TanStackDevTools').then((mod) => mod.TanStackDevTools),
    { ssr: false }
) as React.ComponentType<TanStackDevToolsProps> : dynamic(
    () => Promise.resolve(() => null)
)