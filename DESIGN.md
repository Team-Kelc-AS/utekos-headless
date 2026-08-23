---
name: Utekos Brand
colors:
  primary: "##b44701"
  secondary: "##00453e"
  surface: "##012622"
  on-surface: "##f0eee9"
  error: "##ffb4ab"
typography:
  body-md:
    fontFamily: Google Sans Flex
    fontSize: 16px
    fontWeight: 400
rounded:
  md: 12px
---


# Design System

## Overview
A focused, minimal dark interface for a developer productivity tool.
Clean lines, low visual noise, high information density.

## Colors
- **Primary** (#b44701): CTAs, active states, key interactive elements
- **Secondary** (#00453e): Supporting UI, chips, secondary actions
- **Surface** (#002521): Page backgrounds
- **On-surface** (#f0eee9): Primary text on dark backgrounds
- **Error** (#ffb4ab): Validation errors, destructive actions

## Typography
- **Headlines**: Google Sans Flex: --font-sans, extrabold
- **Body**: Google Sans Flex: --font-sans, regular, 16px
- **Labels**: Google Sans Flex: --font-sans, medium, 14px, uppercase for section headers

## Components
- **Buttons**: Rounded (12px), primary uses brand primary fill
- **Inputs**: 1px border, subtle surface-variant background
- **Cards**: No elevation, relies on border and background contrast

## Do's and Don'ts
- Do use the primary color sparingly, only for the most important action
- Don't mix rounded and sharp corners in the same view
- Do maintain 4:1 contrast ratio for all text