import { render as reactEmailRender } from '@react-email/render';
import * as React from 'react';

/**
 * Renders React Email component to HTML string
 * @param component - React Email component to render
 * @returns HTML string ready to send via email service
 */
export async function renderEmail(component: React.ReactElement): Promise<string> {
  return await reactEmailRender(component, {
    pretty: false,
  });
}

/**
 * Renders React Email component to plain text
 * @param component - React Email component to render
 * @returns Plain text version of the email
 */
export async function renderEmailText(component: React.ReactElement): Promise<string> {
  return await reactEmailRender(component, {
    plainText: true,
  });
}
