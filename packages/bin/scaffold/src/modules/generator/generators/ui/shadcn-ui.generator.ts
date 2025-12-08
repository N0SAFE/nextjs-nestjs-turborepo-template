/**
 * Shadcn UI Generator
 *
 * Sets up Shadcn UI component library with configuration.
 */
import { Injectable } from "@nestjs/common";
import { BaseGenerator } from "../../base/base.generator";
import type {
  GeneratorContext,
  FileSpec,
  DependencySpec,
  PostCommand,
} from "../../../../types/generator.types";

@Injectable()
export class ShadcnUiGenerator extends BaseGenerator {
  protected override metadata = {
    pluginId: "shadcn-ui",
    priority: 50,
    version: "1.0.0",
    description: "Shadcn UI component library",
    dependencies: ["nextjs", "tailwindcss"],
    contributesTo: ["packages/ui/base/*", "apps/web/components.json"],
  };

  protected override getFiles(context: GeneratorContext): FileSpec[] {
    return [
      this.file("apps/web/components.json", this.getComponentsJson(context)),
      this.file("packages/ui/base/package.json", this.getPackageJson()),
      this.file("packages/ui/base/tsconfig.json", this.getTsConfig()),
      this.file("packages/ui/base/src/index.ts", this.getIndexExports()),
      this.file("packages/ui/base/src/lib/utils.ts", this.getUtilsFile()),
      this.file("packages/ui/base/src/components/button.tsx", this.getButtonComponent()),
      this.file("packages/ui/base/src/components/card.tsx", this.getCardComponent()),
      this.file("packages/ui/base/src/components/input.tsx", this.getInputComponent()),
      this.file("packages/ui/base/src/components/label.tsx", this.getLabelComponent()),
      this.file("packages/ui/base/src/components/index.ts", this.getComponentsIndex()),
    ];
  }

  protected override getDependencies(context: GeneratorContext): DependencySpec[] {
    return [
      // UI Package dependencies
      { name: "@radix-ui/react-slot", version: "^1.1.1", type: "prod", target: "packages/ui/base" },
      { name: "@radix-ui/react-label", version: "^2.1.1", type: "prod", target: "packages/ui/base" },
      { name: "class-variance-authority", version: "^0.7.1", type: "prod", target: "packages/ui/base" },
      { name: "clsx", version: "^2.1.1", type: "prod", target: "packages/ui/base" },
      { name: "tailwind-merge", version: "^2.6.0", type: "prod", target: "packages/ui/base" },
      { name: "react", version: "^19.0.0", type: "peer", target: "packages/ui/base" },
      { name: "react-dom", version: "^19.0.0", type: "peer", target: "packages/ui/base" },
      { name: "typescript", version: "^5.7.2", type: "dev", target: "packages/ui/base" },
      { name: "@types/react", version: "^19.0.0", type: "dev", target: "packages/ui/base" },
      { name: "@types/react-dom", version: "^19.0.0", type: "dev", target: "packages/ui/base" },
      // Web app UI package reference
      { name: "@repo-ui/base", version: "*", type: "prod", target: "web" },
    ];
  }

  protected override getPostCommands(context: GeneratorContext): PostCommand[] {
    return [
      {
        command: "echo",
        args: ["Shadcn UI components installed. Run 'bunx shadcn@latest add <component>' to add more components."],
        cwd: "apps/web",
      },
    ];
  }

  private getComponentsJson(context: GeneratorContext): string {
    return `{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/styles/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@repo-ui/base",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
`;
  }

  private getPackageJson(): string {
    return `{
  "name": "@repo-ui/base",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./components/*": "./src/components/*.tsx",
    "./lib/*": "./src/lib/*.ts"
  },
  "scripts": {
    "type-check": "tsc --noEmit",
    "lint": "eslint src/"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "dependencies": {
    "@radix-ui/react-label": "^2.1.1",
    "@radix-ui/react-slot": "^1.1.1",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.7.2"
  }
}
`;
  }

  private getTsConfig(): string {
    return `{
  "extends": "@repo-configs/typescript/react-library.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
`;
  }

  private getIndexExports(): string {
    return `// Re-export all components
export * from "./components";

// Re-export utilities
export * from "./lib/utils";
`;
  }

  private getUtilsFile(): string {
    return `import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
`;
  }

  private getButtonComponent(): string {
    return `import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
`;
  }

  private getCardComponent(): string {
    return `import * as React from "react";
import { cn } from "../lib/utils";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
`;
  }

  private getInputComponent(): string {
    return `import * as React from "react";
import { cn } from "../lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
`;
  }

  private getLabelComponent(): string {
    return `"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
`;
  }

  private getComponentsIndex(): string {
    return `export { Button, buttonVariants, type ButtonProps } from "./button";
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "./card";
export { Input, type InputProps } from "./input";
export { Label } from "./label";
`;
  }
}
