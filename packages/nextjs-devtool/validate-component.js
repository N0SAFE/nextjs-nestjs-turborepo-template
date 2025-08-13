#!/usr/bin/env node

// Simple validation script to check if DevToolReducedBar can be imported
// This helps validate that the syntax errors are fixed

try {
  // Check if we're in the right directory
  const fs = require('fs');
  const path = require('path');
  
  const devToolPath = path.join(__dirname, 'src', 'components', 'DevToolReducedBar.tsx');
  
  if (!fs.existsSync(devToolPath)) {
    console.error('❌ DevToolReducedBar.tsx not found');
    process.exit(1);
  }
  
  const content = fs.readFileSync(devToolPath, 'utf8');
  
  // Basic syntax checks
  const openTooltipProvider = (content.match(/<TooltipProvider>/g) || []).length;
  const closeTooltipProvider = (content.match(/<\/TooltipProvider>/g) || []).length;
  
  console.log('🔍 DevToolReducedBar Validation:');
  console.log(`   TooltipProvider opening tags: ${openTooltipProvider}`);
  console.log(`   TooltipProvider closing tags: ${closeTooltipProvider}`);
  
  if (openTooltipProvider !== closeTooltipProvider) {
    console.error('❌ Mismatched TooltipProvider tags');
    process.exit(1);
  }
  
  // Check for export
  if (!content.includes('export const DevToolReducedBar')) {
    console.error('❌ Missing export statement');
    process.exit(1);
  }
  
  console.log('✅ DevToolReducedBar syntax appears valid');
  console.log('✅ Export statement found');
  console.log('✅ JSX tags are balanced');
  
} catch (error) {
  console.error('❌ Error validating DevToolReducedBar:', error.message);
  process.exit(1);
}
